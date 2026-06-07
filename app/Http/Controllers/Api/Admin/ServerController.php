<?php

namespace Realm\Http\Controllers\Api\Admin;

use Carbon\CarbonImmutable;
use Exception;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;
use Realm\Enum\JwtScope;
use Realm\Exceptions\DisplayException;
use Realm\Exceptions\Http\Connection\DaemonConnectionException;
use Realm\Exceptions\Service\Deployment\NoViableAllocationException;
use Realm\Exceptions\Service\Deployment\NoViableNodeException;
use Realm\Http\Requests\Admin\ServerFormRequest;
use Realm\Models\Location;
use Realm\Models\Node;
use Realm\Exceptions\Model\DataValidationException;
use Realm\Http\Controllers\Controller;
use Realm\Http\Requests\Admin\Servers\Databases\StoreServerDatabaseRequest;
use Realm\Models\Allocation;
use Realm\Models\Database;
use Realm\Models\Filters\AdminServerFilter;
use Realm\Models\Mount;
use Realm\Models\MountServer;
use Realm\Models\Server;
use Realm\Models\ServerTransfer;
use Realm\Models\User;
use Realm\Repositories\Eloquent\DatabaseHostRepository;
use Realm\Repositories\Eloquent\MountRepository;
use Realm\Repositories\Eloquent\NodeRepository;
use Realm\Repositories\Wings\DaemonTransferRepository;
use Realm\Services\Databases\DatabaseManagementService;
use Realm\Services\Databases\DatabasePasswordService;
use Realm\Services\Nodes\NodeJWTService;
use Realm\Services\Servers\BuildModificationService;
use Realm\Services\Servers\DetailsModificationService;
use Realm\Services\Servers\EnvironmentService;
use Realm\Services\Servers\ReinstallServerService;
use Realm\Services\Servers\ServerCreationService;
use Realm\Services\Servers\ServerDeletionService;
use Realm\Services\Servers\StartupModificationService;
use Realm\Services\Servers\SuspensionService;
use Realm\Contracts\Repository\AllocationRepositoryInterface;
use Realm\Contracts\Repository\NestRepositoryInterface;
use Realm\Contracts\Repository\ServerRepositoryInterface;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;
use Throwable;

class ServerController extends Controller
{
    public function __construct(
        private ServerCreationService $creationService,
        private DetailsModificationService $detailsModificationService,
        private BuildModificationService $buildModificationService,
        private StartupModificationService $startupModificationService,
        private DatabaseManagementService $databaseManagementService,
        private DatabasePasswordService $databasePasswordService,
        private DatabaseHostRepository $databaseHostRepository,
        private MountRepository $mountRepository,
        private ReinstallServerService $reinstallService,
        private ServerDeletionService $deletionService,
        private SuspensionService $suspensionService,
        private ServerRepositoryInterface $repository,
        private NestRepositoryInterface $nestRepository,
        private EnvironmentService $environmentService,
        private NodeRepository $nodeRepository,
        private AllocationRepositoryInterface $allocationRepository,
        private ConnectionInterface $connection,
        private DaemonTransferRepository $daemonTransferRepository,
        private NodeJWTService $nodeJWTService,
    ) {
    }

    public function create(): JsonResponse
    {
        $locations = Location::query()->with('nodes')->get();
        $hasNodes = Node::query()->exists();

        return response()->json([
            'has_locations' => $locations->isNotEmpty(),
            'has_nodes' => $hasNodes,
            'locations' => $locations->map(fn (Location $location) => [
                'id' => $location->id,
                'short' => $location->short,
                'long' => $location->long,
                'nodes' => $location->nodes->map(fn (Node $node) => [
                    'id' => $node->id,
                    'name' => $node->name,
                ])->values(),
            ])->values(),
            'node_options' => $this->nodeRepository->getNodesForServerCreation(),
            'nests' => $this->formatNestsWithEggs(),
        ]);
    }

