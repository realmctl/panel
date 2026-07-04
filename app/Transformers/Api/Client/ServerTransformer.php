<?php

namespace Realm\Transformers\Api\Client;

use Realm\Exceptions\Transformer\InvalidTransformerLevelException;
use Realm\Models\Egg;
use Realm\Models\Server;
use Realm\Models\Subuser;
use League\Fractal\Resource\Item;
use Realm\Models\Allocation;
use Realm\Models\Permission;
use Illuminate\Container\Container;
use Realm\Models\EggVariable;
use League\Fractal\Resource\Collection;
use League\Fractal\Resource\NullResource;
use Realm\Services\Eggs\EggCategoryMappingService;
use Realm\Services\Geolocation\IpGeolocationService;
use Realm\Services\Servers\StartupCommandService;

class ServerTransformer extends BaseClientTransformer
{
    protected array $defaultIncludes = ['allocations', 'variables'];

    protected array $availableIncludes = ['egg', 'subusers'];

    public function getResourceName(): string
    {
        return Server::RESOURCE_NAME;
    }

    private function formatNodeLocation(Server $server): ?array
    {
        $allocation = $server->allocation;

        if (!$allocation) {
            return null;
        }

        $geolocation = app(IpGeolocationService::class);
        $geo = $geolocation->lookup($allocation->ip);

        // The node's own IP is often private/unroutable in local or NAT'd deployments, which
        // means it can never be geolocated. Fall back to the requesting user's IP so the UI
        // still has a sensible location to display rather than "Unknown location".
        if (!$geo && $this->request->ip()) {
            $geo = $geolocation->lookup($this->request->ip());
        }

        // Both of the above are still private when the whole stack runs behind Docker/NAT
        // locally, so as a last resort ask what public IP this box is actually reaching the
        // internet as and geolocate that instead.
        if (!$geo) {
            $geo = $geolocation->lookupOutboundPublicIp();
        }

        if (!$geo) {
            return [
                'ip' => $allocation->ip,
                'country_code' => null,
                'country' => null,
                'city' => null,
                'region' => null,
            ];
        }

        return [
            'ip' => $allocation->ip,
            'country_code' => $geo['country_code'],
            'country' => $geo['country'] ?: null,
            'city' => $geo['city'],
            'region' => $geo['region'],
        ];
    }

    /**
     * Transform a server model into a representation that can be returned
     * to a client.
     */
    public function transform(Server $server): array
    {
        /** @var StartupCommandService $service */
        $service = Container::getInstance()->make(StartupCommandService::class);

        $user = $this->request->user();

        return [
            'server_owner' => $user->id === $server->owner_id,
            'identifier' => config('realm.features.new_server_identifiers')
                ? $server->identifier
                : $server->uuidShort,
            '__deprecated_uuid_short' => $server->uuidShort,
            // In a future release we'll be replacing `identifier` above with the actual
            // "identifier" used internally. This is a completely different value compared
            // to the current however, and would be quite a breaking change to URLs.
            'server_identifier' => $server->identifier,
            'internal_id' => $server->id,
            'uuid' => $server->uuid,
            'name' => $server->name,
            'node' => $server->node->name,
            'node_location' => $this->formatNodeLocation($server),
            'is_node_under_maintenance' => $server->node->isUnderMaintenance(),
            'sftp_details' => [
                'ip' => $server->node->fqdn,
                'port' => $server->node->daemonSFTP,
            ],
            'description' => $server->description,
            'limits' => [
                'memory' => $server->memory,
                'swap' => $server->swap,
                'disk' => $server->disk,
                'io' => $server->io,
                'cpu' => $server->cpu,
                'threads' => $server->threads,
                'oom_disabled' => $server->oom_disabled,
            ],
            'invocation' => $service->handle($server, !$user->can(Permission::ACTION_STARTUP_READ, $server)),
            'docker_image' => $server->image,
            'egg_features' => $server->egg->inherit_features,
            'egg_name' => $server->egg->name,
            'egg_background' => $server->egg->background,
            'egg_category' => app(EggCategoryMappingService::class)->getCategoryForEgg($server->egg_id),
            'feature_limits' => [
                'databases' => $server->database_limit,
                'allocations' => $server->allocation_limit,
                'backups' => $server->backup_limit,
                'subdomains' => $server->subdomain_limit,
            ],
            'status' => $server->status,
            // This field is deprecated, please use "status".
            'is_suspended' => $server->isSuspended(),
            // This field is deprecated, please use "status".
            'is_installing' => !$server->isInstalled(),
            'is_transferring' => !is_null($server->transfer),
        ];
    }

    /**
     * Returns the allocations associated with this server.
     *
     * @throws InvalidTransformerLevelException
     */
    public function includeAllocations(Server $server): Collection
    {
        $transformer = $this->makeTransformer(AllocationTransformer::class);

        $user = $this->request->user();
        // While we include this permission, we do need to actually handle it slightly different here
        // for the purpose of keeping things functionally working. If the user doesn't have read permissions
        // for the allocations we'll only return the primary server allocation, and any notes associated
        // with it will be hidden.
        //
        // This allows us to avoid too much permission regression, without also hiding information that
        // is generally needed for the frontend to make sense when browsing or searching results.
        if (!$user->can(Permission::ACTION_ALLOCATION_READ, $server)) {
            $primary = clone $server->allocation;
            $primary->notes = null;

            return $this->collection([$primary], $transformer, Allocation::RESOURCE_NAME);
        }

        return $this->collection($server->allocations, $transformer, Allocation::RESOURCE_NAME);
    }

    /**
     * @throws InvalidTransformerLevelException
     */
    public function includeVariables(Server $server): Collection|NullResource
    {
        if (!$this->request->user()->can(Permission::ACTION_STARTUP_READ, $server)) {
            return $this->null();
        }

        return $this->collection(
            $server->variables->where('user_viewable', true),
            $this->makeTransformer(EggVariableTransformer::class),
            EggVariable::RESOURCE_NAME
        );
    }

    /**
     * Returns the egg associated with this server.
     *
     * @throws InvalidTransformerLevelException
     */
    public function includeEgg(Server $server): Item
    {
        return $this->item($server->egg, $this->makeTransformer(EggTransformer::class), Egg::RESOURCE_NAME);
    }

    /**
     * Returns the subusers associated with this server.
     *
     * @throws InvalidTransformerLevelException
     */
    public function includeSubusers(Server $server): Collection|NullResource
    {
        if (!$this->request->user()->can(Permission::ACTION_USER_READ, $server)) {
            return $this->null();
        }

        return $this->collection($server->subusers, $this->makeTransformer(SubuserTransformer::class), Subuser::RESOURCE_NAME);
    }
}
