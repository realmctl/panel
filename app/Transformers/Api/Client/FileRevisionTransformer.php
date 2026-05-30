<?php

namespace Pterodactyl\Transformers\Api\Client;

use Pterodactyl\Models\FileRevision;

class FileRevisionTransformer extends BaseClientTransformer
{
    public function getResourceName(): string
    {
        return FileRevision::RESOURCE_NAME;
    }

    public function transform(FileRevision $revision): array
    {
        return [
            'uuid' => $revision->uuid,
            'file_path' => $revision->file_path,
            'hash' => $revision->hash,
            'size' => $revision->size,
            'action' => $revision->action,
            'user_id' => $revision->user_id,
            'created_at' => $revision->created_at->toAtomString(),
        ];
    }
}