    /**
     * @throws ValidationException
     * @throws DisplayException
     * @throws NoViableAllocationException
     * @throws NoViableNodeException
     * @throws Throwable
     */
    public function store(ServerFormRequest $request): JsonResponse
    {
        $data = $request->except(['_token']);

        if (!empty($data['custom_image'])) {
            $data['image'] = $data['custom_image'];
            unset($data['custom_image']);
        }

        if ($request->has('start_on_completion')) {
            $data['start_on_completion'] = $request->boolean('start_on_completion');
        }

        try {
            $server = $this->creationService->handle($data);
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (DisplayException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        } catch (DaemonConnectionException $exception) {
            return response()->json([
                'message' => 'Server was created but the daemon could not be reached: ' . $exception->getMessage(),
            ], 502);
        } catch (Throwable $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Server was created successfully.',
            'server' => [
                'id' => $server->id,
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $servers = QueryBuilder::for(Server::query()->with('node', 'user', 'allocation'))
            ->allowedFilters([
                AllowedFilter::exact('owner_id'),
                AllowedFilter::custom('*', new AdminServerFilter()),
            ])
            ->paginate(config()->get('realm.paginate.admin.servers'));

        return response()->json([
            'servers' => collect($servers->items())->map(fn (Server $server) => $this->transformListItem($server))->values(),
            'pagination' => [
                'current_page' => $servers->currentPage(),
                'last_page' => $servers->lastPage(),
                'total' => $servers->total(),
            ],
        ]);
    }

    public function show(Server $server): JsonResponse
    {
        $server->load(['user', 'node', 'allocation', 'nest', 'egg']);

        return response()->json([
            'server' => $this->transformDetail($server),
        ]);
    }

    public function details(Server $server): JsonResponse
    {
        $this->ensureInstalled($server);
        $server->load('user');

        return response()->json([
            'server' => [
                'id' => $server->id,
                'name' => $server->name,
                'external_id' => $server->external_id,
                'description' => $server->description,
                'owner_id' => $server->owner_id,
                'owner' => $server->user ? [
                    'id' => $server->user->id,
                    'email' => $server->user->email,
                    'username' => $server->user->username,
                    'name_first' => $server->user->name_first,
                    'name_last' => $server->user->name_last,
                ] : null,
            ],
        ]);
    }

    public function updateDetails(Request $request, Server $server): JsonResponse
    {
        $this->ensureInstalled($server);

        try {
            $this->detailsModificationService->handle($server, $request->only([
                'owner_id', 'external_id', 'name', 'description',
            ]));
        } catch (DataValidationException $exception) {
            throw ValidationException::withMessages($exception->getValidator()->errors()->toArray());
        }

        return response()->json([
            'success' => true,
            'message' => 'Server details were updated successfully.',
        ]);
    }

    public function build(Server $server): JsonResponse
    {
        $this->ensureInstalled($server);

        $allocations = $server->node->allocations()->orderBy('ip')->orderBy('port')->get();

        return response()->json([
            'server' => [
                'id' => $server->id,
                'allocation_id' => $server->allocation_id,
                'cpu' => $server->cpu,
                'threads' => $server->threads,
                'memory' => $server->memory,
                'swap' => $server->swap,
                'disk' => $server->disk,
                'io' => $server->io,
                'oom_disabled' => $server->oom_disabled,
                'database_limit' => $server->database_limit,
                'allocation_limit' => $server->allocation_limit,
                'backup_limit' => $server->backup_limit,
                'subdomain_limit' => $server->subdomain_limit,
            ],
            'assigned_allocations' => $allocations->where('server_id', $server->id)->values()->map(fn (Allocation $allocation) => [
                'id' => $allocation->id,
                'label' => $allocation->alias . ':' . $allocation->port,
            ]),
            'unassigned_allocations' => $allocations->whereNull('server_id')->values()->map(fn (Allocation $allocation) => [
                'id' => $allocation->id,
                'label' => $allocation->alias . ':' . $allocation->port,
            ]),
        ]);
    }

    public function updateBuild(Request $request, Server $server): JsonResponse
    {
        $this->ensureInstalled($server);

        try {
            $this->buildModificationService->handle($server, $request->only([
                'allocation_id', 'add_allocations', 'remove_allocations',
                'memory', 'swap', 'io', 'cpu', 'threads', 'disk',
                'database_limit', 'allocation_limit', 'backup_limit', 'subdomain_limit', 'oom_disabled',
            ]));
        } catch (DataValidationException $exception) {
            throw ValidationException::withMessages($exception->getValidator()->errors()->toArray());
        } catch (DisplayException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Server build configuration was updated successfully.',
        ]);
    }

    public function startup(Server $server): JsonResponse
    {
        $this->ensureInstalled($server);

        return response()->json([
            'server' => [
                'startup' => $server->startup,
                'nest_id' => $server->nest_id,
                'egg_id' => $server->egg_id,
                'image' => $server->image,
                'skip_scripts' => $server->skip_scripts,
            ],
            'variables' => $this->environmentService->handle($server),
            'nests' => $this->formatNestsWithEggs(),
        ]);
    }

    public function updateStartup(Request $request, Server $server): JsonResponse
    {
        $this->ensureInstalled($server);

        $data = $request->all();
        if (!empty($data['custom_docker_image'])) {
            $data['docker_image'] = $data['custom_docker_image'];
            unset($data['custom_docker_image']);
        }

        try {
            $this->startupModificationService
                ->setUserLevel(User::USER_LEVEL_ADMIN)
                ->handle($server, $data);
        } catch (DataValidationException $exception) {
            throw ValidationException::withMessages($exception->getValidator()->errors()->toArray());
        }

        return response()->json([
            'success' => true,
            'message' => 'Server startup configuration was updated successfully.',
        ]);
    }

    public function databases(Server $server): JsonResponse
    {
        $this->ensureInstalled($server);
        $server->load(['databases.host']);

        return response()->json([
            'databases' => $server->databases->map(fn (Database $database) => [
                'id' => $database->id,
                'database' => $database->database,
                'username' => $database->username,
                'remote' => $database->remote,
                'max_connections' => $database->max_connections,
                'host' => $database->host ? [
                    'id' => $database->host->id,
                    'name' => $database->host->name,
                    'host' => $database->host->host,
                    'port' => $database->host->port,
                ] : null,
            ])->values(),
            'hosts' => $this->databaseHostRepository->all()->map(fn ($host) => [
                'id' => $host->id,
                'name' => $host->name,
            ])->values(),
        ]);
    }

    public function storeDatabase(StoreServerDatabaseRequest $request, Server $server): JsonResponse
    {
        $this->ensureInstalled($server);

        try {
            $this->databaseManagementService->create($server, [
                'database' => DatabaseManagementService::generateUniqueDatabaseName($request->input('database'), $server->id),
                'remote' => $request->input('remote'),
                'database_host_id' => $request->input('database_host_id'),
                'max_connections' => $request->input('max_connections'),
            ]);
        } catch (Throwable $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Database was created successfully.',
        ]);
    }

    public function resetDatabasePassword(Request $request, Server $server): JsonResponse
    {
        $this->ensureInstalled($server);

        /** @var Database $database */
        $database = $server->databases()->findOrFail($request->input('database'));

        try {
            $this->databasePasswordService->handle($database);
        } catch (Throwable $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Database password was reset successfully.',
        ]);
    }

