<?php

namespace Realm\Services\Locations;

use Realm\Exceptions\Model\DataValidationException;
use Realm\Models\Location;
use Realm\Contracts\Repository\LocationRepositoryInterface;

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
