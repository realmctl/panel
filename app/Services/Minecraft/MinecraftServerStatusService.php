<?php

namespace Realm\Services\Minecraft;

use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Realm\Exceptions\DisplayException;
use Realm\Models\Allocation;
use Realm\Models\Server;

class MinecraftServerStatusService
{
    public function __construct(private MinecraftAvatarService $avatarService)
    {
    }

    /**
     * Query live Minecraft server status for the given server allocation.
     *
     * @return array<string, mixed>
     */
    public function getStatus(Server $server, ?Allocation $allocation = null): array
    {
        $allocation ??= $server->allocation;

        if (!$allocation) {
            throw new DisplayException('This server does not have a primary allocation configured.');
        }

        $cacheKey = sprintf('minecraft:status:%s:%d', $server->uuid, $allocation->id);
        $cacheTtl = (int) config('minecraft.status.cache_ttl', 30);

        return Cache::remember($cacheKey, Carbon::now()->addSeconds($cacheTtl), function () use ($allocation) {
            return $this->fetchStatus($allocation);
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function fetchStatus(Allocation $allocation): array
    {
        $address = $this->buildQueryAddress($allocation);
        $url = sprintf(
            '%s/%d/%s',
            rtrim((string) config('minecraft.status.base_url'), '/'),
            (int) config('minecraft.status.api_version', 3),
            $address
        );

        try {
            $response = Http::withHeaders([
                'User-Agent' => (string) config('minecraft.status.user_agent'),
                'Accept' => 'application/json',
            ])
                ->timeout((int) config('minecraft.status.timeout', 8))
                ->get($url);
        } catch (\Throwable $exception) {
            throw new DisplayException('Unable to reach the Minecraft status service. Please try again shortly.');
        }

        if ($response->status() === 403) {
            throw new DisplayException('The Minecraft status service rejected the request.');
        }

        if (!$response->successful()) {
            throw new DisplayException('The Minecraft status service returned an unexpected response.');
        }

        $payload = $response->json();

        if (!is_array($payload)) {
            throw new DisplayException('The Minecraft status service returned invalid data.');
        }

        return $this->normalizePayload($payload, $address);
    }

    private function buildQueryAddress(Allocation $allocation): string
    {
        $host = $allocation->alias;
        $port = $allocation->port;

        if (str_contains($host, ':')) {
            return rawurlencode($host);
        }

        return rawurlencode(sprintf('%s:%d', $host, $port));
    }

    /**
     * @param array<string, mixed> $payload
     *
     * @return array<string, mixed>
     */
    private function normalizePayload(array $payload, string $address): array
    {
        $players = $payload['players'] ?? [];
        $playerList = [];

        if (!empty($players['list']) && is_array($players['list'])) {
            foreach ($players['list'] as $player) {
                if (!is_array($player)) {
                    continue;
                }

                $name = trim((string) ($player['name'] ?? ''));
                if ($name === '') {
                    continue;
                }

                $uuid = $this->normalizeUuid($player['uuid'] ?? null);

                $playerList[] = [
                    'name' => $name,
                    'uuid' => $uuid,
                    'avatar' => $this->avatarService->urlsForPlayer($name, $uuid),
                    'ping' => isset($player['ping']) ? (int) $player['ping'] : null,
                    'joined_at' => isset($player['joined_at']) ? (string) $player['joined_at'] : null,
                ];
            }
        }

        $motd = $payload['motd'] ?? null;
        $debug = $payload['debug'] ?? [];

        return [
            'online' => (bool) ($payload['online'] ?? false),
            'address' => $address,
            'hostname' => $payload['hostname'] ?? null,
            'ip' => $payload['ip'] ?? null,
            'port' => isset($payload['port']) ? (int) $payload['port'] : null,
            'version' => $payload['version'] ?? null,
            'protocol' => $payload['protocol'] ?? null,
            'software' => $payload['software'] ?? null,
            'motd' => is_array($motd) ? [
                'raw' => $motd['raw'] ?? [],
                'clean' => $motd['clean'] ?? [],
                'html' => $motd['html'] ?? [],
            ] : null,
            'icon' => $payload['icon'] ?? null,
            'players' => [
                'online' => (int) ($players['online'] ?? 0),
                'max' => (int) ($players['max'] ?? 0),
                'list' => $playerList,
            ],
            'plugins' => $payload['plugins'] ?? null,
            'mods' => $payload['mods'] ?? null,
            'debug' => [
                'ping' => (bool) ($debug['ping'] ?? false),
                'query' => (bool) ($debug['query'] ?? false),
                'cache_hit' => (bool) ($debug['cachehit'] ?? false),
                'cache_expires_at' => isset($debug['cacheexpire'])
                    ? Carbon::createFromTimestamp((int) $debug['cacheexpire'])->toAtomString()
                    : null,
            ],
            'queried_at' => Carbon::now()->toAtomString(),
        ];
    }

    private function normalizeUuid(mixed $uuid): ?string
    {
        if (!is_string($uuid) || trim($uuid) === '') {
            return null;
        }

        $normalized = strtolower(trim($uuid));

        if (preg_match('/^[a-f0-9]{32}$/', $normalized)) {
            return sprintf(
                '%s-%s-%s-%s-%s',
                substr($normalized, 0, 8),
                substr($normalized, 8, 4),
                substr($normalized, 12, 4),
                substr($normalized, 16, 4),
                substr($normalized, 20, 12)
            );
        }

        return $normalized;
    }
}
