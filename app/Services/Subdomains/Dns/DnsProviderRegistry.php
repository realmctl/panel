<?php

namespace Realm\Services\Subdomains\Dns;

class DnsProviderRegistry
{
    /**
     * @return array<string, array{title: string, secret: bool, consumer: bool, cloudflare_id: bool, ovh_api: bool}>
     */
    public static function all(): array
    {
        return [
            'cloudflare' => [
                'title' => 'Cloudflare',
                'secret' => false,
                'consumer' => false,
                'cloudflare_id' => true,
                'ovh_api' => false,
            ],
            'daddy' => [
                'title' => 'GoDaddy',
                'secret' => true,
                'consumer' => false,
                'cloudflare_id' => false,
                'ovh_api' => false,
            ],
            'ovh' => [
                'title' => 'OVH',
                'secret' => true,
                'consumer' => true,
                'cloudflare_id' => false,
                'ovh_api' => true,
            ],
            'namecheap' => [
                'title' => 'Namecheap',
                'secret' => false,
                'consumer' => false,
                'cloudflare_id' => false,
                'ovh_api' => false,
            ],
            'name' => [
                'title' => 'Name.com',
                'secret' => true,
                'consumer' => false,
                'cloudflare_id' => false,
                'ovh_api' => false,
            ],
        ];
    }

    public static function title(string $type): string
    {
        return self::all()[$type]['title'] ?? ucfirst($type);
    }
}
