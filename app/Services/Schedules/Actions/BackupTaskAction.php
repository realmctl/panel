<?php

namespace Realm\Services\Schedules\Actions;

use Realm\Contracts\Schedules\TaskActionInterface;
use Realm\Models\Server;
use Realm\Models\Task;
use Realm\Services\Backups\InitiateBackupService;

class BackupTaskAction implements TaskActionInterface
{
    public function __construct(private InitiateBackupService $backupService)
    {
    }

    public function identifier(): string
    {
        return Task::ACTION_BACKUP;
    }

    public function label(): string
    {
        return 'Create Backup';
    }

    public function description(): string
    {
        return 'Create a server backup, optionally ignoring specific files.';
    }

    public function execute(Server $server, Task $task): void
    {
        $this->backupService
            ->setIgnoredFiles(explode(PHP_EOL, $task->payload))
            ->handle($server, null, true);
    }
}
