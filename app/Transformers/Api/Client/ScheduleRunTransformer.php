<?php

namespace Pterodactyl\Transformers\Api\Client;

use Pterodactyl\Models\ScheduleRun;
use Pterodactyl\Models\ScheduleRunTask;
use League\Fractal\Resource\Collection;

class ScheduleRunTransformer extends BaseClientTransformer
{
    protected array $availableIncludes = ['tasks'];

    protected array $defaultIncludes = ['tasks'];

    public function getResourceName(): string
    {
        return ScheduleRun::RESOURCE_NAME;
    }

    public function transform(ScheduleRun $model): array
    {
        return [
            'id' => $model->id,
            'status' => $model->status,
            'trigger' => $model->trigger,
            'started_at' => $model->started_at?->toAtomString(),
            'completed_at' => $model->completed_at?->toAtomString(),
            'error_message' => $model->error_message,
            'created_at' => $model->created_at->toAtomString(),
        ];
    }

    public function includeTasks(ScheduleRun $model): Collection
    {
        return $this->collection(
            $model->runTasks,
            $this->makeTransformer(ScheduleRunTaskTransformer::class),
            ScheduleRunTask::RESOURCE_NAME
        );
    }
}
