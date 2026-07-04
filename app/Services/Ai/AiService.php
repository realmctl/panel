<?php

namespace Realm\Services\Ai;

use Realm\Models\AiProvider;

/**
 * Single entry point for future AI-powered panel features. Resolve via the container
 * (`app(AiService::class)`) and call `chat()`/`complete()` — uses whichever provider
 * the admin has configured under Settings -> Advanced.
 */
class AiService
{
    public function isConfigured(): bool
    {
        return AiProvider::query()->exists();
    }

    /**
     * @param array $messages Array of ['role' => 'system'|'user'|'assistant', 'content' => string]
     * @param array $options  Optional overrides: 'model', 'max_tokens', 'temperature'
     */
    public function chat(array $messages, array $options = []): string
    {
        $config = AiProvider::query()->first();

        if (!$config) {
            throw new \RuntimeException('No AI provider is configured. Set one up under Settings -> Advanced.');
        }

        return AiProviderFactory::make($config)->chat($messages, $options);
    }

    public function complete(string $prompt, array $options = []): string
    {
        return $this->chat([['role' => 'user', 'content' => $prompt]], $options);
    }
}
