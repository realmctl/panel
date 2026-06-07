<?php

namespace Realm\Http\Requests\Api\Application\Nodes;

use Realm\Services\Acl\Api\AdminAcl;
use Realm\Http\Requests\Api\Application\ApplicationApiRequest;

class DeleteNodeRequest extends ApplicationApiRequest
{
    protected ?string $resource = AdminAcl::RESOURCE_NODES;

    protected int $permission = AdminAcl::WRITE;
}
