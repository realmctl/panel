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
}
