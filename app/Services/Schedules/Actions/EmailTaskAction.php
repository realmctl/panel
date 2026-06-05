<?php

namespace Pterodactyl\Services\Schedules\Actions;

use Illuminate\Support\Facades\Mail;
use InvalidArgumentException;
use Pterodactyl\Contracts\Schedules\TaskActionInterface;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Task;

class EmailTaskAction implements TaskActionInterface
{
    public function identifier(): string
    {
        return Task::ACTION_EMAIL;
    }

    public function label(): string
    {
        return 'Send Email';
    }

    public function description(): string
    {
        return 'Send an email to the server owner. Payload: JSON with subject and body fields.';
    }

    public function execute(Server $server, Task $task): void
    {
        $config = json_decode($task->payload, true);
        if (!is_array($config) || empty($config['subject']) || empty($config['body'])) {
            throw new InvalidArgumentException('Email payload must be JSON containing "subject" and "body" fields.');
        }

        $owner = $server->user;
        if (!$owner || !$owner->email) {
            throw new InvalidArgumentException('Server owner does not have an email address configured.');
        }

        Mail::raw($config['body'], function ($message) use ($owner, $config, $server) {
            $message->to($owner->email)
                ->subject($config['subject'] . ' [' . $server->name . ']');
        });
    }
}
