<?php

namespace Realm\Http\Requests\Api\Client\Servers\Files\Revisions;

use Realm\Models\Permission;
use Realm\Contracts\Http\ClientPermissionsRequest;
use Realm\Http\Requests\Api\Client\ClientApiRequest;

class RestoreRevisionRequest extends ClientApiRequest implements ClientPermissionsRequest
{
    public function permission(): string
    {
        return Permission::ACTION_FILE_REVISION_RESTORE;
    }

    public function rules(): array
    {
        return [];
    }
}
