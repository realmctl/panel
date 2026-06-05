<?php

namespace Pterodactyl\Services\Schedules\Actions;

use Pterodactyl\Contracts\Schedules\TaskActionInterface;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Task;
use Pterodactyl\Repositories\Wings\DaemonPowerRepository;

class PowerTaskAction implements TaskActionInterface
{
    public function __construct(private DaemonPowerRepository $powerRepository)
    {
    }

    public function identifier(): string
    {
        return Task::ACTION_POWER;
    }

    public function label(): string
    {
        return 'Send Power Action';
    }

    public function description(): string
    {
        return 'Send a power signal to the server (start, stop, restart, or kill).';
    }

    public function execute(Server $server, Task $task): void
    {
        $this->powerRepository->setServer($server)->send($task->payload);
    }
}
