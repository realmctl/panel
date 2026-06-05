<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers\Schedules;

use Illuminate\Validation\Rule;
use Pterodactyl\Models\Permission;
use Pterodactyl\Models\Task;
use Pterodactyl\Services\Schedules\TaskActionRegistry;

class StoreTaskRequest extends ViewScheduleRequest
{
    public function permission(): string
    {
        return Permission::ACTION_SCHEDULE_UPDATE;
    }

    public function rules(): array
    {
        $actions = app(TaskActionRegistry::class)->identifiers();

        return [
            'action' => ['required', Rule::in($actions)],
            'payload' => [
                Rule::requiredIf(fn () => !in_array($this->input('action'), [Task::ACTION_BACKUP, Task::ACTION_DELETE_FILES], true)),
                'nullable',
                'string',
            ],
            'time_offset' => 'required|numeric|min:0|max:900',
            'sequence_id' => 'sometimes|required|numeric|min:1',
            'continue_on_failure' => 'sometimes|required|boolean',
            'condition' => ['nullable', 'string', Rule::in([
                Task::CONDITION_REQUIRE_ONLINE,
                Task::CONDITION_REQUIRE_BACKUP_CAPACITY,
            ])],
        ];
    }
}
