<?php

namespace Realm\Contracts\Schedules;

use Realm\Models\Server;
use Realm\Models\Task;

interface TaskActionInterface
{
    public function identifier(): string;

    public function label(): string;

    public function description(): string;

    public function execute(Server $server, Task $task): void;
}
