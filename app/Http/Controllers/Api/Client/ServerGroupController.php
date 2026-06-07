<?php

namespace Realm\Http\Controllers\Api\Client;

use Ramsey\Uuid\Uuid;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Realm\Models\Server;
use Realm\Models\ServerGroup;
use Realm\Http\Controllers\Api\Client\ClientApiController;
use Realm\Transformers\Api\Client\ServerGroupTransformer;

class ServerGroupController extends ClientApiController
{
    /**
     * Return all groups belonging to the authenticated user.
     */
    public function index(Request $request): array
    {
        $groups = ServerGroup::query()
            ->where('user_id', $request->user()->id)
            ->with('servers')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return $this->fractal->collection($groups)
            ->transformWith($this->getTransformer(ServerGroupTransformer::class))
            ->toArray();
    }

    /**
     * Create a new server group for the authenticated user.
     */
    public function store(Request $request): array
    {
        $request->validate([
            'name' => 'required|string|max:191',
            'color' => 'required|string|max:32',
        ]);

        $group = ServerGroup::query()->create([
            'uuid' => Uuid::uuid4()->toString(),
            'user_id' => $request->user()->id,
            'name' => $request->input('name'),
            'color' => $request->input('color'),
        ]);

        $group->load('servers');

        return $this->fractal->item($group)
            ->transformWith($this->getTransformer(ServerGroupTransformer::class))
            ->toArray();
    }

    /**
     * Update the name or colour of a group.
     */
    public function update(Request $request, ServerGroup $group): array
    {
        $this->assertOwns($group, $request);

        $request->validate([
            'name' => 'sometimes|string|max:191',
            'color' => 'sometimes|string|max:32',
            'sort_order' => 'sometimes|integer|min:0',
        ]);

        $group->update($request->only(['name', 'color', 'sort_order']));
        $group->load('servers');

        return $this->fractal->item($group)
            ->transformWith($this->getTransformer(ServerGroupTransformer::class))
            ->toArray();
    }

    /**
     * Replace the server membership of a group with the provided list of server UUIDs.
     */
    public function syncServers(Request $request, ServerGroup $group): array
    {
        $this->assertOwns($group, $request);

        $request->validate([
            'server_uuids' => 'present|array',
            'server_uuids.*' => 'string|uuid',
        ]);

        // Resolve only servers the user actually has access to.
        $serverIds = Server::query()
            ->whereIn('uuid', $request->input('server_uuids', []))
            ->where(function ($q) use ($request) {
                $q->where('owner_id', $request->user()->id)
                    ->orWhereHas('subusers', fn ($q) => $q->where('user_id', $request->user()->id));
            })
            ->pluck('id');

        $group->servers()->sync($serverIds);
        $group->load('servers');

        return $this->fractal->item($group)
            ->transformWith($this->getTransformer(ServerGroupTransformer::class))
            ->toArray();
    }

    /**
     * Delete a group. Servers are not affected.
     */
    public function destroy(Request $request, ServerGroup $group): JsonResponse
    {
        $this->assertOwns($group, $request);

        $group->delete();

        return new JsonResponse([], JsonResponse::HTTP_NO_CONTENT);
    }

    private function assertOwns(ServerGroup $group, Request $request): void
    {
        abort_unless($group->user_id === $request->user()->id, 403);
    }
}
