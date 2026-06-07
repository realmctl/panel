<?php

namespace Realm\Http\Controllers\Api\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Realm\Http\Controllers\Controller;
use Realm\Http\Requests\Admin\MountFormRequest;
use Realm\Models\Egg;
use Realm\Models\Location;
use Realm\Models\Mount;
use Realm\Models\Nest;
use Realm\Repositories\Eloquent\MountRepository;
use Ramsey\Uuid\Uuid;
use Throwable;

class MountController extends Controller
{
    public function __construct(private MountRepository $repository)
    {
    }

    public function index(): JsonResponse
    {
        $mounts = Mount::query()
            ->withCount(['eggs', 'nodes', 'servers'])
            ->orderBy('name')
            ->get()
            ->map(fn (Mount $mount) => [
                'id' => $mount->id,
                'name' => $mount->name,
                'source' => $mount->source,
                'target' => $mount->target,
                'eggs_count' => $mount->eggs_count,
                'nodes_count' => $mount->nodes_count,
                'servers_count' => $mount->servers_count,
            ]);

        return response()->json(['mounts' => $mounts]);
    }

    /**
     * @throws Throwable
     */
    public function store(MountFormRequest $request): JsonResponse
    {
        $model = (new Mount())->fill($request->validated());
        $model->forceFill(['uuid' => Uuid::uuid4()->toString()]);
        $model->saveOrFail();

        return response()->json([
            'success' => true,
            'message' => 'Mount was created successfully.',
            'mount' => ['id' => $model->id],
        ], 201);
    }

    public function show(Mount $mount): JsonResponse
    {
        $mount = $this->repository->getWithRelations((string) $mount->id);

        $attachedEggIds = $mount->eggs->pluck('id')->all();
        $attachedNodeIds = $mount->nodes->pluck('id')->all();

        return response()->json([
            'mount' => [
                'id' => $mount->id,
                'uuid' => $mount->uuid,
                'name' => $mount->name,
                'description' => $mount->description,
                'source' => $mount->source,
                'target' => $mount->target,
                'read_only' => (bool) $mount->read_only,
                'user_mountable' => (bool) $mount->user_mountable,
            ],
            'eggs' => $mount->eggs->map(fn (Egg $egg) => [
                'id' => $egg->id,
                'name' => $egg->name,
            ])->values(),
            'nodes' => $mount->nodes->map(fn ($node) => [
                'id' => $node->id,
                'name' => $node->name,
                'fqdn' => $node->fqdn,
            ])->values(),
            'available_eggs' => Nest::query()->with('eggs')->orderBy('name')->get()->map(fn (Nest $nest) => [
                'id' => $nest->id,
                'name' => $nest->name,
                'eggs' => $nest->eggs
                    ->filter(fn (Egg $egg) => !in_array($egg->id, $attachedEggIds))
                    ->map(fn (Egg $egg) => ['id' => $egg->id, 'name' => $egg->name])
                    ->values(),
            ])->values(),
            'available_nodes' => Location::query()->with('nodes')->orderBy('short')->get()->map(fn (Location $location) => [
                'id' => $location->id,
                'short' => $location->short,
                'long' => $location->long,
                'nodes' => $location->nodes
                    ->filter(fn ($node) => !in_array($node->id, $attachedNodeIds))
                    ->map(fn ($node) => ['id' => $node->id, 'name' => $node->name])
                    ->values(),
            ])->values(),
        ]);
    }

    public function update(MountFormRequest $request, Mount $mount): JsonResponse
    {
        $mount->forceFill($request->validated())->save();

        return response()->json([
            'success' => true,
            'message' => 'Mount was updated successfully.',
        ]);
    }

    public function destroy(Mount $mount): Response
    {
        $mount->delete();

        return response('', 204);
    }

    public function attachEggs(Request $request, Mount $mount): JsonResponse
    {
        $validated = $request->validate([
            'eggs' => 'required|array|min:1',
            'eggs.*' => 'integer|exists:eggs,id',
        ]);

        $mount->eggs()->syncWithoutDetaching($validated['eggs']);

        return response()->json([
            'success' => true,
            'message' => 'Mount was updated successfully.',
        ]);
    }

    public function attachNodes(Request $request, Mount $mount): JsonResponse
    {
        $validated = $request->validate([
            'nodes' => 'required|array|min:1',
            'nodes.*' => 'integer|exists:nodes,id',
        ]);

        $mount->nodes()->syncWithoutDetaching($validated['nodes']);

        return response()->json([
            'success' => true,
            'message' => 'Mount was updated successfully.',
        ]);
    }

    public function detachEgg(Mount $mount, int $eggId): Response
    {
        $mount->eggs()->detach($eggId);

        return response('', 204);
    }

    public function detachNode(Mount $mount, int $nodeId): Response
    {
        $mount->nodes()->detach($nodeId);

        return response('', 204);
    }
}
