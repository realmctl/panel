<?php

namespace Realm\Http\Requests\Api\Client\Servers\Versions;

use Realm\Models\Permission;
use Realm\Http\Requests\Api\Client\ClientApiRequest;

class InstallVersionRequest extends ClientApiRequest
{
    public function permission(): string
    {
        return Permission::ACTION_FILE_CREATE;
    }

    public function rules(): array
    {
        return [
            'type' => 'required|string|in:paper,purpur,velocity,vanilla,snapshot,spigot,fabric',
            'version' => 'required|string',
        ];
    }
}
