<?php

namespace Realm\Http\Requests\Api\Application\Users;

use Realm\Services\Acl\Api\AdminAcl;
use Realm\Http\Requests\Api\Application\ApplicationApiRequest;

class DeleteUserRequest extends ApplicationApiRequest
{
    protected ?string $resource = AdminAcl::RESOURCE_USERS;

    protected int $permission = AdminAcl::WRITE;
}
