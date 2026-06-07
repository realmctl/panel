<?php

namespace Realm\Services\Schedules;

use Exception;
use Realm\Models\Server;
use Realm\Models\Task;
use Realm\Repositories\Wings\DaemonServerRepository;

class TaskConditionEvaluator
{
    public function __construct(private DaemonServerRepository $serverRepository)
    {
    }

    public function shouldSkip(Server $server, Task $task): ?string
    {
        if (empty($task->condition)) {
            return null;
        }

        return match ($task->condition) {
            Task::CONDITION_REQUIRE_ONLINE => $this->evaluateRequireOnline($server),
            Task::CONDITION_REQUIRE_BACKUP_CAPACITY => $this->evaluateRequireBackupCapacity($server),
            default => null,
        };
    }

    private function evaluateRequireOnline(Server $server): ?string
    {
        try {
            $details = $this->serverRepository->setServer($server)->getDetails();
            $state = $details['state'] ?? 'offline';

            if (in_array($state, ['offline', 'stopping'])) {
                return 'Server is not online.';
            }
        } catch (Exception) {
            return 'Unable to determine server state.';
        }

        return null;
    }

    private function evaluateRequireBackupCapacity(Server $server): ?string
    {
        if ($server->backup_limit <= 0) {
            return 'Server backup limit is set to 0.';
        }

        $count = $server->backups()->count();
        if ($count >= $server->backup_limit) {
            return 'Server has reached its backup limit.';
        }

        return null;
    }
}
