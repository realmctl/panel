<?php

namespace Realm\Http\Requests\Api\Application\Servers;

use Realm\Services\Acl\Api\AdminAcl;
use Realm\Http\Requests\Api\Application\ApplicationApiRequest;

class ServerWriteRequest extends ApplicationApiRequest
{
    protected ?string $resource = AdminAcl::RESOURCE_SERVERS;

    protected int $permission = AdminAcl::WRITE;
}
