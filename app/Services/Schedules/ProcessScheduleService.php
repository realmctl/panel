<?php

namespace Realm\Services\Schedules;

use Throwable;
use Exception;
use Realm\Models\Schedule;
use Realm\Models\ScheduleRun;
use Illuminate\Contracts\Bus\Dispatcher;
use Realm\Jobs\Schedule\RunTaskJob;
use Illuminate\Database\ConnectionInterface;
use Realm\Exceptions\DisplayException;
use Realm\Repositories\Wings\DaemonServerRepository;
use Realm\Exceptions\Http\Connection\DaemonConnectionException;

class ProcessScheduleService
{
    public function __construct(
        private ConnectionInterface $connection,
        private Dispatcher $dispatcher,
        private DaemonServerRepository $serverRepository,
        private ScheduleRunService $runService,
    ) {
    }

    /**
     * @throws Throwable
     */
    public function handle(Schedule $schedule, bool $now = false): void
    {
        $task = $schedule->tasks()->orderBy('sequence_id')->first();
        if (is_null($task)) {
            throw new DisplayException('Cannot process schedule for task execution: no tasks are registered.');
        }

        $run = null;

        $this->connection->transaction(function () use ($schedule, $task, $now, &$run) {
            $schedule->forceFill([
                'is_processing' => true,
                'next_run_at' => $schedule->getNextRunDate(),
            ])->saveOrFail();

            $task->update(['is_queued' => true]);

            $run = $this->runService->create($schedule, $now);
        });

        $job = new RunTaskJob($task, $now, $run->id);

        if ($schedule->only_when_online && !$now) {
            try {
                $details = $this->serverRepository->setServer($schedule->server)->getDetails();
                $state = $details['state'] ?? 'offline';
                if (in_array($state, ['offline', 'stopping'])) {
                    $this->runService->completeRun($run, ScheduleRun::STATUS_SKIPPED, 'Server is not online.');
                    $job->failed();

                    return;
                }
            } catch (Exception $exception) {
                if (!$exception instanceof DaemonConnectionException) {
                    $this->runService->completeRun($run, ScheduleRun::STATUS_FAILED, $exception->getMessage());
                    $job->failed($exception);

                    return;
                }

                $this->runService->completeRun($run, ScheduleRun::STATUS_SKIPPED, 'Unable to connect to the server.');
                $job->failed();

                return;
            }
        }

        if (!$now) {
            $this->dispatcher->dispatch($job->delay($task->time_offset));
        } else {
            try {
                $this->dispatcher->dispatchNow($job);
            } catch (Exception $exception) {
                $job->failed($exception);

                throw $exception;
            }
        }
    }
}
