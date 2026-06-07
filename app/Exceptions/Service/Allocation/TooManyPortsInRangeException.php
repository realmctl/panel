<?php

namespace Realm\Exceptions\Service\Allocation;

use Realm\Exceptions\DisplayException;

class TooManyPortsInRangeException extends DisplayException
{
    /**
     * TooManyPortsInRangeException constructor.
     */
    public function __construct()
    {
        parent::__construct(trans('exceptions.allocations.too_many_ports'));
    }
}
