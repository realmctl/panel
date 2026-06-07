<?php

namespace Realm\Transformers\Api\Client;

use Realm\Models\Allocation;

class AllocationTransformer extends BaseClientTransformer
{
    /**
     * Return the resource name for the JSONAPI output.
     */
    public function getResourceName(): string
    {
        return 'allocation';
    }

    public function transform(Allocation $model): array
    {
        return [
            'id' => $model->id,
            'ip' => $model->ip,
            'ip_alias' => $model->ip_alias,
            'port' => $model->port,
            'notes' => $model->notes,
            'is_default' => $model->server->allocation_id === $model->id,
            'whitelist_enabled' => (bool) $model->whitelist_enabled,
            'protocol' => $model->protocol ?? 'tcp',
            'allowed_ips' => $model->allowed_ips ?? [],
        ];
    }
}
