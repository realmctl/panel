<?php

namespace Realm\Transformers\Api\Client;

use Realm\Models\ServerGroup;

class ServerGroupTransformer extends BaseClientTransformer
{
    public function getResourceName(): string
    {
        return ServerGroup::RESOURCE_NAME;
    }

    public function transform(ServerGroup $group): array
    {
        return [
            'uuid' => $group->uuid,
            'name' => $group->name,
            'color' => $group->color,
            'sort_order' => $group->sort_order,
            'server_uuids' => $group->servers->pluck('uuid')->values()->toArray(),
            'created_at' => $group->created_at->toAtomString(),
            'updated_at' => $group->updated_at->toAtomString(),
        ];
    }
}
