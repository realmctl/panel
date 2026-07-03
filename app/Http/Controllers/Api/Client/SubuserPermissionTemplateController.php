<?php

namespace Realm\Http\Controllers\Api\Client;

use Ramsey\Uuid\Uuid;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Realm\Models\Permission;
use Realm\Models\SubuserPermissionTemplate;
use Realm\Transformers\Api\Client\SubuserPermissionTemplateTransformer;

class SubuserPermissionTemplateController extends ClientApiController
{
    /**
     * Return all permission templates belonging to the authenticated user.
     */
    public function index(Request $request): array
    {
        $templates = SubuserPermissionTemplate::query()
            ->where('user_id', $request->user()->id)
            ->orderBy('name')
            ->get();

        return $this->fractal->collection($templates)
            ->transformWith($this->getTransformer(SubuserPermissionTemplateTransformer::class))
            ->toArray();
    }

    /**
     * Create a new permission template for the authenticated user.
     */
    public function store(Request $request): array
    {
        $request->validate([
            'name' => 'required|string|max:191',
            'permissions' => 'present|array',
            'permissions.*' => 'string',
        ]);

        $template = SubuserPermissionTemplate::query()->create([
            'uuid' => Uuid::uuid4()->toString(),
            'user_id' => $request->user()->id,
            'name' => $request->input('name'),
            'permissions' => $this->cleanPermissions($request->input('permissions', [])),
        ]);

        return $this->fractal->item($template)
            ->transformWith($this->getTransformer(SubuserPermissionTemplateTransformer::class))
            ->toArray();
    }

    /**
     * Update the name or permission set of a template.
     */
    public function update(Request $request, SubuserPermissionTemplate $template): array
    {
        $this->assertOwns($template, $request);

        $request->validate([
            'name' => 'sometimes|string|max:191',
            'permissions' => 'sometimes|array',
            'permissions.*' => 'string',
        ]);

        $data = $request->only(['name']);
        if ($request->has('permissions')) {
            $data['permissions'] = $this->cleanPermissions($request->input('permissions', []));
        }

        $template->update($data);

        return $this->fractal->item($template)
            ->transformWith($this->getTransformer(SubuserPermissionTemplateTransformer::class))
            ->toArray();
    }

    /**
     * Delete a permission template.
     */
    public function destroy(Request $request, SubuserPermissionTemplate $template): JsonResponse
    {
        $this->assertOwns($template, $request);

        $template->delete();

        return new JsonResponse([], JsonResponse::HTTP_NO_CONTENT);
    }

    /**
     * Restrict the stored permission list to permissions that actually exist on the system.
     */
    private function cleanPermissions(array $permissions): array
    {
        $allowed = Permission::permissions()
            ->map(function ($value, $prefix) {
                return array_map(function ($value) use ($prefix) {
                    return "$prefix.$value";
                }, array_keys($value['keys']));
            })
            ->flatten()
            ->all();

        return array_values(array_unique(array_intersect($permissions, $allowed)));
    }

    private function assertOwns(SubuserPermissionTemplate $template, Request $request): void
    {
        abort_unless($template->user_id === $request->user()->id, 403);
    }
}
