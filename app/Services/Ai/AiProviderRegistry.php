<?php

namespace Realm\Services\Ai;

class AiProviderRegistry
{
    /**
     * Supported AI provider types and their metadata. `custom_base_url` marks types where
     * the admin must (or may) supply their own API base URL — e.g. a self-hosted or
     * OpenAI-compatible endpoint that isn't one of the mainstream providers below.
     */
    public static function all(): array
    {
        return [
            'anthropic' => [
                'title' => 'Anthropic (Claude)',
                'default_model' => 'claude-sonnet-5',
                'custom_base_url' => false,
            ],
            'openai' => [
                'title' => 'OpenAI',
                'default_model' => 'gpt-5',
                'custom_base_url' => false,
            ],
            'deepseek' => [
                'title' => 'DeepSeek',
                'default_model' => 'deepseek-chat',
                'custom_base_url' => false,
            ],
            'google' => [
                'title' => 'Google (Gemini)',
                'default_model' => 'gemini-2.5-flash',
                'custom_base_url' => false,
            ],
            'openrouter' => [
                'title' => 'OpenRouter',
                'default_model' => 'openrouter/auto',
                'custom_base_url' => false,
            ],
            'custom' => [
                'title' => 'Custom (OpenAI-compatible)',
                'default_model' => '',
                'custom_base_url' => true,
            ],
        ];
    }

    public static function title(string $type): string
    {
        return self::all()[$type]['title'] ?? $type;
    }

    public static function defaultModel(string $type): string
    {
        return self::all()[$type]['default_model'] ?? '';
    }
}
