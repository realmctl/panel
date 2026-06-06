<?php

namespace Pterodactyl\Http\Controllers\Setup;

use Illuminate\Http\Request;
use Pterodactyl\Models\Node;
use Pterodactyl\Models\User;
use Pterodactyl\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Contracts\View\View;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Services\Setup\PanelSetupService;
use Pterodactyl\Services\Setup\SetupEnvironmentService;
use Pterodactyl\Services\Users\UserCreationService;
use Pterodactyl\Services\Nodes\NodeCreationService;
use Pterodactyl\Http\Controllers\Auth\AbstractLoginController;
use Pterodactyl\Services\Locations\LocationCreationService;
use Pterodactyl\Services\Allocations\AssignmentService;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;
use Pterodactyl\Repositories\Wings\DaemonConfigurationRepository;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;
use Pterodactyl\Exceptions\Service\Allocation\CidrOutOfRangeException;
use Pterodactyl\Exceptions\Service\Allocation\InvalidPortMappingException;
use Pterodactyl\Exceptions\Service\Allocation\PortOutOfRangeException;
use Pterodactyl\Exceptions\Service\Allocation\TooManyPortsInRangeException;
use Pterodactyl\Traits\Helpers\AvailableLanguages;
use Illuminate\Validation\Rule;

class SetupController extends AbstractLoginController
{
    use AvailableLanguages;

    protected string $redirectTo = '/setup/settings';

    public function __construct(
        private PanelSetupService $setupService,
        private SetupEnvironmentService $environmentService,
        private UserCreationService $userCreationService,
        private LocationCreationService $locationCreationService,
        private NodeCreationService $nodeCreationService,
        private AssignmentService $assignmentService,
        private SettingsRepositoryInterface $settings,
        private DaemonConfigurationRepository $daemonConfigurationRepository,
    ) {
        parent::__construct();
    }

    public function index(): View
    {
        return view('templates/setup.core');
    }

    public function status(): JsonResponse
    {
        return new JsonResponse(['data' => $this->setupService->getStatus()]);
    }

    public function acknowledgeWelcome(): JsonResponse
    {
        $this->setupService->markWelcomeComplete();

        return $this->status();
    }

    public function configureEnvironment(Request $request): JsonResponse
    {
        $request->validate([
            'author' => 'required|email',
            'url' => 'required|url',
            'timezone' => 'required|string',
            'cache' => 'sometimes|in:redis,memcached,file',
            'session' => 'sometimes|in:redis,memcached,database,file,cookie',
            'queue' => 'sometimes|in:redis,database,sync',
            'redisHost' => 'sometimes|string',
            'redisPort' => 'sometimes|integer|min:1|max:65535',
            'redisPassword' => 'sometimes|nullable|string',
        ]);

        if (!in_array($request->input('timezone'), \DateTimeZone::listIdentifiers(), true)) {
            throw new DisplayException('The selected timezone is invalid.');
        }

        try {
            $this->environmentService->configure($request->only([
                'author', 'url', 'timezone', 'cache', 'session', 'queue', 'redisHost', 'redisPort', 'redisPassword',
            ]));
        } catch (\Pterodactyl\Exceptions\PterodactylException $exception) {
            throw new DisplayException($exception->getMessage());
        }

        $this->setupService->markEnvironmentComplete();

        return $this->status();
    }

