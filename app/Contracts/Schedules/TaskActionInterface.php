<?php

namespace Pterodactyl\Contracts\Schedules;

use Pterodactyl\Models\Server;
use Pterodactyl\Models\Task;

interface TaskActionInterface
{
    public function identifier(): string;

    public function label(): string;

    public function description(): string;

    public function execute(Server $server, Task $task): void;
}
