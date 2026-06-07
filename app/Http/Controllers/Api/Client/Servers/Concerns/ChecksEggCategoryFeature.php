<?php

namespace Realm\Http\Controllers\Api\Client\Servers\Concerns;

use Realm\Models\Server;
use Realm\Services\Eggs\EggCategoryMappingService;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

trait ChecksEggCategoryFeature
{
    protected function ensureServerSupportsFeature(Server $server, string $feature): void
    {
        if (!app(EggCategoryMappingService::class)->serverSupportsFeature($server, $feature)) {
            throw new NotFoundHttpException('This feature is not available for this server.');
        }
    }
}
