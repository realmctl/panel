<?php

namespace Realm\Http\Controllers\Api\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Contracts\Encryption\Encrypter;
use Realm\Exceptions\DisplayException;
use Realm\Exceptions\Model\DataValidationException;
use Realm\Exceptions\Repository\RecordNotFoundException;
use Realm\Exceptions\Http\Connection\DaemonConnectionException;
use Realm\Exceptions\Service\HasActiveServersException;
use Realm\Exceptions\Service\Allocation\ServerUsingAllocationException;
use Realm\Http\Controllers\Controller;
use Realm\Http\Requests\Admin\Node\AllocationAliasFormRequest;
use Realm\Http\Requests\Admin\Node\AllocationFormRequest;
use Realm\Http\Requests\Admin\Node\NodeFormRequest;
use Realm\Models\Allocation;
use Realm\Models\ApiKey;
use Realm\Models\Node;
use Realm\Models\Server;
use Realm\Repositories\Wings\DaemonConfigurationRepository;
use Realm\Services\Api\KeyCreationService;
use Realm\Services\Helpers\SoftwareVersionService;
use Realm\Services\Nodes\NodeCreationService;
use Realm\Services\Nodes\NodeDeletionService;
use Realm\Services\Nodes\NodeUpdateService;
use Realm\Contracts\Repository\AllocationRepositoryInterface;
use Realm\Contracts\Repository\LocationRepositoryInterface;
use Realm\Contracts\Repository\NodeRepositoryInterface;
use Realm\Contracts\Repository\ServerRepositoryInterface;
use Realm\Services\Allocations\AllocationDeletionService;
use Realm\Services\Allocations\AssignmentService;
use Illuminate\Support\Str;
use Spatie\QueryBuilder\QueryBuilder;
use Throwable;

class NodeController extends Controller
{
    public function __construct(
        private NodeRepositoryInterface $repository,
        private LocationRepositoryInterface $locationRepository,
        private ServerRepositoryInterface $serverRepository,
        private NodeCreationService $creationService,
        private NodeUpdateService $updateService,
        private NodeDeletionService $deletionService,
        private SoftwareVersionService $versionService,
        private DaemonConfigurationRepository $daemonConfigurationRepository,
        private Encrypter $encrypter,
        private KeyCreationService $keyCreationService,
        private AllocationRepositoryInterface $allocationRepository,
        private AllocationDeletionService $allocationDeletionService,
        private AssignmentService $assignmentService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $nodes = QueryBuilder::for(
            Node::query()->with('location')->withCount('servers')
        )
            ->allowedFilters(['uuid', 'name'])
            ->allowedSorts(['id'])
            ->paginate(25);

        return response()->json([
            'nodes' => collect($nodes->items())->map(fn (Node $node) => $this->transformNodeListItem($node))->values(),
            'pagination' => [
                'current_page' => $nodes->currentPage(),
                'last_page' => $nodes->lastPage(),
                'total' => $nodes->total(),
            ],
        ]);
    }

    public function create(Request $request): JsonResponse
    {
        return response()->json([
            'locations' => $this->locationRepository->all()->map(fn ($location) => [
                'id' => $location->id,
                'short' => $location->short,
                'long' => $location->long,
            ])->values(),
            'panel_secure' => $request->isSecure(),
            'latest_daemon_version' => $this->versionService->getDaemon(),
        ]);
    }

    /**
     * @throws DataValidationException
     */
    public function store(NodeFormRequest $request): JsonResponse
    {
        $node = $this->creationService->handle($request->normalize());

        return response()->json([
            'success' => true,
            'message' => 'Successfully created a new node on the system.',
            'node' => [
                'id' => $node->id,
            ],
        ]);
    }

    public function health(Node $node): JsonResponse
    {
        try {
            $data = $this->daemonConfigurationRepository->setNode($node)->getSystemInformation();

            return response()->json([
                'version' => $data['version'] ?? '',
            ]);
        } catch (DaemonConnectionException) {
            return response()->json([
                'error' => 'Offline — could not connect',
            ], 503);
        }
    }

