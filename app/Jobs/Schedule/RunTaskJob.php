<?php

namespace Realm\Jobs\Schedule;

use Exception;
use Throwable;
use Carbon\CarbonImmutable;
use Realm\Models\Task;
use Illuminate\Bus\Queueable;
use Realm\Models\ScheduleRun;
use Illuminate\Queue\SerializesModels;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Realm\Events\Schedule\ScheduleTaskExecuted;
use Realm\Services\Schedules\ScheduleRunService;
use Realm\Services\Schedules\TaskActionRegistry;
use Realm\Services\Schedules\TaskConditionEvaluator;
use Realm\Exceptions\Http\Connection\DaemonConnectionException;

class RunTaskJob implements ShouldQueue
{
    use Queueable;
    use DispatchesJobs;
    use SerializesModels;

    public function __construct(
        public Task $task,
        public bool $manualRun = false,
        public ?int $scheduleRunId = null,
    ) {
        $this->queue = 'standard';
    }

    /**
     * @throws Throwable
     */
    public function handle(
        TaskActionRegistry $actionRegistry,
        TaskConditionEvaluator $conditionEvaluator,
        ScheduleRunService $runService,
    ): void {
        if (!$this->task->schedule->is_active && !$this->manualRun) {
            $this->markTaskNotQueued();
            $this->markScheduleComplete($runService, ScheduleRun::STATUS_SKIPPED);

            return;
        }

        $server = $this->task->server;
        if (!is_null($server->status)) {
            $this->failed();

            return;
        }

        $run = $this->scheduleRunId ? ScheduleRun::query()->find($this->scheduleRunId) : null;
        $runTask = $run ? $runService->markTaskRunning($run, $this->task->id) : null;

        $skipReason = $conditionEvaluator->shouldSkip($server, $this->task);
        if ($skipReason) {
            if ($runTask) {
                $runService->markTaskSkipped($runTask, $skipReason);
                event(new ScheduleTaskExecuted($runTask->refresh(), true));
            }

            $this->markTaskNotQueued();
            $this->queueNextTask();

            return;
        }

        try {
            $actionRegistry->get($this->task->action)->execute($server, $this->task);

            if ($runTask) {
                $runService->markTaskCompleted($runTask);
                event(new ScheduleTaskExecuted($runTask->refresh(), true));
            }
        } catch (Exception $exception) {
            if ($runTask) {
                $runService->markTaskFailed($runTask, $exception->getMessage());
                event(new ScheduleTaskExecuted($runTask->refresh(), false));
            }

            if (!($this->task->continue_on_failure && $exception instanceof DaemonConnectionException)) {
                $this->markTaskNotQueued();
                $this->markScheduleComplete($runService, ScheduleRun::STATUS_FAILED, $exception->getMessage());

                throw $exception;
            }
        }

        $this->markTaskNotQueued();
        $this->queueNextTask();
    }

    public function failed(?Exception $exception = null): void
    {
        $runService = app(ScheduleRunService::class);

        if ($this->scheduleRunId) {
            $run = ScheduleRun::query()->find($this->scheduleRunId);
            if ($run) {
                $runTask = $run->runTasks()->where('task_id', $this->task->id)->first();
                if ($runTask && $runTask->status === \Realm\Models\ScheduleRunTask::STATUS_RUNNING) {
                    $runService->markTaskFailed($runTask, $exception?->getMessage() ?? 'Task failed.');
                }

                $runService->completeRun($run, ScheduleRun::STATUS_FAILED, $exception?->getMessage());
            }
        }

        $this->markTaskNotQueued();
        $this->task->schedule()->update([
            'is_processing' => false,
            'last_run_at' => CarbonImmutable::now()->toDateTimeString(),
        ]);
    }

    private function queueNextTask(): void
    {
        /** @var Task|null $nextTask */
        $nextTask = Task::query()->where('schedule_id', $this->task->schedule_id)
            ->orderBy('sequence_id', 'asc')
            ->where('sequence_id', '>', $this->task->sequence_id)
            ->first();

        if (is_null($nextTask)) {
            $runService = app(ScheduleRunService::class);
            $this->markScheduleComplete($runService);

            return;
        }

        $nextTask->update(['is_queued' => true]);

        $this->dispatch((new self($nextTask, $this->manualRun, $this->scheduleRunId))->delay($nextTask->time_offset));
    }

    private function markScheduleComplete(
        ?ScheduleRunService $runService = null,
        string $status = ScheduleRun::STATUS_COMPLETED,
        ?string $error = null,
    ): void {
        $runService ??= app(ScheduleRunService::class);

        if ($this->scheduleRunId) {
            $run = ScheduleRun::query()->find($this->scheduleRunId);
            if ($run) {
                $runService->completeRun($run, $status, $error);
            }
        }

        $this->task->schedule()->update([
            'is_processing' => false,
            'last_run_at' => CarbonImmutable::now()->toDateTimeString(),
        ]);
    }

    private function markTaskNotQueued(): void
    {
        $this->task->update(['is_queued' => false]);
    }
}
