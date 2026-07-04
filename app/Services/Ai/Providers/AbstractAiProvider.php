<?php

namespace Realm\Services\Ai\Providers;

use Realm\Models\AiProvider;

abstract class AbstractAiProvider implements AiProviderInterface
{
    public function __construct(protected AiProvider $config)
    {
    }

    protected function apiKey(): string
    {
        return decrypt($this->config->api_key);
    }

    protected function model(string $default): string
    {
        return $this->config->model ?: $default;
    }
}
