<?php

namespace Realm\Services\Ai\Providers;

use Illuminate\Support\Facades\Http;
use Realm\Services\Ai\AiProviderRegistry;

/**
 * Handles every provider that speaks the OpenAI chat-completions wire format:
 * OpenAI itself, DeepSeek, OpenRouter, and any custom OpenAI-compatible endpoint.
 */
class OpenAiCompatibleProvider extends AbstractAiProvider
{
    protected function baseUrl(): string
    {
        if ($this->config->base_url) {
            return rtrim($this->config->base_url, '/');
        }

        return match ($this->config->type) {
            'openai' => 'https://api.openai.com/v1',
            'deepseek' => 'https://api.deepseek.com',
            'openrouter' => 'https://openrouter.ai/api/v1',
            default => throw new \RuntimeException('This provider requires a base URL to be configured.'),
        };
    }

    public function chat(array $messages, array $options = []): string
    {
        $response = Http::withToken($this->apiKey())
            ->post("{$this->baseUrl()}/chat/completions", array_filter([
                'model' => $options['model'] ?? $this->model(AiProviderRegistry::defaultModel($this->config->type)),
                'messages' => $messages,
                'max_tokens' => $options['max_tokens'] ?? null,
                'temperature' => $options['temperature'] ?? null,
            ], fn ($value) => !is_null($value)));

        if (!$response->successful()) {
            throw new \RuntimeException(
                ucfirst($this->config->type) . ' API error: ' . ($response->json('error.message') ?? $response->body())
            );
        }

        return $response->json('choices.0.message.content') ?? '';
    }
}
