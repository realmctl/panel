<?php

namespace Realm\Http\Requests\Api\Client\Servers\Schedules;

use Realm\Models\Permission;
use Realm\Services\Schedules\TaskActionRegistry;
use Illuminate\Validation\Rule;

class ImportScheduleRequest extends ViewScheduleRequest
{
    public function permission(): string
    {
        return Permission::ACTION_SCHEDULE_CREATE;
    }

    public function rules(): array
    {
        $actions = app(TaskActionRegistry::class)->identifiers();

        return [
            'template' => 'required|array',
            'template.name' => 'required|string|max:191',
            'template.cron' => 'required|array',
            'template.cron.minute' => 'required|string',
            'template.cron.hour' => 'required|string',
            'template.cron.day_of_month' => 'required|string',
            'template.cron.month' => 'required|string',
            'template.cron.day_of_week' => 'required|string',
            'template.only_when_online' => 'sometimes|boolean',
            'template.is_active' => 'sometimes|boolean',
            'template.tasks' => 'required|array|min:1',
            'template.tasks.*.action' => ['required', Rule::in($actions)],
            'template.tasks.*.payload' => 'nullable|string',
            'template.tasks.*.time_offset' => 'sometimes|numeric|min:0|max:900',
            'template.tasks.*.continue_on_failure' => 'sometimes|boolean',
            'template.tasks.*.condition' => 'nullable|string|in:require_online,require_backup_capacity',
        ];
    }
}
