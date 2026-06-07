<?php

namespace Realm\Http\Requests\Api\Application\Servers\Databases;

use Realm\Services\Acl\Api\AdminAcl;
use Realm\Http\Requests\Api\Application\ApplicationApiRequest;

class GetServerDatabaseRequest extends ApplicationApiRequest
{
    protected ?string $resource = AdminAcl::RESOURCE_SERVER_DATABASES;

    protected int $permission = AdminAcl::READ;
}
