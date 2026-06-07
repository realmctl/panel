<?php

namespace Realm\Http\Requests\Api\Client\Servers\Subusers;

use Realm\Models\Permission;

class DeleteSubuserRequest extends SubuserRequest
{
    public function permission(): string
    {
        return Permission::ACTION_USER_DELETE;
    }
}
