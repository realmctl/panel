<?php

namespace Pterodactyl\Transformers\Api\Client;

use Pterodactyl\Models\ScheduleRunTask;

class ScheduleRunTaskTransformer extends BaseClientTransformer
{
    public function getResourceName(): string
    {
        return ScheduleRunTask::RESOURCE_NAME;
    }

    public function transform(ScheduleRunTask $model): array
    {
        return [
            'id' => $model->id,
            'task_id' => $model->task_id,
            'sequence_id' => $model->sequence_id,
            'action' => $model->action,
            'payload' => $model->payload,
            'status' => $model->status,
            'started_at' => $model->started_at?->toAtomString(),
            'completed_at' => $model->completed_at?->toAtomString(),
            'error_message' => $model->error_message,
        ];
    }
}
