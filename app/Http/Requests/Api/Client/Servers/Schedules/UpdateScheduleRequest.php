<?php

namespace Realm\Http\Requests\Api\Client\Servers\Schedules;

use Realm\Models\Permission;

class UpdateScheduleRequest extends StoreScheduleRequest
{
    public function permission(): string
    {
        return Permission::ACTION_SCHEDULE_UPDATE;
    }
}
