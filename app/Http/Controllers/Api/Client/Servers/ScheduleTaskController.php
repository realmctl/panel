<?php

namespace Realm\Http\Controllers\Api\Client\Servers;

use Realm\Exceptions\Model\DataValidationException;
use Realm\Exceptions\Repository\RecordNotFoundException;
use Exception;
use Realm\Models\Task;
use Illuminate\Http\Response;
use Realm\Models\Server;
use Realm\Models\Schedule;
use Illuminate\Http\JsonResponse;
use Realm\Facades\Activity;
use Realm\Models\Permission;
use Illuminate\Database\ConnectionInterface;
use Realm\Repositories\Eloquent\TaskRepository;
use Realm\Exceptions\Http\HttpForbiddenException;
use Realm\Transformers\Api\Client\TaskTransformer;
use Realm\Http\Requests\Api\Client\ClientApiRequest;
use Realm\Http\Controllers\Api\Client\ClientApiController;
use Realm\Exceptions\Service\ServiceLimitExceededException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Realm\Http\Requests\Api\Client\Servers\Schedules\StoreTaskRequest;

class ScheduleTaskController extends ClientApiController
{
    /**
     * ScheduleTaskController constructor.
     */
    public function __construct(
        private ConnectionInterface $connection,
        private TaskRepository $repository,
    ) {
        parent::__construct();
    }

    /**
     * Create a new task for a given schedule and store it in the database.
     *
     * @throws DataValidationException
     * @throws ServiceLimitExceededException
     */
    public function store(StoreTaskRequest $request, Server $server, Schedule $schedule): array
    {
        $limit = config('realm.client_features.schedules.per_schedule_task_limit', 10);
        if ($schedule->tasks()->count() >= $limit) {
            throw new ServiceLimitExceededException("Schedules may not have more than $limit tasks associated with them. Creating this task would put this schedule over the limit.");
        }

        if ($server->backup_limit === 0 && $request->action === 'backup') {
            throw new HttpForbiddenException("A backup task cannot be created when the server's backup limit is set to 0.");
        }

        /** @var Task|null $lastTask */
        $lastTask = $schedule->tasks()->orderByDesc('sequence_id')->first();

        /** @var Task $task */
        $task = $this->connection->transaction(function () use ($request, $schedule, $lastTask) {
            $sequenceId = ($lastTask->sequence_id ?? 0) + 1;
            $requestSequenceId = $request->integer('sequence_id', $sequenceId);

            // Ensure that the sequence id is at least 1.
            if ($requestSequenceId < 1) {
                $requestSequenceId = 1;
            }

            // If the sequence id from the request is greater than or equal to the next available
            // sequence id, we don't need to do anything special.  Otherwise, we need to update
            // the sequence id of all tasks that are greater than or equal to the request sequence
            // id to be one greater than the current value.
            if ($requestSequenceId < $sequenceId) {
                $schedule->tasks()
                    ->where('sequence_id', '>=', $requestSequenceId)
                    ->increment('sequence_id');
                $sequenceId = $requestSequenceId;
            }

            return $this->repository->create([
                'schedule_id' => $schedule->id,
                'sequence_id' => $sequenceId,
                'action' => $request->input('action'),
                'payload' => $request->input('payload') ?? '',
                'time_offset' => $request->input('time_offset'),
                'continue_on_failure' => $request->boolean('continue_on_failure'),
                'condition' => $request->input('condition'),
            ]);
        });

        Activity::event('server:task.create')
            ->subject($schedule, $task)
            ->property(['name' => $schedule->name, 'action' => $task->action, 'payload' => $task->payload])
            ->log();

        return $this->fractal->item($task)
            ->transformWith($this->getTransformer(TaskTransformer::class))
            ->toArray();
    }

