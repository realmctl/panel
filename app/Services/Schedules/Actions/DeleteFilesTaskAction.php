<?php

namespace Pterodactyl\Services\Schedules\Actions;

use InvalidArgumentException;
use Pterodactyl\Contracts\Schedules\TaskActionInterface;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Task;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;

class DeleteFilesTaskAction implements TaskActionInterface
{
    public function __construct(private DaemonFileRepository $fileRepository)
    {
    }

    public function identifier(): string
    {
        return Task::ACTION_DELETE_FILES;
    }

    public function label(): string
    {
        return 'Delete Files';
    }

    public function description(): string
    {
        return 'Delete files or folders from the server. Payload: one path per line, relative to /.';
    }

    public function execute(Server $server, Task $task): void
    {
        $files = array_values(array_filter(array_map('trim', explode(PHP_EOL, $task->payload))));
        if (empty($files)) {
            throw new InvalidArgumentException('At least one file path must be provided.');
        }

        $this->fileRepository->setServer($server)->deleteFiles('/', $files);
    }
}
