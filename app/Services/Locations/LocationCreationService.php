<?php

namespace Pterodactyl\Services\Locations;

use Pterodactyl\Exceptions\Model\DataValidationException;
use Pterodactyl\Models\Location;
use Pterodactyl\Contracts\Repository\LocationRepositoryInterface;

class LocationCreationService
{
    /**
     * LocationCreationService constructor.
     */
    public function __construct(protected LocationRepositoryInterface $repository)
    {
    }

    /**
     * Create a new location.
     *
     * @throws DataValidationException
     */
    public function handle(array $data): Location
    {
        return $this->repository->create($data);
    }
}