    public function show(Node $node): JsonResponse
    {
        $node = $this->repository->loadLocationAndServerCount($node);

        return response()->json([
            'node' => [
                'id' => $node->id,
                'uuid' => $node->uuid,
                'name' => $node->name,
                'description' => $node->description,
                'maintenance_mode' => $node->maintenance_mode,
                'location' => [
                    'id' => $node->location->id,
                    'short' => $node->location->short,
                    'long' => $node->location->long,
                ],
                'memory' => $node->memory,
                'disk' => $node->disk,
                'servers_count' => $node->servers_count,
                'scheme' => $node->scheme,
                'public' => $node->public,
                'fqdn' => $node->fqdn,
                'behind_proxy' => $node->behind_proxy,
            ],
            'stats' => $this->repository->getUsageStats($node),
            'latest_daemon_version' => $this->versionService->getDaemon(),
            'can_delete' => $node->servers_count < 1,
        ]);
    }

    public function systemInformation(Node $node): JsonResponse
    {
        try {
            $data = $this->daemonConfigurationRepository->setNode($node)->getSystemInformation();

            return response()->json([
                'version' => $data['version'] ?? '',
                'system' => [
                    'type' => Str::title($data['os'] ?? 'Unknown'),
                    'arch' => $data['architecture'] ?? '--',
                    'release' => $data['kernel_version'] ?? '--',
                    'cpus' => $data['cpu_count'] ?? 0,
                ],
            ]);
        } catch (DaemonConnectionException) {
            return response()->json([
                'error' => 'Offline — could not connect',
            ], 503);
        }
    }

    public function settings(Request $request, Node $node): JsonResponse
    {
        return response()->json([
            'node' => $this->transformNodeSettings($node),
            'locations' => $this->locationRepository->all()->map(fn ($location) => [
                'id' => $location->id,
                'short' => $location->short,
                'long' => $location->long,
            ])->values(),
            'panel_secure' => $request->isSecure(),
        ]);
    }

    /**
     * @throws DisplayException
     * @throws DataValidationException
     * @throws Throwable
     */
    public function updateSettings(NodeFormRequest $request, Node $node): JsonResponse
    {
        $this->updateService->handle($node, $request->normalize(), $request->boolean('reset_secret'));

        return response()->json([
            'success' => true,
            'message' => 'Node was updated successfully.',
        ]);
    }

    public function configuration(Node $node): JsonResponse
    {
        return response()->json([
            'yaml' => $node->getYamlConfiguration(),
        ]);
    }

    /**
     * @throws DataValidationException
     */
    public function deployToken(Request $request, Node $node): JsonResponse
    {
        $key = ApiKey::query()
            ->where('user_id', $request->user()->id)
            ->where('key_type', ApiKey::TYPE_APPLICATION)
            ->where('r_nodes', 1)
            ->first();

        if (!$key) {
            $key = $this->keyCreationService->setKeyType(ApiKey::TYPE_APPLICATION)->handle([
                'user_id' => $request->user()->id,
                'memo' => 'Automatically generated node deployment key.',
                'allowed_ips' => [],
            ], ['r_nodes' => 1]);
        }

        return response()->json([
            'node' => $node->id,
            'token' => $key->identifier . $this->encrypter->decrypt($key->token),
            'panel_url' => config('app.url'),
            'debug' => (bool) config('app.debug'),
        ]);
    }

    public function servers(Node $node): JsonResponse
    {
        $servers = $this->serverRepository->loadAllServersForNode($node->id, 25);

        return response()->json([
            'servers' => collect($servers->items())->map(fn ($server) => [
                'id' => $server->id,
                'name' => $server->name,
                'uuid_short' => $server->uuidShort,
                'owner' => [
                    'id' => $server->user->id,
                    'username' => $server->user->username,
                ],
                'allocation' => [
                    'alias' => $server->allocation->alias,
                    'port' => $server->allocation->port,
                ],
                'status' => $this->resolveServerStatus($server),
            ])->values(),
            'pagination' => [
                'current_page' => $servers->currentPage(),
                'last_page' => $servers->lastPage(),
                'total' => $servers->total(),
            ],
        ]);
    }

