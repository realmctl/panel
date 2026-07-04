<?php

namespace Realm\Services\Geolocation;

use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class IpGeolocationService
{
    /**
     * @return array{country_code: string, country: string, city: string|null, region: string|null}|null
     */
    public function lookup(string $ip): ?array
    {
        $ip = trim($ip);

        if (!$this->isPublicIp($ip)) {
            return null;
        }

        $cacheKey = sprintf('geolocation:ip:%s', $ip);
        $cacheTtl = (int) config('geolocation.cache_ttl', 604800);

        if (Cache::has($cacheKey)) {
            /** @var array{country_code: string, country: string, city: string|null, region: string|null}|null $cached */
            $cached = Cache::get($cacheKey);

            return $cached;
        }

        $result = $this->fetch($ip);

        if ($result !== null) {
            Cache::put($cacheKey, $result, Carbon::now()->addSeconds($cacheTtl));
        }

        return $result;
    }

    /**
     * @return array{country_code: string, country: string, city: string|null, region: string|null}|null
     */
    private function fetch(string $ip): ?array
    {
        $baseUrl = rtrim((string) config('geolocation.ip_api.base_url'), '/');
        $timeout = (int) config('geolocation.ip_api.timeout', 5);

        try {
            $response = Http::timeout($timeout)->get("{$baseUrl}/{$ip}", [
                'fields' => config('geolocation.ip_api.fields'),
            ]);
        } catch (\Throwable) {
            return null;
        }

        if (!$response->successful()) {
            return null;
        }

        $data = $response->json();

        if (!is_array($data) || ($data['status'] ?? null) !== 'success') {
            return null;
        }

        $countryCode = strtoupper((string) ($data['countryCode'] ?? ''));

        if (strlen($countryCode) !== 2 || !ctype_alpha($countryCode)) {
            return null;
        }

        return [
            'country_code' => $countryCode,
            'country' => (string) ($data['country'] ?? ''),
            'city' => !empty($data['city']) ? (string) $data['city'] : null,
            'region' => !empty($data['regionName']) ? (string) $data['regionName'] : null,
        ];
    }

    private function isPublicIp(string $ip): bool
    {
        return (bool) filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE);
    }

    /**
     * Used as a last-resort fallback when neither the node's own IP nor the requesting
     * client's IP are public (e.g. local development behind NAT/Docker), by asking an
     * external service what IP this box is actually reaching the internet as.
     *
     * @return array{country_code: string, country: string, city: string|null, region: string|null}|null
     */
    public function lookupOutboundPublicIp(): ?array
    {
        $cacheKey = 'geolocation:outbound-ip';
        $cacheTtl = (int) config('geolocation.cache_ttl', 604800);

        if (Cache::has($cacheKey)) {
            /** @var array{country_code: string, country: string, city: string|null, region: string|null}|null $cached */
            $cached = Cache::get($cacheKey);

            return $cached;
        }

        try {
            $response = Http::timeout(5)->get('https://api.ipify.org', ['format' => 'json']);
        } catch (\Throwable) {
            return null;
        }

        if (!$response->successful() || !filled($ip = $response->json('ip'))) {
            return null;
        }

        $result = $this->fetch($ip);

        Cache::put($cacheKey, $result, Carbon::now()->addSeconds($cacheTtl));

        return $result;
    }
}
