<?php

namespace Realm\Http\Controllers\Api\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Realm\Http\Controllers\Controller;
use Realm\Models\AiProvider;
use Realm\Services\Ai\AiProviderFactory;
use Realm\Services\Ai\AiProviderRegistry;

/**
 * Only one AI provider is ever configured at a time — this is a singular settings
 * resource, not a list. Saving always upserts the single existing row.
 */
class AiProviderController extends Controller
{
    public function current(): JsonResponse
    {
        $provider = AiProvider::query()->first();

        return response()->json([
            'provider' => $provider ? [
                'id' => $provider->id,
                'name' => $provider->name,
                'type' => $provider->type,
                'display_type' => AiProviderRegistry::title($provider->type),
                'base_url' => $provider->base_url,
                'model' => $provider->model,
            ] : null,
            'providers' => AiProviderRegistry::all(),
        ]);
    }

    public function save(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'nullable|string|max:255',
            'type' => 'required|string|in:' . implode(',', array_keys(AiProviderRegistry::all())),
            'api_key' => 'nullable|string',
            'base_url' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
        ]);

        $provider = AiProvider::query()->first() ?? new AiProvider();

        if (!$provider->exists && !$request->filled('api_key')) {
            return response()->json([
                'success' => false,
                'error' => 'An API key is required.',
            ], 422);
        }

        $provider->fill([
            'name' => $request->input('name') ?: AiProviderRegistry::title($request->input('type')),
            'type' => $request->input('type'),
            'base_url' => $request->input('base_url'),
            'model' => $request->input('model'),
            'is_default' => true,
        ]);

        if ($request->filled('api_key')) {
            $provider->api_key = encrypt($request->input('api_key'));
        }

        $provider->save();

        return response()->json([
            'success' => true,
            'message' => 'AI provider saved successfully.',
        ]);
    }

    public function destroy(): Response
    {
        AiProvider::query()->delete();

        return response('', 204);
    }

    /**
     * Send a trivial prompt through the currently saved provider to confirm the API key works.
     */
    public function test(): JsonResponse
    {
        $provider = AiProvider::query()->first();

        if (!$provider) {
            return response()->json(['success' => false, 'error' => 'No AI provider is configured yet.'], 422);
        }

        try {
            $reply = AiProviderFactory::make($provider)->chat([
                ['role' => 'user', 'content' => 'Reply with exactly: OK'],
            ], ['max_tokens' => 16]);
        } catch (\Throwable $exception) {
            return response()->json([
                'success' => false,
                'error' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'reply' => $reply,
        ]);
    }
}
