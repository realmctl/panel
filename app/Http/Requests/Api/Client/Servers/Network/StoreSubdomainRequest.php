<?php

namespace Realm\Http\Requests\Api\Client\Servers\Network;

use Realm\Models\Permission;
use Realm\Contracts\Http\ClientPermissionsRequest;
use Realm\Http\Requests\Api\Client\ClientApiRequest;

class StoreSubdomainRequest extends ClientApiRequest implements ClientPermissionsRequest
{
    public function permission(): string
    {
        return Permission::ACTION_SUBDOMAIN_CREATE;
    }

    public function rules(): array
    {
        return [
            'record' => 'required|integer|exists:records,id',
            'data' => 'required|string|min:3|max:48|regex:/^[A-Za-z0-9]+$/',
        ];
    }
}
