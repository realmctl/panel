<?php

namespace Realm\Services\Subdomains\Dns\Providers;

use Illuminate\Support\Facades\Http;
use Realm\Exceptions\DisplayException;
use Realm\Models\Server;
use Realm\Models\Subdomain\Domain;
use Realm\Models\Subdomain\Subdomain;
use Realm\Services\Subdomains\Dns\DnsProviderInterface;
use Realm\Services\Subdomains\Dns\DnsRecordData;

class GoDaddyDnsProvider implements DnsProviderInterface
{
    public function create(Domain $domain, DnsRecordData $data): string
    {
        $key = decrypt($domain->key);
        $secret = decrypt($domain->secret);
        $recordType = strtoupper($data->recordType);

        $recordName = match ($recordType) {
            'SRV' => sprintf('%s._%s.%s', $data->service, $data->protocol, $data->name),
            'CNAME' => $data->name,
            default => throw new DisplayException('Unsupported record type for GoDaddy.'),
        };

        $body = match ($recordType) {
            'SRV' => [[
                'data' => $data->target,
                'port' => $data->port,
                'priority' => (int) $data->priority,
                'weight' => (int) $data->weight,
                'protocol' => '_' . $data->protocol,
                'service' => $data->service,
            ]],
            'CNAME' => [[
                'data' => $data->target,
                'ttl' => (int) ($data->ttl ?? 3600),
            ]],
            default => throw new DisplayException('Unsupported record type for GoDaddy.'),
        };

        $response = Http::withHeaders([
            'Authorization' => "sso-key {$key}:{$secret}",
            'Content-Type' => 'application/json',
        ])->put("https://api.godaddy.com/v1/domains/{$domain->name}/records/{$recordType}/{$recordName}", $body);

        if (!$response->successful()) {
            throw new DisplayException($response->json('message') ?? 'Failed to create GoDaddy DNS record.');
        }

        return $recordName;
    }

    public function delete(Domain $domain, Subdomain $subdomain, Server $server): void
    {
        $key = decrypt($domain->key);
        $secret = decrypt($domain->secret);
        $recordType = strtoupper($subdomain->record->type);
        $recordName = $subdomain->api_id ?? $subdomain->name;

        if ($recordType === 'SRV') {
            $recordName = sprintf(
                '%s._%s.%s',
                $subdomain->record->service,
                $subdomain->record->protocol,
                $subdomain->name
            );
        }

        $response = Http::withHeaders([
            'Authorization' => "sso-key {$key}:{$secret}",
        ])->delete("https://api.godaddy.com/v1/domains/{$domain->name}/records/{$recordType}/{$recordName}");

        if (!$response->successful() && $response->status() !== 404) {
            throw new DisplayException($response->json('message') ?? 'Failed to delete GoDaddy DNS record.');
        }
    }
}
