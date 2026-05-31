<?php

namespace Pterodactyl\Facades;

use Illuminate\Support\Facades\Facade;
use Pterodactyl\Services\Activity\ActivityLogTargetableService;

/**
 * @mixin ActivityLogTargetableService
 */
class LogTarget extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return ActivityLogTargetableService::class;
    }
}
