<?php

namespace Realm\Http\Requests\Api\Client\Servers\Files;

use Realm\Models\Permission;
use Realm\Http\Requests\Api\Client\ClientApiRequest;

class ListArchiveDirectoryRequest extends ClientApiRequest
{
    public function permission(): string
    {
        return Permission::ACTION_FILE_READ;
    }

    public function rules(): array
    {
        return [
            'file' => 'required|string',
            'directory' => 'sometimes|nullable|string',
        ];
    }
}
