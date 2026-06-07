<?php

namespace Realm\Services\Subdomains\Dns;

use Realm\Models\Server;
use Realm\Models\Subdomain\Domain;
use Realm\Models\Subdomain\Subdomain;

interface DnsProviderInterface
{
    /**
     * Create a DNS record and return the provider-specific record identifier.
     */
    public function create(Domain $domain, DnsRecordData $data): string;

    /**
     * Delete a DNS record from the provider.
     */
    public function delete(Domain $domain, Subdomain $subdomain, Server $server): void;
}
