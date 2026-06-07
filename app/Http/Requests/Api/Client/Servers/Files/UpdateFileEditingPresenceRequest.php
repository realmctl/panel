<?php

namespace Realm\Http\Requests\Api\Client\Servers\Files;

use Realm\Models\Permission;
use Realm\Contracts\Http\ClientPermissionsRequest;
use Realm\Http\Requests\Api\Client\ClientApiRequest;

class UpdateFileEditingPresenceRequest extends ClientApiRequest implements ClientPermissionsRequest
{
    public function permission(): string
    {
        return Permission::ACTION_FILE_READ_CONTENT;
    }

    public function rules(): array
    {
        return [
            'file' => 'required|string',
            'line' => 'required|integer|min:1',
        ];
    }
}
