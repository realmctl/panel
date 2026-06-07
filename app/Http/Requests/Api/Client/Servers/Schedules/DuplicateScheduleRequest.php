<?php

namespace Realm\Http\Requests\Api\Client\Servers\Schedules;

use Realm\Models\Permission;

class DuplicateScheduleRequest extends ViewScheduleRequest
{
    public function permission(): string
    {
        return Permission::ACTION_SCHEDULE_CREATE;
    }

    public function rules(): array
    {
        return [];
    }
}
