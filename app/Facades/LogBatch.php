<?php

namespace Realm\Facades;

use Illuminate\Support\Facades\Facade;
use Realm\Services\Activity\ActivityLogBatchService;

class LogBatch extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return ActivityLogBatchService::class;
    }
}
