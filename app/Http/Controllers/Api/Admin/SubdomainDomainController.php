<?php

namespace Realm\Http\Controllers\Api\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Http;
use Realm\Http\Controllers\Controller;
use Realm\Models\Subdomain\Domain;
use Realm\Services\Subdomains\Dns\DnsProviderRegistry;

class SubdomainDomainController extends Controller
{
    public function index(): JsonResponse
    {
        $domains = Domain::query()->orderBy('name')->get()->map(fn (Domain $domain) => [
            'id' => $domain->id,
            'name' => $domain->name,
            'type' => $domain->type,
            'display_type' => $domain->display_type,
        ]);

        return response()->json(['domains' => $domains]);
    }

    public function create(): JsonResponse
    {
        return response()->json(['providers' => DnsProviderRegistry::all()]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:' . implode(',', array_keys(DnsProviderRegistry::all())),
            'key' => 'required|string',
        ]);

        $domain = new Domain();
        $domain->fill([
            'name' => $request->input('name'),
            'type' => $request->input('type'),
            'display_type' => DnsProviderRegistry::title($request->input('type')),
            'key' => encrypt($request->input('key')),
            'secret' => $request->filled('secret') ? encrypt($request->input('secret')) : null,
            'consumer' => $request->filled('consumer') ? encrypt($request->input('consumer')) : null,
            'cloudflare_id' => $request->input('cloudflare_id'),
            'ovh_api' => $request->input('ovh_api'),
        ]);
        $domain->save();

        return response()->json([
            'success' => true,
            'message' => 'Domain added successfully.',
            'domain' => [
                'id' => $domain->id,
                'name' => $domain->name,
                'type' => $domain->type,
                'display_type' => $domain->display_type,
            ],
        ], 201);
    }

    public function cloudflareZones(Request $request): JsonResponse
    {
        $request->validate([
            'api_token' => 'required|string',
        ]);

        $response = Http::withToken($request->input('api_token'))
            ->timeout(10)
            ->get('https://api.cloudflare.com/client/v4/zones', ['per_page' => 50]);

        if (!$response->successful() || !$response->json('success')) {
            return response()->json([
                'message' => 'Cloudflare rejected this token. Make sure it has "Zone / DNS / Edit" permissions.',
            ], 422);
        }

        $zones = collect($response->json('result', []))
            ->map(fn (array $zone) => ['id' => $zone['id'], 'name' => $zone['name']])
            ->values();

        if ($zones->isEmpty()) {
            return response()->json([
                'message' => 'This token is valid but has no zones assigned to it.',
            ], 422);
        }

        return response()->json(['zones' => $zones]);
    }

    public function show(Domain $domain): JsonResponse
    {
        return response()->json([
            'domain' => [
                'id' => $domain->id,
                'name' => $domain->name,
                'type' => $domain->type,
                'display_type' => $domain->display_type,
                'cloudflare_id' => $domain->cloudflare_id,
                'ovh_api' => $domain->ovh_api,
            ],
            'providers' => DnsProviderRegistry::all(),
        ]);
    }

    public function update(Domain $domain, Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:' . implode(',', array_keys(DnsProviderRegistry::all())),
            'key' => 'required|string',
        ]);

        $domain->fill([
            'name' => $request->input('name'),
            'type' => $request->input('type'),
            'display_type' => DnsProviderRegistry::title($request->input('type')),
            'key' => encrypt($request->input('key')),
            'secret' => $request->filled('secret') ? encrypt($request->input('secret')) : null,
            'consumer' => $request->filled('consumer') ? encrypt($request->input('consumer')) : null,
            'cloudflare_id' => $request->input('cloudflare_id'),
            'ovh_api' => $request->input('ovh_api'),
        ]);
        $domain->save();

        return response()->json([
            'success' => true,
            'message' => 'Domain updated successfully.',
            'domain' => [
                'id' => $domain->id,
                'name' => $domain->name,
                'type' => $domain->type,
                'display_type' => $domain->display_type,
            ],
        ]);
    }

    public function destroy(Domain $domain): Response
    {
        $domain->load('records');
        $domain->subdomains()->delete();
        foreach ($domain->records as $record) {
            $record->eggRecords()->delete();
            $record->delete();
        }
        $domain->delete();

        return response('', 204);
    }
}
