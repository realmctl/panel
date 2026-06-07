<?php

namespace Pterodactyl\Http\Controllers\Api\Admin;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use PDOException;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Exceptions\Model\DataValidationException;
use Pterodactyl\Exceptions\Repository\RecordNotFoundException;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Http\Requests\Admin\LocationFormRequest;
use Pterodactyl\Models\Location;
use Pterodactyl\Services\Locations\LocationCreationService;
use Pterodactyl\Services\Locations\LocationDeletionService;
use Pterodactyl\Services\Locations\LocationUpdateService;
use Pterodactyl\Contracts\Repository\LocationRepositoryInterface;
use Throwable;

class LocationController extends Controller
{
    public function __construct(
        private LocationRepositoryInterface $repository,
        private LocationCreationService $creationService,
        private LocationUpdateService $updateService,
        private LocationDeletionService $deletionService,
    ) {
    }

    public function index(): JsonResponse
    {
        $locations = $this->repository->getAllWithDetails()->map(fn (Location $location) => [
            'id' => $location->id,
            'short' => $location->short,
            'long' => $location->long,
            'nodes_count' => $location->nodes_count,
            'servers_count' => $location->servers_count,
        ]);

        return response()->json(['locations' => $locations]);
    }

    /**
     * @throws RecordNotFoundException
     */
    public function show(int $id): JsonResponse
    {
        $location = $this->repository->getWithNodes($id);

        return response()->json([
            'location' => [
                'id' => $location->id,
                'short' => $location->short,
                'long' => $location->long,
            ],
            'nodes' => $location->nodes->map(fn ($node) => [
                'id' => $node->id,
                'name' => $node->name,
                'fqdn' => $node->fqdn,
                'servers_count' => $node->servers->count(),
            ])->values(),
        ]);
    }

    /**
     * @throws DataValidationException
     * @throws Throwable
     */
    public function store(LocationFormRequest $request): JsonResponse
    {
        $location = $this->creationService->handle($request->normalize());

        return response()->json([
            'success' => true,
            'message' => 'Location was created successfully.',
            'location' => [
                'id' => $location->id,
                'short' => $location->short,
                'long' => $location->long,
            ],
        ]);
    }

    /**
     * @throws DataValidationException
     * @throws Throwable
     */
    public function update(LocationFormRequest $request, Location $location): JsonResponse
    {
        $this->updateService->handle($location->id, $request->normalize());

        return response()->json([
            'success' => true,
            'message' => 'Location was updated successfully.',
            'location' => [
                'id' => $location->id,
                'short' => $request->input('short', $location->short),
                'long' => $request->input('long', $location->long),
            ],
        ]);
    }

    public function destroy(Location $location): JsonResponse
    {
        try {
            $this->deletionService->handle($location->id);
        } catch (DisplayException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Location was deleted successfully.',
        ]);
    }
}
