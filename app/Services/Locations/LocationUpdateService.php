<?php

namespace Realm\Services\Locations;

use Realm\Exceptions\Model\DataValidationException;
use Realm\Exceptions\Repository\RecordNotFoundException;
use Realm\Models\Location;
use Realm\Contracts\Repository\LocationRepositoryInterface;

class LocationUpdateService
{
    /**
     * LocationUpdateService constructor.
     */
    public function __construct(protected LocationRepositoryInterface $repository)
    {
    }

    /**
     * Update an existing location.
     *
     * @throws DataValidationException
     * @throws RecordNotFoundException
     */
    public function handle(Location|int $location, array $data): Location
    {
        $location = ($location instanceof Location) ? $location->id : $location;

        return $this->repository->update($location, $data);
    }
}
