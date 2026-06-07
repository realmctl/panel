<?php

namespace Realm\Http\Requests\Api\Client\Servers\Files;

use Realm\Models\Permission;
use Realm\Http\Requests\Api\Client\ClientApiRequest;

class UploadFileRequest extends ClientApiRequest
{
    public function permission(): string
    {
        return Permission::ACTION_FILE_CREATE;
    }
}
