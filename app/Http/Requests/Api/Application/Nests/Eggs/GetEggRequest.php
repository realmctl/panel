<?php

namespace Realm\Http\Requests\Api\Application\Nests\Eggs;

use Realm\Services\Acl\Api\AdminAcl;
use Realm\Http\Requests\Api\Application\ApplicationApiRequest;

class GetEggRequest extends ApplicationApiRequest
{
    protected ?string $resource = AdminAcl::RESOURCE_EGGS;

    protected int $permission = AdminAcl::READ;
}
