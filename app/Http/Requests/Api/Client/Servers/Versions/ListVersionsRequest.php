<?php

namespace Realm\Http\Requests\Api\Client\Servers\Versions;

use Realm\Models\Permission;
use Realm\Http\Requests\Api\Client\ClientApiRequest;

class ListVersionsRequest extends ClientApiRequest
{
    public function permission(): string
    {
        return Permission::ACTION_STARTUP_READ;
    }
}
