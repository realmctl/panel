<?php

namespace Pterodactyl\Contracts\Repository;

use Pterodactyl\Exceptions\Repository\RecordNotFoundException;
use Pterodactyl\Models\Task;

interface TaskRepositoryInterface extends RepositoryInterface
{
    /**
     * Get a task and the server relationship for that task.
     *
     * @throws RecordNotFoundException
     */
    public function getTaskForJobProcess(int $id): Task;

    /**
     * Returns the next task in a schedule.
     */
    public function getNextTask(int $schedule, int $index): ?Task;
}