    public function destroy(Node $node): JsonResponse
    {
        try {
            $this->deletionService->handle($node);
        } catch (HasActiveServersException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'The requested node has been deleted from the system.',
        ]);
    }

    public function allocations(Request $request, Node $node): JsonResponse
    {
        $allocations = $node->allocations()
            ->orderByRaw('server_id IS NOT NULL DESC, server_id IS NULL')
            ->orderByRaw('INET_ATON(ip) ASC')
            ->orderBy('port')
            ->with('server:id,name')
            ->paginate(50);

        $ips = Allocation::query()
            ->where('node_id', $node->id)
            ->groupBy('ip')
            ->orderByRaw('INET_ATON(ip) ASC')
            ->pluck('ip');

        return response()->json([
            'allocations' => collect($allocations->items())->map(fn (Allocation $allocation) => [
                'id' => $allocation->id,
                'ip' => $allocation->ip,
                'ip_alias' => $allocation->ip_alias,
                'port' => $allocation->port,
                'server_id' => $allocation->server_id,
                'server' => $allocation->server ? [
                    'id' => $allocation->server->id,
                    'name' => $allocation->server->name,
                ] : null,
            ])->values(),
            'ips' => $ips,
            'pagination' => [
                'current_page' => $allocations->currentPage(),
                'last_page' => $allocations->lastPage(),
                'total' => $allocations->total(),
            ],
        ]);
    }

    /**
     * @throws DataValidationException
     * @throws Throwable
     */
    public function storeAllocation(AllocationFormRequest $request, Node $node): JsonResponse
    {
        $this->assignmentService->handle($node, $request->normalize());

        return response()->json([
            'success' => true,
            'message' => 'Your allocations have been saved and are now available for use.',
        ]);
    }

    /**
     * @throws DataValidationException
     * @throws RecordNotFoundException
     */
    public function updateAllocationAlias(AllocationAliasFormRequest $request, Node $node): JsonResponse
    {
        $allocation = Allocation::query()->findOrFail($request->input('allocation_id'));

        if ($allocation->node_id !== $node->id) {
            abort(404);
        }

        $this->allocationRepository->update($allocation->id, [
            'ip_alias' => empty($request->input('alias')) ? null : $request->input('alias'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Allocation alias updated.',
        ]);
    }

    public function destroyAllocation(Node $node, Allocation $allocation): JsonResponse
    {
        if ($allocation->node_id !== $node->id) {
            abort(404);
        }

        try {
            $this->allocationDeletionService->handle($allocation);
        } catch (ServerUsingAllocationException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Allocation deleted.',
        ]);
    }

    public function destroyAllocations(Request $request, Node $node): JsonResponse
    {
        $request->validate([
            'allocations' => 'required|array',
            'allocations.*.id' => 'required|integer|exists:allocations,id',
        ]);

        foreach ($request->input('allocations') as $rawAllocation) {
            $allocation = Allocation::query()->findOrFail($rawAllocation['id']);

            if ($allocation->node_id !== $node->id) {
                abort(404);
            }

            try {
                $this->allocationDeletionService->handle($allocation);
            } catch (ServerUsingAllocationException $exception) {
                return response()->json(['message' => $exception->getMessage()], 422);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Selected allocations have been deleted.',
        ]);
    }

    public function destroyAllocationBlock(Request $request, Node $node): JsonResponse
    {
        $request->validate(['ip' => 'required|ip']);

        $this->allocationRepository->deleteWhere([
            ['node_id', '=', $node->id],
            ['server_id', '=', null],
            ['ip', '=', $request->input('ip')],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'All unassigned allocations for that IP have been deleted.',
        ]);
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

    private function transformNodeListItem(Node $node): array
    {
        return [
            'id' => $node->id,
            'name' => $node->name,
            'maintenance_mode' => $node->maintenance_mode,
            'location' => [
                'id' => $node->location->id,
                'short' => $node->location->short,
            ],
            'memory' => $node->memory,
            'disk' => $node->disk,
            'servers_count' => $node->servers_count,
            'scheme' => $node->scheme,
            'public' => $node->public,
        ];
    }

    private function transformNodeSettings(Node $node): array
    {
        return [
            'id' => $node->id,
            'name' => $node->name,
            'description' => $node->description,
            'location_id' => $node->location_id,
            'public' => $node->public,
            'fqdn' => $node->fqdn,
            'scheme' => $node->scheme,
            'behind_proxy' => $node->behind_proxy,
            'maintenance_mode' => $node->maintenance_mode,
            'memory' => $node->memory,
            'memory_overallocate' => $node->memory_overallocate,
            'disk' => $node->disk,
            'disk_overallocate' => $node->disk_overallocate,
            'upload_size' => $node->upload_size,
            'daemonListen' => $node->daemonListen,
            'daemonSFTP' => $node->daemonSFTP,
            'daemonBase' => $node->daemonBase,
        ];
    }
}
