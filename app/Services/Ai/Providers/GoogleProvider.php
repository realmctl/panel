<?php

namespace Realm\Services\Ai\Providers;

use Illuminate\Support\Facades\Http;
use Realm\Services\Ai\AiProviderRegistry;

class GoogleProvider extends AbstractAiProvider
{
    public function chat(array $messages, array $options = []): string
    {
        $model = $options['model'] ?? $this->model(AiProviderRegistry::defaultModel('google'));

        $systemInstruction = null;
        $contents = [];

        foreach ($messages as $message) {
            if ($message['role'] === 'system') {
                $systemInstruction = ['parts' => [['text' => $message['content']]]];
                continue;
            }

            $contents[] = [
                'role' => $message['role'] === 'assistant' ? 'model' : 'user',
                'parts' => [['text' => $message['content']]],
            ];
        }

        $response = Http::withHeaders([
            'x-goog-api-key' => $this->apiKey(),
            'content-type' => 'application/json',
        ])->post(
            "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent",
            array_filter([
                'contents' => $contents,
                'systemInstruction' => $systemInstruction,
                'generationConfig' => array_filter([
                    'maxOutputTokens' => $options['max_tokens'] ?? null,
                    'temperature' => $options['temperature'] ?? null,
                ]),
            ], fn ($value) => !is_null($value) && $value !== [])
        );

        if (!$response->successful()) {
            throw new \RuntimeException('Google API error: ' . ($response->json('error.message') ?? $response->body()));
        }

        return $response->json('candidates.0.content.parts.0.text') ?? '';
    }
}
