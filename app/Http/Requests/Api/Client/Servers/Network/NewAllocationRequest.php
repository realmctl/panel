<?php

namespace Realm\Http\Requests\Api\Client\Servers\Network;

use Realm\Models\Permission;
use Realm\Http\Requests\Api\Client\ClientApiRequest;

class NewAllocationRequest extends ClientApiRequest
{
    public function permission(): string
    {
        return Permission::ACTION_ALLOCATION_CREATE;
    }
}
