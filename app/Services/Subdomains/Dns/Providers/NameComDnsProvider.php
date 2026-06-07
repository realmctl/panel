<?php

namespace Realm\Services\Subdomains\Dns\Providers;

use Illuminate\Support\Facades\Http;
use Realm\Exceptions\DisplayException;
use Realm\Models\Server;
use Realm\Models\Subdomain\Domain;
use Realm\Models\Subdomain\Subdomain;
use Realm\Services\Subdomains\Dns\DnsProviderInterface;
use Realm\Services\Subdomains\Dns\DnsRecordData;

class NameComDnsProvider implements DnsProviderInterface
{
    public function create(Domain $domain, DnsRecordData $data): string
    {
        $username = decrypt($domain->key);
        $token = decrypt($domain->secret);
        $recordType = strtoupper($data->recordType);

        $host = match ($recordType) {
            'SRV' => sprintf('%s._%s.%s', $data->service, $data->protocol, $data->name),
            'CNAME' => $data->name,
            default => throw new DisplayException('Unsupported record type for Name.com.'),
        };

        $payload = match ($recordType) {
            'SRV' => [
                'host' => $host,
                'type' => 'SRV',
                'answer' => [
                    'priority' => (int) $data->priority,
                    'weight' => (int) $data->weight,
                    'port' => $data->port,
                    'value' => $data->target,
                ],
                'ttl' => (int) ($data->ttl ?? 3600),
            ],
            'CNAME' => [
                'host' => $host,
                'type' => 'CNAME',
                'answer' => $data->target,
                'ttl' => (int) ($data->ttl ?? 3600),
            ],
            default => throw new DisplayException('Unsupported record type for Name.com.'),
        };

        $response = Http::withBasicAuth($username, $token)
            ->post("https://api.name.com/v4/domains/{$domain->name}/records", $payload);

        if (!$response->successful()) {
            throw new DisplayException($response->json('message') ?? 'Failed to create Name.com DNS record.');
        }

        return (string) $response->json('id');
    }

    public function delete(Domain $domain, Subdomain $subdomain, Server $server): void
    {
        $username = decrypt($domain->key);
        $token = decrypt($domain->secret);
        $recordId = $subdomain->api_id;

        if (!$recordId) {
            throw new DisplayException('Missing Name.com record identifier.');
        }

        $response = Http::withBasicAuth($username, $token)
            ->delete("https://api.name.com/v4/domains/{$domain->name}/records/{$recordId}");

        if (!$response->successful() && $response->status() !== 404) {
            throw new DisplayException($response->json('message') ?? 'Failed to delete Name.com DNS record.');
        }
    }
}
