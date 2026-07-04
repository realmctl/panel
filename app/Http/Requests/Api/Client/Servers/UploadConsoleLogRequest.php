<?php

namespace Realm\Http\Requests\Api\Client\Servers;

use Realm\Models\Permission;
use Realm\Http\Requests\Api\Client\ClientApiRequest;

class UploadConsoleLogRequest extends ClientApiRequest
{
    public function permission(): string
    {
        return Permission::ACTION_WEBSOCKET_CONNECT;
    }

    public function rules(): array
    {
        return [
            'content' => 'required|string',
        ];
    }
}
