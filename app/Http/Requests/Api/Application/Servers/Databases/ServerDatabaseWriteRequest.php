<?php

namespace Realm\Http\Requests\Api\Application\Servers\Databases;

use Realm\Services\Acl\Api\AdminAcl;

class ServerDatabaseWriteRequest extends GetServerDatabasesRequest
{
    protected int $permission = AdminAcl::WRITE;
}