    public function createAdmin(Request $request): JsonResponse
    {
        if (User::query()->exists()) {
            throw new DisplayException('An administrator account already exists.');
        }

        $request->validate([
            'name_first' => 'required|string|min:1|max:191',
            'name_last' => 'required|string|min:1|max:191',
            'email' => 'required|email|unique:users,email',
            'username' => 'required|string|min:3|max:32|unique:users,username|regex:/^[a-zA-Z0-9_.-]+$/',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $this->userCreationService->handle([
            'email' => $request->input('email'),
            'username' => $request->input('username'),
            'password' => $request->input('password'),
            'name_first' => $request->input('name_first'),
            'name_last' => $request->input('name_last'),
            'root_admin' => true,
        ]);

        $this->setupService->markWelcomeComplete();

        return $this->sendLoginResponse($user, $request);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $this->ensureRootAdmin($request);

        $request->validate([
            'app:name' => 'required|string|max:191',
            'app:locale' => ['required', 'string', Rule::in(array_keys($this->getAvailableLanguages()))],
            'pterodactyl:auth:registration_enabled' => 'required|in:true,false',
        ]);

        foreach ($request->only(['app:name', 'app:locale', 'pterodactyl:auth:registration_enabled']) as $key => $value) {
            $this->settings->set('settings::' . $key, $value);
        }

        $this->setupService->markSettingsComplete();

        return new JsonResponse(['data' => $this->setupService->getStatus()]);
    }

    public function createLocation(Request $request): JsonResponse
    {
        $this->ensureRootAdmin($request);

        $request->validate([
            'short' => 'required|string|between:1,60|unique:locations,short',
            'long' => 'nullable|string|between:1,191',
        ]);

        $location = $this->locationCreationService->handle($request->only(['short', 'long']));
        $this->setupService->markLocationComplete();

        return new JsonResponse([
            'data' => array_merge($this->setupService->getStatus(), [
                'location' => [
                    'id' => $location->id,
                    'short' => $location->short,
                    'long' => $location->long,
                ],
            ]),
        ]);
    }

    public function createNode(Request $request): JsonResponse
    {
        $this->ensureRootAdmin($request);

        $request->validate([
            'name' => 'required|regex:/^([\w .-]{1,100})$/',
            'description' => 'nullable|string',
            'location_id' => 'required|exists:locations,id',
            'fqdn' => 'required|string',
            'scheme' => 'required|in:http,https',
            'behind_proxy' => 'sometimes|boolean',
            'memory' => 'required|numeric|min:1',
            'memory_overallocate' => 'required|numeric|min:-1',
            'disk' => 'required|numeric|min:1',
            'disk_overallocate' => 'required|numeric|min:-1',
            'daemonListen' => 'required|numeric|between:1,65535',
            'daemonSFTP' => 'required|numeric|between:1,65535',
            'daemonBase' => 'sometimes|required|regex:/^([\/][\d\w.\-\/]+)$/',
            'upload_size' => 'sometimes|integer|min:1',
        ]);

        $data = $request->only([
            'name', 'description', 'location_id', 'fqdn', 'scheme', 'behind_proxy',
            'memory', 'memory_overallocate', 'disk', 'disk_overallocate',
            'daemonListen', 'daemonSFTP', 'daemonBase', 'upload_size',
        ]);

        $data['public'] = true;
        $data['behind_proxy'] = $request->boolean('behind_proxy');
        $data['daemonBase'] = $data['daemonBase'] ?? '/var/lib/realm/volumes';
        $data['upload_size'] = $data['upload_size'] ?? 100;

        $node = $this->nodeCreationService->handle($data);

        return new JsonResponse([
            'data' => array_merge($this->setupService->getStatus(), [
                'node' => [
                    'id' => $node->id,
                    'name' => $node->name,
                    'fqdn' => $node->fqdn,
                ],
            ]),
        ]);
    }

    public function nodeConfiguration(Request $request, int $node): JsonResponse
    {
        $this->ensureRootAdmin($request);

        $node = $this->resolveSetupNode($node);

        return new JsonResponse([
            'data' => [
                'yaml' => $node->getYamlConfiguration(),
                'json' => $node->getJsonConfiguration(true),
            ],
        ]);
    }

    public function verifyNode(Request $request, int $node): JsonResponse
    {
        $this->ensureRootAdmin($request);

        $node = $this->resolveSetupNode($node);

        try {
            $data = $this->daemonConfigurationRepository->setNode($node)->getSystemInformation();

            $this->setupService->markWingsVerified();

            return new JsonResponse([
                'data' => array_merge($this->setupService->getStatus(), [
                    'version' => $data['version'] ?? null,
                ]),
            ]);
        } catch (DaemonConnectionException) {
            return new JsonResponse([
                'error' => 'Could not connect to Wings. Ensure the daemon is running and the configuration is correct.',
            ], 503);
        }
    }

    /**
     * @throws CidrOutOfRangeException
     * @throws InvalidPortMappingException
     * @throws PortOutOfRangeException
     * @throws TooManyPortsInRangeException
     */
    public function createAllocations(Request $request, int $node): JsonResponse
    {
        $this->ensureRootAdmin($request);

        $node = $this->resolveSetupNode($node);

        $request->validate([
            'allocation_ip' => 'required|string',
            'allocation_alias' => 'sometimes|nullable|string|max:191',
            'allocation_ports' => 'required|array|min:1',
            'allocation_ports.*' => 'required|string',
        ]);

        $this->assignmentService->handle($node, [
            'allocation_ip' => $request->input('allocation_ip'),
            'allocation_alias' => $request->input('allocation_alias'),
            'allocation_ports' => $request->input('allocation_ports'),
        ]);

        return new JsonResponse(['data' => $this->setupService->getStatus()]);
    }

    public function continueLocation(Request $request): JsonResponse
    {
        $this->ensureRootAdmin($request);

        if (!Location::query()->exists()) {
            throw new DisplayException('Create a location before continuing.');
        }

        $this->setupService->markLocationComplete();

        return new JsonResponse(['data' => $this->setupService->getStatus()]);
    }

    public function skipServer(Request $request): JsonResponse
    {
        $this->ensureRootAdmin($request);

        $this->setupService->markServerSkipped();

        return new JsonResponse(['data' => $this->setupService->getStatus()]);
    }

    public function complete(Request $request): JsonResponse
    {
        $this->ensureRootAdmin($request);

        $this->setupService->markComplete();

        return new JsonResponse([
            'data' => $this->setupService->getStatus(),
            'intended' => '/',
        ]);
    }

    private function ensureRootAdmin(Request $request): void
    {
        if (!$request->user()?->root_admin) {
            throw new DisplayException('You must be logged in as an administrator to perform this action.');
        }
    }

    private function resolveSetupNode(int $nodeId): Node
    {
        $node = Node::query()->find($nodeId);

        if (!$node) {
            throw new DisplayException('The selected node no longer exists. Go back to the node step and create one.');
        }

        return $node;
    }
}
