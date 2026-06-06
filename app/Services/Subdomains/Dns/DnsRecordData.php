<?php

namespace Pterodactyl\Services\Subdomains\Dns;

readonly class DnsRecordData
{
    public function __construct(
        public string $recordType,
        public string $name,
        public string $target,
        public int $port,
        public ?string $ttl = null,
        public ?string $protocol = null,
        public ?string $priority = null,
        public ?string $weight = null,
        public ?string $service = null,
    ) {
    }
}
