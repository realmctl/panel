<?php

namespace Pterodactyl\Services\Setup;

use Illuminate\Http\Request;
use Pterodactyl\Exceptions\PterodactylException;
use Pterodactyl\Traits\Commands\EnvironmentWriterTrait;

class SetupEnvironmentService
{
    use EnvironmentWriterTrait;

    public const KEY_ENVIRONMENT_DONE = 'pterodactyl:setup:environment_done';

    /**
     * @param array{author: string, url: string, timezone: string, cache?: string, session?: string, queue?: string, redisHost?: string, redisPort?: string, redisPassword?: string|null} $data
     *
     * @throws PterodactylException
     */
    public function configure(array $data): void
    {
        $variables = [];

        if (empty(config('hashids.salt'))) {
            $variables['HASHIDS_SALT'] = str_random(20);
        }

        $variables['APP_SERVICE_AUTHOR'] = $data['author'];
        $variables['APP_URL'] = rtrim($data['url'], '/');
        $variables['APP_TIMEZONE'] = $data['timezone'];
        $variables['CACHE_DRIVER'] = $data['cache'] ?? 'redis';
        $variables['SESSION_DRIVER'] = $data['session'] ?? 'redis';
        $variables['QUEUE_CONNECTION'] = $data['queue'] ?? 'redis';
        $variables['APP_ENVIRONMENT_ONLY'] = 'false';
        $variables['PTERODACTYL_TELEMETRY_ENABLED'] = 'false';

        if (str_starts_with($variables['APP_URL'], 'https://')) {
            $variables['SESSION_SECURE_COOKIE'] = 'true';
        }

        if ($this->usesRedis($variables)) {
            $variables['REDIS_HOST'] = $data['redisHost'] ?? config('database.redis.default.host', '127.0.0.1');
            $variables['REDIS_PORT'] = (string) ($data['redisPort'] ?? config('database.redis.default.port', 6379));
            $password = $data['redisPassword'] ?? config('database.redis.default.password');
            $variables['REDIS_PASSWORD'] = empty($password) ? 'null' : $password;
        }

        $this->writeToEnvironment($variables);
    }

    public function isConfigured(): bool
    {
        $url = config('app.url', '');
        $author = config('pterodactyl.service.author', '');
        $salt = config('hashids.salt', '');

        $hasCustomUrl = !empty($url)
            && !in_array($url, ['http://panel.example.com', 'https://panel.example.com', 'https://example.com'], true);

        $hasCustomAuthor = !empty($author) && $author !== 'unknown@unknown.com';

        return !empty($salt) && $hasCustomUrl && $hasCustomAuthor;
    }

    /**
     * @return array<string, mixed>
     */
    public function getDefaults(Request $request): array
    {
        $requestUrl = $request->getSchemeAndHttpHost();

        return [
            'author' => config('pterodactyl.service.author', ''),
            'url' => $this->isConfigured() ? config('app.url') : $requestUrl,
            'timezone' => config('app.timezone', 'UTC'),
            'cache' => config('cache.default', 'redis'),
            'session' => config('session.driver', 'redis'),
            'queue' => config('queue.default', 'redis'),
            'redisHost' => config('database.redis.default.host', '127.0.0.1'),
            'redisPort' => config('database.redis.default.port', 6379),
            'configured' => $this->isConfigured(),
        ];
    }

    /**
     * @param array<string, string> $variables
     */
    private function usesRedis(array $variables): bool
    {
        return collect($variables)->contains(fn (string $value) => $value === 'redis');
    }
}
