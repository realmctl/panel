<?php

namespace Realm\Facades;

use Illuminate\Support\Facades\Facade;
use Realm\Services\Activity\ActivityLogService;

class Activity extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return ActivityLogService::class;
    }
}
