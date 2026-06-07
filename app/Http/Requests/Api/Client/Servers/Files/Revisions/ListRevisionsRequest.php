<?php

namespace Realm\Http\Requests\Api\Client\Servers\Files\Revisions;

use Realm\Models\Permission;
use Realm\Contracts\Http\ClientPermissionsRequest;
use Realm\Http\Requests\Api\Client\ClientApiRequest;

class ListRevisionsRequest extends ClientApiRequest implements ClientPermissionsRequest
{
    public function permission(): string
    {
        return Permission::ACTION_FILE_REVISION_READ;
    }

    public function rules(): array
    {
        return [
            'file' => 'required|string',
        ];
    }
}
