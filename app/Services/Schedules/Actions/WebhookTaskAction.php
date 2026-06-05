<?php

namespace Pterodactyl\Services\Schedules\Actions;

use GuzzleHttp\Client;
use InvalidArgumentException;
use Pterodactyl\Contracts\Schedules\TaskActionInterface;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Task;

class WebhookTaskAction implements TaskActionInterface
{
    public function __construct(private Client $client)
    {
    }

    public function identifier(): string
    {
        return Task::ACTION_WEBHOOK;
    }

    public function label(): string
    {
        return 'Send Webhook';
    }

    public function description(): string
    {
        return 'Send an HTTP request to a webhook URL. Payload: JSON with url, optional method, headers, and body.';
    }

    public function execute(Server $server, Task $task): void
    {
        $config = json_decode($task->payload, true);
        if (!is_array($config) || empty($config['url'])) {
            throw new InvalidArgumentException('Webhook payload must be JSON containing a "url" field.');
        }

        $url = $config['url'];
        $method = strtoupper($config['method'] ?? 'POST');
        $headers = $config['headers'] ?? ['Content-Type' => 'application/json'];
        $body = $config['body'] ?? json_encode([
            'event' => 'automation.task',
            'server' => $server->name,
            'server_uuid' => $server->uuid,
            'task_action' => $task->action,
        ]);

        if (is_array($body)) {
            $body = json_encode($body);
        }

        $this->client->request($method, $url, [
            'headers' => $headers,
            'body' => $body,
            'timeout' => 15,
            'http_errors' => true,
        ]);
    }
}
