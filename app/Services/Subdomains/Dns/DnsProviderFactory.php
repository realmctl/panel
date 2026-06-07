<?php

namespace Realm\Services\Subdomains\Dns;

use Realm\Exceptions\DisplayException;
use Realm\Services\Subdomains\Dns\Providers\CloudflareDnsProvider;
use Realm\Services\Subdomains\Dns\Providers\GoDaddyDnsProvider;
use Realm\Services\Subdomains\Dns\Providers\NamecheapDnsProvider;
use Realm\Services\Subdomains\Dns\Providers\NameComDnsProvider;
use Realm\Services\Subdomains\Dns\Providers\OvhDnsProvider;

class DnsProviderFactory
{
    public function make(string $type): DnsProviderInterface
    {
        return match ($type) {
            'cloudflare' => app(CloudflareDnsProvider::class),
            'daddy' => app(GoDaddyDnsProvider::class),
            'ovh' => app(OvhDnsProvider::class),
            'namecheap' => app(NamecheapDnsProvider::class),
            'name' => app(NameComDnsProvider::class),
            default => throw new DisplayException('Unsupported DNS provider.'),
        };
    }
}
