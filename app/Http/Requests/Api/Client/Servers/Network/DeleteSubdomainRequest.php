<?php

namespace Realm\Http\Requests\Api\Client\Servers\Network;

use Realm\Models\Permission;
use Realm\Contracts\Http\ClientPermissionsRequest;
use Realm\Http\Requests\Api\Client\ClientApiRequest;

class DeleteSubdomainRequest extends ClientApiRequest implements ClientPermissionsRequest
{
    public function permission(): string
    {
        return Permission::ACTION_SUBDOMAIN_DELETE;
    }
}
