<?php

namespace Pterodactyl\Services\Schedules\Actions;

use Pterodactyl\Contracts\Schedules\TaskActionInterface;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Task;
use Pterodactyl\Repositories\Wings\DaemonCommandRepository;

class CommandTaskAction implements TaskActionInterface
{
    public function __construct(private DaemonCommandRepository $commandRepository)
    {
    }

    public function identifier(): string
    {
        return Task::ACTION_COMMAND;
    }

    public function label(): string
    {
        return 'Send Command';
    }

    public function description(): string
    {
        return 'Send a command to the server console.';
    }

    public function execute(Server $server, Task $task): void
    {
        $this->commandRepository->setServer($server)->send($task->payload);
    }
}
