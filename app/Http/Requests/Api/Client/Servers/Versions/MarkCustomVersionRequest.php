<?php

namespace Realm\Http\Requests\Api\Client\Servers\Versions;

use Realm\Models\Permission;
use Realm\Http\Requests\Api\Client\ClientApiRequest;

class MarkCustomVersionRequest extends ClientApiRequest
{
    public function permission(): string
    {
        return Permission::ACTION_FILE_CREATE;
    }

    public function rules(): array
    {
        return [
            'filename' => 'required|string|max:255',
        ];
    }
}
