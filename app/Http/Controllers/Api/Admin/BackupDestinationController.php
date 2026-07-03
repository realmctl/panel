<?php

namespace Realm\Http\Controllers\Api\Admin;

use Ramsey\Uuid\Uuid;
use Illuminate\Http\JsonResponse;
use Realm\Models\BackupDestination;
use Realm\Http\Controllers\Controller;
use Realm\Http\Requests\Admin\BackupDestinationFormRequest;

class BackupDestinationController extends Controller
{
    public function index(): JsonResponse
    {
        $destinations = BackupDestination::query()
            ->withCount('locations')
            ->orderBy('name')
            ->get()
            ->map(fn (BackupDestination $destination) => $this->transform($destination));

        return response()->json(['backup_destinations' => $destinations]);
    }

    public function show(BackupDestination $backup_destination): JsonResponse
    {
        $backup_destination->loadCount('locations');

        return response()->json(['backup_destination' => $this->transform($backup_destination)]);
    }

    public function store(BackupDestinationFormRequest $request): JsonResponse
    {
        $destination = BackupDestination::query()->create(array_merge($request->normalize(), [
            'uuid' => Uuid::uuid4()->toString(),
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Backup destination was created successfully.',
            'backup_destination' => $this->transform($destination),
        ]);
    }

    public function update(BackupDestinationFormRequest $request, BackupDestination $backup_destination): JsonResponse
    {
        $backup_destination->update($request->normalize());

        return response()->json([
            'success' => true,
            'message' => 'Backup destination was updated successfully.',
            'backup_destination' => $this->transform($backup_destination->refresh()),
        ]);
    }

    public function destroy(BackupDestination $backup_destination): JsonResponse
    {
        $backup_destination->delete();

        return response()->json([
            'success' => true,
            'message' => 'Backup destination was deleted successfully.',
        ]);
    }

    private function transform(BackupDestination $destination): array
    {
        return [
            'id' => $destination->id,
            'name' => $destination->name,
            'adapter' => $destination->adapter,
            'bucket' => $destination->bucket,
            'region' => $destination->region,
            'access_key' => $destination->access_key,
            'endpoint' => $destination->endpoint,
            'use_path_style_endpoint' => $destination->use_path_style_endpoint,
            'storage_class' => $destination->storage_class,
            'locations_count' => $destination->locations_count ?? 0,
        ];
    }
}
