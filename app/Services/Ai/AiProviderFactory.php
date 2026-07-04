<?php

namespace Realm\Services\Ai;

use Realm\Models\AiProvider;
use Realm\Services\Ai\Providers\AiProviderInterface;
use Realm\Services\Ai\Providers\AnthropicProvider;
use Realm\Services\Ai\Providers\GoogleProvider;
use Realm\Services\Ai\Providers\OpenAiCompatibleProvider;

class AiProviderFactory
{
    public static function make(AiProvider $config): AiProviderInterface
    {
        return match ($config->type) {
            'anthropic' => new AnthropicProvider($config),
            'google' => new GoogleProvider($config),
            'openai', 'deepseek', 'openrouter', 'custom' => new OpenAiCompatibleProvider($config),
            default => throw new \InvalidArgumentException("Unsupported AI provider type: {$config->type}"),
        };
    }
}