    public function destroyDatabase(Server $server, Database $database): JsonResponse
    {
        $this->ensureInstalled($server);

        if ($database->server_id !== $server->id) {
            abort(404);
        }

        try {
            $this->databaseManagementService->delete($database);
        } catch (Exception $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Database was deleted successfully.',
        ]);
    }

    public function mounts(Server $server): JsonResponse
    {
        $this->ensureInstalled($server);
        $server->load('mounts');
        $mounts = $this->mountRepository->getMountListForServer($server);
        $mountedIds = $server->mounts->pluck('id')->toArray();

        return response()->json([
            'mounts' => $mounts->map(fn (Mount $mount) => [
                'id' => $mount->id,
                'name' => $mount->name,
                'source' => $mount->source,
                'target' => $mount->target,
                'mounted' => in_array($mount->id, $mountedIds, true),
            ])->values(),
        ]);
    }

    public function storeMount(Request $request, Server $server): JsonResponse
    {
        $this->ensureInstalled($server);

        $request->validate(['mount_id' => 'required|integer|exists:mounts,id']);

        $mountServer = (new MountServer())->forceFill([
            'mount_id' => $request->input('mount_id'),
            'server_id' => $server->id,
        ]);

        try {
            $mountServer->saveOrFail();
        } catch (Throwable $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Mount was added successfully.',
        ]);
    }

    public function destroyMount(Server $server, Mount $mount): JsonResponse
    {
        $this->ensureInstalled($server);

        MountServer::query()
            ->where('mount_id', $mount->id)
            ->where('server_id', $server->id)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Mount was removed successfully.',
        ]);
    }

    public function manage(Server $server): JsonResponse
    {
        if ($server->status === Server::STATUS_INSTALL_FAILED) {
            return response()->json([
                'message' => 'This server is in a failed install state and cannot be recovered. Please delete and re-create the server.',
            ], 422);
        }

        $server->load('transfer');
        $nodes = $this->nodeRepository->all();
        $canTransfer = count($nodes) >= 2;

        return response()->json([
            'server' => [
                'id' => $server->id,
                'is_installed' => $server->isInstalled(),
                'is_suspended' => $server->isSuspended(),
                'status' => $server->status,
                'node_id' => $server->node_id,
                'transfer' => $server->transfer ? [
                    'created_at' => $server->transfer->created_at?->toIso8601String(),
                ] : null,
            ],
            'can_transfer' => $canTransfer,
            'node_options' => $this->nodeRepository->getNodesForServerCreation()
                ->filter(fn (array $node) => $node['id'] !== $server->node_id)
                ->values(),
        ]);
    }

    public function reinstall(Server $server): JsonResponse
    {
        try {
            $this->reinstallService->handle($server);
        } catch (DisplayException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Server has begun the reinstallation process.',
        ]);
    }

    public function toggleInstall(Server $server): JsonResponse
    {
        if ($server->status === Server::STATUS_INSTALL_FAILED) {
            return response()->json(['message' => 'This server is marked as failed and cannot have its installation status changed.'], 422);
        }

        $this->repository->update($server->id, [
            'status' => $server->isInstalled() ? Server::STATUS_INSTALLING : null,
        ], true, true);

        return response()->json([
            'success' => true,
            'message' => 'Installation status was toggled successfully.',
        ]);
    }

    public function suspend(Request $request, Server $server): JsonResponse
    {
        try {
            $this->suspensionService->toggle($server, $request->input('action'));
        } catch (DisplayException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Server suspension status was updated successfully.',
        ]);
    }

    public function transfer(Request $request, Server $server): JsonResponse
    {
        $validatedData = $request->validate([
            'node_id' => 'required|exists:nodes,id',
            'allocation_id' => 'required|bail|unique:servers|exists:allocations,id',
            'allocation_additional' => 'nullable|array',
            'allocation_additional.*' => 'integer|exists:allocations,id',
        ]);

        $nodeId = (int) $validatedData['node_id'];
        $allocationId = (int) $validatedData['allocation_id'];
        $additionalAllocations = array_map('intval', $validatedData['allocation_additional'] ?? []);

        $node = $this->nodeRepository->getNodeWithResourceUsage($nodeId);
        if (!$node->isViable($server->memory, $server->disk)) {
            return response()->json(['message' => 'The selected node does not have enough disk or memory available.'], 422);
        }

        try {
            $server->validateTransferState();
        } catch (DisplayException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        try {
            $this->connection->transaction(function () use ($server, $nodeId, $allocationId, $additionalAllocations) {
                $transfer = new ServerTransfer();
                $transfer->server_id = $server->id;
                $transfer->old_node = $server->node_id;
                $transfer->new_node = $nodeId;
                $transfer->old_allocation = $server->allocation_id;
                $transfer->new_allocation = $allocationId;
                $transfer->old_additional_allocations = $server->allocations->where('id', '!=', $server->allocation_id)->pluck('id')->values()->toArray();
                $transfer->new_additional_allocations = $additionalAllocations;
                $transfer->save();

                $this->assignAllocationsToServer($server, $nodeId, $allocationId, $additionalAllocations);

                $token = $this->nodeJWTService
                    ->setExpiresAt(CarbonImmutable::now()->addMinutes(15))
                    ->setSubject($server->uuid)
                    ->setScopes(JwtScope::ServerTransfer)
                    ->handle($transfer->newNode, $server->uuid);

                $this->daemonTransferRepository->setServer($server)->notify($transfer->newNode, $token);
            });
        } catch (Throwable $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Server transfer has been started successfully.',
        ]);
    }

    public function destroy(Request $request, Server $server): JsonResponse
    {
        try {
            $this->deletionService->withForce($request->boolean('force'))->handle($server);
        } catch (DisplayException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        } catch (Throwable $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Server was deleted successfully.',
        ]);
    }

    /**
     * @throws Throwable
     */
    public function duplicate(Server $server): JsonResponse
    {
        $server->load('variables');

        $allocation = Allocation::query()
            ->where('node_id', $server->node_id)
            ->whereNull('server_id')
            ->first();

        if (!$allocation) {
            return response()->json([
                'message' => 'No free allocations are available on this server\'s node. Add an allocation before duplicating.',
            ], 400);
        }

        $environment = [];
        foreach ($server->variables as $variable) {
            $environment[$variable->env_variable] = $variable->server_value ?? $variable->default_value ?? '';
        }

        try {
            $newServer = $this->creationService->handle([
                'name' => $server->name . ' (Copy)',
                'description' => $server->description,
                'owner_id' => $server->owner_id,
                'node_id' => $server->node_id,
                'allocation_id' => $allocation->id,
                'nest_id' => $server->nest_id,
                'egg_id' => $server->egg_id,
                'startup' => $server->startup,
                'image' => $server->image,
                'memory' => $server->memory,
                'swap' => $server->swap,
                'disk' => $server->disk,
                'io' => $server->io,
                'cpu' => $server->cpu,
                'threads' => $server->threads,
                'oom_disabled' => $server->oom_disabled,
                'database_limit' => $server->database_limit,
                'allocation_limit' => $server->allocation_limit,
                'backup_limit' => $server->backup_limit,
                'subdomain_limit' => $server->subdomain_limit,
                'skip_scripts' => false,
                'environment' => $environment,
            ]);
        } catch (DaemonConnectionException $exception) {
            return response()->json([
                'message' => 'Server was created but the daemon could not be reached: ' . $exception->getMessage(),
            ], 502);
        }

        return response()->json([
            'success' => true,
            'message' => 'Server duplicated successfully. The copy is now installing.',
            'server' => [
                'id' => $newServer->id,
            ],
        ]);
    }

    private function formatNestsWithEggs(): \Illuminate\Support\Collection
    {
        return $this->nestRepository->getWithEggs()->map(fn ($nest) => [
            'id' => $nest->id,
            'name' => $nest->name,
            'startup' => $nest->startup,
            'eggs' => $nest->eggs->map(fn ($egg) => [
                'id' => $egg->id,
                'name' => $egg->name,
                'nest_id' => $egg->nest_id,
                'startup' => $egg->startup,
                'docker_images' => $egg->docker_images,
                'variables' => $egg->variables->map(fn ($variable) => [
                    'env_variable' => $variable->env_variable,
                    'name' => $variable->name,
                    'description' => $variable->description,
                    'default_value' => $variable->default_value,
                    'rules' => $variable->rules,
                    'required' => (bool) $variable->required,
                ])->values(),
            ])->values(),
        ])->values();
    }

    private function ensureInstalled(Server $server): void
    {
        if (!$server->isInstalled()) {
            abort(Response::HTTP_FORBIDDEN, 'Access to this resource is not allowed due to the current installation state.');
        }
    }

    private function assignAllocationsToServer(Server $server, int $nodeId, int $allocationId, array $additionalAllocations): void
    {
        $allocations = $additionalAllocations;
        $allocations[] = $allocationId;

        $unassigned = $this->allocationRepository->getUnassignedAllocationIds($nodeId);

        $updateIds = [];
        foreach ($allocations as $allocation) {
            if (!in_array($allocation, $unassigned, true)) {
                continue;
            }

            $updateIds[] = $allocation;
        }

        if (!empty($updateIds)) {
            $this->allocationRepository->updateWhereIn('id', $updateIds, ['server_id' => $server->id]);
        }
    }

    private function transformListItem(Server $server): array
    {
        return [
            'id' => $server->id,
            'name' => $server->name,
            'uuid' => $server->uuid,
            'uuid_short' => $server->uuidShort,
            'owner' => $server->user ? [
                'id' => $server->user->id,
                'username' => $server->user->username,
            ] : null,
            'node' => $server->node ? [
                'id' => $server->node->id,
                'name' => $server->node->name,
            ] : null,
            'allocation' => $server->allocation ? [
                'alias' => $server->allocation->alias,
                'port' => $server->allocation->port,
            ] : null,
            'status' => $this->resolveServerStatus($server),
        ];
    }

    private function transformDetail(Server $server): array
    {
        return [
            'id' => $server->id,
            'name' => $server->name,
            'description' => $server->description,
            'external_id' => $server->external_id,
            'uuid' => $server->uuid,
            'uuid_short' => $server->uuidShort,
            'cpu' => $server->cpu,
            'threads' => $server->threads,
            'memory' => $server->memory,
            'swap' => $server->swap,
            'disk' => $server->disk,
            'io' => $server->io,
            'status' => $server->status,
            'is_installed' => $server->isInstalled(),
            'is_suspended' => $server->isSuspended(),
            'nest' => $server->nest ? [
                'id' => $server->nest->id,
                'name' => $server->nest->name,
            ] : null,
            'egg' => $server->egg ? [
                'id' => $server->egg->id,
                'name' => $server->egg->name,
            ] : null,
            'owner' => $server->user ? [
                'id' => $server->user->id,
                'username' => $server->user->username,
                'email' => $server->user->email,
            ] : null,
            'node' => $server->node ? [
                'id' => $server->node->id,
                'name' => $server->node->name,
            ] : null,
            'allocation' => $server->allocation ? [
                'ip' => $server->allocation->ip,
                'alias' => $server->allocation->alias,
                'port' => $server->allocation->port,
                'has_alias' => $server->allocation->has_alias,
            ] : null,
        ];
    }

    private function resolveServerStatus(Server $server): string
    {
        if ($server->isSuspended()) {
            return 'suspended';
        }

        if (!$server->isInstalled()) {
            return 'installing';
        }

        return 'active';
    }
}
