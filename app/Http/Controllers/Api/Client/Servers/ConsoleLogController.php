<?php

namespace Realm\Http\Controllers\Api\Client\Servers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Realm\Models\Server;
use Realm\Http\Controllers\Api\Client\ClientApiController;
use Realm\Http\Requests\Api\Client\Servers\UploadConsoleLogRequest;
use Realm\Services\Ai\AiService;

class ConsoleLogController extends ClientApiController
{
    public function __construct(private AiService $aiService)
    {
        parent::__construct();
    }

    /**
     * Upload the current console buffer to mclo.gs (purpose-built log host for Minecraft
     * servers) and return the shareable URL.
     */
    public function upload(UploadConsoleLogRequest $request, Server $server): JsonResponse
    {
        $content = $request->input('content');

        // mclo.gs rejects logs over ~10MB — trim defensively, keeping the most recent output.
        if (strlen($content) > 8_000_000) {
            $content = substr($content, -8_000_000);
        }

        $response = Http::asForm()->post('https://api.mclo.gs/1/log', [
            'content' => $content,
        ]);

        if (!$response->successful() || !$response->json('success')) {
            return response()->json([
                'success' => false,
                'error' => $response->json('error') ?? 'Failed to upload logs.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'url' => $response->json('url'),
        ]);
    }

    /**
     * Summarize the current console buffer using the admin-configured AI provider.
     */
    public function summarize(UploadConsoleLogRequest $request, Server $server): JsonResponse
    {
        if (!$this->aiService->isConfigured()) {
            return response()->json([
                'success' => false,
                'error' => 'No AI provider is configured. An administrator can set one up under Settings -> Advanced.',
            ], 422);
        }

        $content = $request->input('content');

        // Keep only the most recent output — long console history would blow past most
        // providers' context windows and isn't relevant to "what's happening right now".
        if (strlen($content) > 12_000) {
            $content = substr($content, -12_000);
        }

        try {
            $summary = $this->aiService->chat([
                [
                    'role' => 'system',
                    'content' => 'You summarize game server console logs for a hosting panel. Be concise (max ~150 words). '
                        . 'Call out errors, warnings, crashes, and notable state changes (server started/stopped, players '
                        . 'joining/leaving, etc). If the log looks completely normal, say so briefly.',
                ],
                [
                    'role' => 'user',
                    'content' => "Summarize this console log:\n\n{$content}",
                ],
            ], ['max_tokens' => 400]);
        } catch (\Throwable $exception) {
            return response()->json([
                'success' => false,
                'error' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'summary' => $summary,
        ]);
    }
}
