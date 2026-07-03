<?php

namespace Realm\Transformers\Api\Client;

use Realm\Models\SubuserPermissionTemplate;

class SubuserPermissionTemplateTransformer extends BaseClientTransformer
{
    public function getResourceName(): string
    {
        return SubuserPermissionTemplate::RESOURCE_NAME;
    }

    public function transform(SubuserPermissionTemplate $template): array
    {
        return [
            'uuid' => $template->uuid,
            'name' => $template->name,
            'permissions' => $template->permissions,
            'created_at' => $template->created_at->toAtomString(),
            'updated_at' => $template->updated_at->toAtomString(),
        ];
    }
}
