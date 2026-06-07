<?php

namespace Realm\Http\Requests\Api\Client\Servers;

use Illuminate\Validation\Rule;
use Realm\Models\Permission;
use Realm\Models\Server;
use Realm\Http\Requests\Api\Client\ClientApiRequest;

class GetPlayersRequest extends ClientApiRequest
{
    public function permission(): string
    {
        return Permission::ACTION_PLAYERS_READ;
    }

    public function rules(): array
    {
        /** @var Server $server */
        $server = $this->route()->parameter('server');

        return [
            'allocation' => [
                'sometimes',
                'integer',
                Rule::exists('allocations', 'id')->where(fn ($query) => $query->where('server_id', $server->id)),
            ],
        ];
    }
}
