<?php

namespace Pterodactyl\Services\Schedules;

use Carbon\CarbonImmutable;
use Pterodactyl\Events\Schedule\ScheduleRunCompleted;
use Pterodactyl\Events\Schedule\ScheduleRunStarted;
use Pterodactyl\Models\Schedule;
use Pterodactyl\Models\ScheduleRun;
use Pterodactyl\Models\ScheduleRunTask;

class ScheduleRunService
{
    public function create(Schedule $schedule, bool $manual): ScheduleRun
    {
        $run = ScheduleRun::query()->create([
            'schedule_id' => $schedule->id,
            'status' => ScheduleRun::STATUS_RUNNING,
            'trigger' => $manual ? ScheduleRun::TRIGGER_MANUAL : ScheduleRun::TRIGGER_CRON,
            'started_at' => CarbonImmutable::now(),
        ]);

        foreach ($schedule->tasks()->orderBy('sequence_id')->get() as $task) {
            ScheduleRunTask::query()->create([
                'schedule_run_id' => $run->id,
                'task_id' => $task->id,
                'sequence_id' => $task->sequence_id,
                'action' => $task->action,
                'payload' => $task->payload,
                'status' => ScheduleRunTask::STATUS_PENDING,
            ]);
        }

        event(new ScheduleRunStarted($run));

        return $run;
    }

    public function markTaskRunning(ScheduleRun $run, int $taskId): ?ScheduleRunTask
    {
        $runTask = $run->runTasks()->where('task_id', $taskId)->first();
        if (!$runTask) {
            return null;
        }

        $runTask->update([
            'status' => ScheduleRunTask::STATUS_RUNNING,
            'started_at' => CarbonImmutable::now(),
        ]);

        return $runTask->refresh();
    }

    public function markTaskCompleted(ScheduleRunTask $runTask): void
    {
        $runTask->update([
            'status' => ScheduleRunTask::STATUS_COMPLETED,
            'completed_at' => CarbonImmutable::now(),
        ]);
    }

    public function markTaskSkipped(ScheduleRunTask $runTask, string $reason): void
    {
        $runTask->update([
            'status' => ScheduleRunTask::STATUS_SKIPPED,
            'error_message' => $reason,
            'completed_at' => CarbonImmutable::now(),
        ]);
    }

    public function markTaskFailed(ScheduleRunTask $runTask, string $message): void
    {
        $runTask->update([
            'status' => ScheduleRunTask::STATUS_FAILED,
            'error_message' => $message,
            'completed_at' => CarbonImmutable::now(),
        ]);
    }

    public function completeRun(ScheduleRun $run, string $status = ScheduleRun::STATUS_COMPLETED, ?string $error = null): void
    {
        $run->update([
            'status' => $status,
            'error_message' => $error,
            'completed_at' => CarbonImmutable::now(),
        ]);

        event(new ScheduleRunCompleted($run->refresh()));
    }
}
