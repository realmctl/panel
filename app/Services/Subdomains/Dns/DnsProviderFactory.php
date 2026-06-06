<?php

namespace Pterodactyl\Services\Subdomains\Dns;

use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Services\Subdomains\Dns\Providers\CloudflareDnsProvider;
use Pterodactyl\Services\Subdomains\Dns\Providers\GoDaddyDnsProvider;
use Pterodactyl\Services\Subdomains\Dns\Providers\NamecheapDnsProvider;
use Pterodactyl\Services\Subdomains\Dns\Providers\NameComDnsProvider;
use Pterodactyl\Services\Subdomains\Dns\Providers\OvhDnsProvider;

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
