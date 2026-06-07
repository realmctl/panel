<?php

namespace Realm\Exceptions;

use Exception;
use Realm\Exceptions\Solutions\ManifestDoesNotExistSolution;
use Spatie\Ignition\Contracts\Solution;
use Spatie\Ignition\Contracts\ProvidesSolution;

class ManifestDoesNotExistException extends Exception implements ProvidesSolution
{
    public function getSolution(): Solution
    {
        return new ManifestDoesNotExistSolution();
    }
}
