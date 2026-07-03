<?php

namespace Realm\Http\Requests\Api\Client\Servers\Files;

use Realm\Models\Permission;
use Realm\Contracts\Http\ClientPermissionsRequest;
use Realm\Http\Requests\Api\Client\ClientApiRequest;

class TransferFilesRequest extends ClientApiRequest implements ClientPermissionsRequest
{
    /**
     * Baseline permission on the source server. The destination server permission
     * (and, for a move, the source delete permission) are validated in the controller
     * since they apply to a different server than the routed one.
     */
    public function permission(): string
    {
        return Permission::ACTION_FILE_READ;
    }

    public function rules(): array
    {
        return [
            'destination' => 'required|string|exists:servers,uuid',
            'root' => 'sometimes|nullable|string',
            'destination_directory' => 'sometimes|nullable|string',
            'files' => 'required|array',
            'files.*' => 'required|string',
            'move' => 'sometimes|boolean',
        ];
    }
}
