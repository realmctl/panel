<?php

namespace Realm\Services\Ai\Providers;

interface AiProviderInterface
{
    /**
     * Send a chat-style request and return the assistant's reply text.
     *
     * @param array $messages Array of ['role' => 'system'|'user'|'assistant', 'content' => string]
     * @param array $options  Optional overrides: 'model', 'max_tokens', 'temperature'
     */
    public function chat(array $messages, array $options = []): string;
}
