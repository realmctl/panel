<?php

namespace Realm\Http\Controllers\Api\Application\Locations;

use Realm\Exceptions\Model\DataValidationException;
use Realm\Exceptions\Repository\RecordNotFoundException;
use Realm\Exceptions\Service\Location\HasActiveNodesException;
use Illuminate\Http\Response;
use Realm\Models\Location;
use Illuminate\Http\JsonResponse;
use Spatie\QueryBuilder\QueryBuilder;
use Realm\Services\Locations\LocationUpdateService;
use Realm\Services\Locations\LocationCreationService;
use Realm\Services\Locations\LocationDeletionService;
use Realm\Transformers\Api\Application\LocationTransformer;
use Realm\Http\Controllers\Api\Application\ApplicationApiController;
use Realm\Http\Requests\Api\Application\Locations\GetLocationRequest;
use Realm\Http\Requests\Api\Application\Locations\GetLocationsRequest;
use Realm\Http\Requests\Api\Application\Locations\StoreLocationRequest;
use Realm\Http\Requests\Api\Application\Locations\DeleteLocationRequest;
use Realm\Http\Requests\Api\Application\Locations\UpdateLocationRequest;

class LocationController extends ApplicationApiController
{
    /**
     * LocationController constructor.
     */
    public function __construct(
        private LocationCreationService $creationService,
        private LocationDeletionService $deletionService,
        private LocationUpdateService $updateService,
    ) {
        parent::__construct();
    }

    /**
     * Return all the locations currently registered on the Panel.
     */
    public function index(GetLocationsRequest $request): array
    {
        $locations = QueryBuilder::for(Location::query())
            ->allowedFilters(['short', 'long'])
            ->allowedSorts(['id'])
            ->paginate($request->query('per_page') ?? 50);

        return $this->fractal->collection($locations)
            ->transformWith($this->getTransformer(LocationTransformer::class))
            ->toArray();
    }

    /**
     * Return a single location.
     */
    public function view(GetLocationRequest $request, Location $location): array
    {
        return $this->fractal->item($location)
            ->transformWith($this->getTransformer(LocationTransformer::class))
            ->toArray();
    }

    /**
     * Store a new location on the Panel and return an HTTP/201 response code with the
     * new location attached.
     *
     * @throws DataValidationException
     */
    public function store(StoreLocationRequest $request): JsonResponse
    {
        $location = $this->creationService->handle($request->validated());

        return $this->fractal->item($location)
            ->transformWith($this->getTransformer(LocationTransformer::class))
            ->addMeta([
                'resource' => route('api.application.locations.view', [
                    'location' => $location->id,
                ]),
            ])
            ->respond(201);
    }

    /**
     * Update a location on the Panel and return the updated record to the user.
     *
     * @throws DataValidationException
     * @throws RecordNotFoundException
     */
    public function update(UpdateLocationRequest $request, Location $location): array
    {
        $location = $this->updateService->handle($location, $request->validated());

        return $this->fractal->item($location)
            ->transformWith($this->getTransformer(LocationTransformer::class))
            ->toArray();
    }

    /**
     * Delete a location from the Panel.
     *
     * @throws HasActiveNodesException
     */
    public function delete(DeleteLocationRequest $request, Location $location): Response
    {
        $this->deletionService->handle($location);

        return response('', 204);
    }
}