    /**
     * Updates a given task for a server.
     *
     * @throws DataValidationException
     * @throws RecordNotFoundException
     */
    public function update(StoreTaskRequest $request, Server $server, Schedule $schedule, Task $task): array
    {
        if ($schedule->id !== $task->schedule_id || $server->id !== $schedule->server_id) {
            throw new NotFoundHttpException();
        }

        if ($server->backup_limit === 0 && $request->action === 'backup') {
            throw new HttpForbiddenException("A backup task cannot be created when the server's backup limit is set to 0.");
        }

        $this->connection->transaction(function () use ($request, $schedule, $task) {
            $sequenceId = $request->integer('sequence_id', $task->sequence_id);
            // Ensure that the sequence id is at least 1.
            if ($sequenceId < 1) {
                $sequenceId = 1;
            }

            // Shift all other tasks in the schedule up or down to make room for the new task.
            if ($sequenceId < $task->sequence_id) {
                $schedule->tasks()
                    ->where('sequence_id', '>=', $sequenceId)
                    ->where('sequence_id', '<', $task->sequence_id)
                    ->increment('sequence_id');
            } elseif ($sequenceId > $task->sequence_id) {
                $schedule->tasks()
                    ->where('sequence_id', '>', $task->sequence_id)
                    ->where('sequence_id', '<=', $sequenceId)
                    ->decrement('sequence_id');
            }

            $this->repository->update($task->id, [
                'sequence_id' => $sequenceId,
                'action' => $request->input('action'),
                'payload' => $request->input('payload') ?? '',
                'time_offset' => $request->input('time_offset'),
                'continue_on_failure' => $request->boolean('continue_on_failure'),
                'condition' => $request->input('condition'),
            ]);
        });

        Activity::event('server:task.update')
            ->subject($schedule, $task)
            ->property(['name' => $schedule->name, 'action' => $task->action, 'payload' => $task->payload])
            ->log();

        return $this->fractal->item($task->refresh())
            ->transformWith($this->getTransformer(TaskTransformer::class))
            ->toArray();
    }

    /**
     * Delete a given task for a schedule. If there are subsequent tasks stored in the database
     * for this schedule their sequence IDs are decremented properly.
     *
     * @throws Exception
     */
    public function delete(ClientApiRequest $request, Server $server, Schedule $schedule, Task $task): JsonResponse
    {
        if ($task->schedule_id !== $schedule->id || $schedule->server_id !== $server->id) {
            throw new NotFoundHttpException();
        }

        if (!$request->user()->can(Permission::ACTION_SCHEDULE_UPDATE, $server)) {
            throw new HttpForbiddenException('You do not have permission to perform this action.');
        }

        $schedule->tasks()
            ->where('sequence_id', '>', $task->sequence_id)
            ->decrement('sequence_id');
        $task->delete();

        Activity::event('server:task.delete')->subject($schedule, $task)->property('name', $schedule->name)->log();

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Reorder tasks in a schedule by providing task IDs in the desired sequence.
     */
    public function reorder(ClientApiRequest $request, Server $server, Schedule $schedule): array
    {
        if ($schedule->server_id !== $server->id) {
            throw new NotFoundHttpException();
        }

        if (!$request->user()->can(Permission::ACTION_SCHEDULE_UPDATE, $server)) {
            throw new HttpForbiddenException('You do not have permission to perform this action.');
        }

        $order = $request->input('order', []);
        if (!is_array($order) || empty($order)) {
            throw new HttpForbiddenException('A valid task order array must be provided.');
        }

        $tasks = $schedule->tasks()->get()->keyBy('id');
        if ($tasks->count() !== count($order) || $tasks->keys()->diff($order)->isNotEmpty()) {
            throw new HttpForbiddenException('Task order must include every task in the schedule exactly once.');
        }

        $this->connection->transaction(function () use ($order, $tasks) {
            foreach (array_values($order) as $index => $taskId) {
                /** @var Task $task */
                $task = $tasks->get((int) $taskId);
                $task->update(['sequence_id' => $index + 1]);
            }
        });

        $schedule->load('tasks');

        return $this->fractal->collection($schedule->tasks)
            ->transformWith($this->getTransformer(TaskTransformer::class))
            ->toArray();
    }
}
