<?php

namespace Pterodactyl\Services\Files;

use Carbon\CarbonImmutable;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\User;
use Illuminate\Contracts\Cache\Repository as CacheRepository;

class FileEditingPresenceService
{
    private const TTL_SECONDS = 30;

    public function __construct(private CacheRepository $cache)
    {
    }

    private function cacheKey(Server $server): string
    {
        return "server:{$server->uuid}:file-editing-presence";
    }

    /**
     * @return array<string, array{uuid: string, username: string, email: string, file: string, line: int, updated_at: int}>
     */
    private function read(Server $server): array
    {
        /** @var array<string, array{uuid: string, username: string, email: string, file: string, line: int, updated_at: int}> $entries */
        $entries = $this->cache->get($this->cacheKey($server), []);

        return $this->prune($entries);
    }

    /**
     * @param array<string, array{uuid: string, username: string, email: string, file: string, line: int, updated_at: int}> $entries
     * @return array<string, array{uuid: string, username: string, email: string, file: string, line: int, updated_at: int}>
     */
    private function prune(array $entries): array
    {
        $cutoff = CarbonImmutable::now()->subSeconds(self::TTL_SECONDS)->getTimestamp();

        return array_filter(
            $entries,
            static fn (array $entry) => ($entry['updated_at'] ?? 0) >= $cutoff
        );
    }

    public function upsert(Server $server, User $user, string $file, int $line): void
    {
        $entries = $this->read($server);

        $entries[$user->uuid] = [
            'uuid' => $user->uuid,
            'username' => $user->username,
            'email' => $user->email,
            'file' => $file,
            'line' => max(1, $line),
            'updated_at' => CarbonImmutable::now()->getTimestamp(),
        ];

        $this->cache->put($this->cacheKey($server), $entries, self::TTL_SECONDS * 2);
    }

    public function clear(Server $server, User $user): void
    {
        $entries = $this->read($server);
        unset($entries[$user->uuid]);

        if (empty($entries)) {
            $this->cache->forget($this->cacheKey($server));

            return;
        }

        $this->cache->put($this->cacheKey($server), $entries, self::TTL_SECONDS * 2);
    }

    /**
     * @return list<array{uuid: string, username: string, email: string, file: string, line: int, updated_at: int}>
     */
    public function list(Server $server): array
    {
        $entries = $this->prune($this->cache->get($this->cacheKey($server), []));

        if ($entries !== $this->cache->get($this->cacheKey($server), [])) {
            if (empty($entries)) {
                $this->cache->forget($this->cacheKey($server));
            } else {
                $this->cache->put($this->cacheKey($server), $entries, self::TTL_SECONDS * 2);
            }
        }

        return array_values($entries);
    }
}
