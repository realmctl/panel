<?php

namespace Realm\Services\Ai\Providers;

use Illuminate\Support\Facades\Http;
use Realm\Services\Ai\AiProviderRegistry;

class AnthropicProvider extends AbstractAiProvider
{
    public function chat(array $messages, array $options = []): string
    {
        $system = null;
        $turns = [];

        foreach ($messages as $message) {
            if ($message['role'] === 'system') {
                $system = $message['content'];
                continue;
            }

            $turns[] = ['role' => $message['role'], 'content' => $message['content']];
        }

        $response = Http::withHeaders([
            'x-api-key' => $this->apiKey(),
            'anthropic-version' => '2023-06-01',
            'content-type' => 'application/json',
        ])->post('https://api.anthropic.com/v1/messages', array_filter([
            'model' => $options['model'] ?? $this->model(AiProviderRegistry::defaultModel('anthropic')),
            'max_tokens' => $options['max_tokens'] ?? 1024,
            'temperature' => $options['temperature'] ?? null,
            'system' => $system,
            'messages' => $turns,
        ], fn ($value) => !is_null($value)));

        if (!$response->successful()) {
            throw new \RuntimeException('Anthropic API error: ' . ($response->json('error.message') ?? $response->body()));
        }

        return $response->json('content.0.text') ?? '';
    }
}
