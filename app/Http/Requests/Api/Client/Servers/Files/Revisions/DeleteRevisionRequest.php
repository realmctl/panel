<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Files\Revisions;

use Pterodactyl\Models\Permission;
use Pterodactyl\Contracts\Http\ClientPermissionsRequest;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class DeleteRevisionRequest extends ClientApiRequest implements ClientPermissionsRequest
{
    public function permission(): string
    {
        return Permission::ACTION_FILE_REVISION_DELETE;
    }

    public function rules(): array
    {
        return [];
    }
}
