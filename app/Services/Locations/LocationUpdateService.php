<?php

namespace Pterodactyl\Services\Locations;

use Pterodactyl\Exceptions\Model\DataValidationException;
use Pterodactyl\Exceptions\Repository\RecordNotFoundException;
use Pterodactyl\Models\Location;
use Pterodactyl\Contracts\Repository\LocationRepositoryInterface;

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
