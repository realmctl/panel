<?php

namespace Realm\Facades;

use Illuminate\Support\Facades\Facade;
use Realm\Services\Activity\ActivityLogTargetableService;

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
