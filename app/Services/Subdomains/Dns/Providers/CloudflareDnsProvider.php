<?php

namespace Realm\Services\Subdomains\Dns\Providers;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Realm\Exceptions\DisplayException;
use Realm\Models\Server;
use Realm\Models\Subdomain\Domain;
use Realm\Models\Subdomain\Subdomain;
use Realm\Services\Subdomains\Dns\DnsProviderInterface;
use Realm\Services\Subdomains\Dns\DnsRecordData;

class CloudflareDnsProvider implements DnsProviderInterface
{
    public function create(Domain $domain, DnsRecordData $data): string
    {
        $zoneId = $domain->cloudflare_id;
        $payload = match (strtoupper($data->recordType)) {
            'SRV' => [
                'type' => 'SRV',
                'name' => $this->srvRecordName($data),
                'data' => [
                    'service' => $data->service,
                    'proto' => '_' . $data->protocol,
                    'name' => $data->name,
                    'priority' => (int) $data->priority,
                    'weight' => (int) $data->weight,
                    'port' => $data->port,
                    'target' => $data->target,
                ],
                'ttl' => (int) ($data->ttl ?? 3600),
            ],
            'CNAME' => [
                'type' => 'CNAME',
                'name' => $data->name,
                'content' => $data->target,
                'ttl' => (int) ($data->ttl ?? 3600),
            ],
            default => throw new DisplayException('Unsupported record type for Cloudflare.'),
        };

        $response = $this->client($domain)
            ->post("https://api.cloudflare.com/client/v4/zones/{$zoneId}/dns_records", $payload);

        if (!$response->successful() || !($response->json('success') ?? false)) {
            throw new DisplayException($response->json('errors.0.message') ?? 'Failed to create Cloudflare DNS record.');
        }

        return (string) $response->json('result.id');
    }

    public function delete(Domain $domain, Subdomain $subdomain, Server $server): void
    {
        $zoneId = $domain->cloudflare_id;
        $recordId = $subdomain->api_id;

        if ($recordId) {
            $response = $this->client($domain)
                ->delete("https://api.cloudflare.com/client/v4/zones/{$zoneId}/dns_records/{$recordId}");

            if ($response->successful() || $response->status() === 404) {
                return;
            }

            $message = $response->json('errors.0.message') ?? '';
            if (!$this->shouldRetryDeleteByLookup($message)) {
                throw new DisplayException($message ?: 'Failed to delete Cloudflare DNS record.');
            }
        }

        $recordId = $this->findRecordId($domain, $subdomain);
        if (!$recordId) {
            return;
        }

        $response = $this->client($domain)
            ->delete("https://api.cloudflare.com/client/v4/zones/{$zoneId}/dns_records/{$recordId}");

        if (!$response->successful() && $response->status() !== 404) {
            throw new DisplayException($response->json('errors.0.message') ?? 'Failed to delete Cloudflare DNS record.');
        }
    }

    private function client(Domain $domain): PendingRequest
    {
        $key = decrypt($domain->key);
        $secret = $domain->secret ? decrypt($domain->secret) : null;

        if ($secret && filter_var($key, FILTER_VALIDATE_EMAIL)) {
            return Http::withHeaders([
                'X-Auth-Email' => $key,
                'X-Auth-Key' => $secret,
                'Content-Type' => 'application/json',
            ]);
        }

        return Http::withToken($key)->withHeaders([
            'Content-Type' => 'application/json',
        ]);
    }

    private function srvRecordName(DnsRecordData $data): string
    {
        return sprintf('%s._%s.%s', $data->service, $data->protocol, $data->name);
    }

    private function shouldRetryDeleteByLookup(string $message): bool
    {
        return str_contains(strtolower($message), 'not allowed')
            || str_contains(strtolower($message), 'not found');
    }

    private function findRecordId(Domain $domain, Subdomain $subdomain): ?string
    {
        $zoneId = $domain->cloudflare_id;
        $subdomain->loadMissing('record');

        $type = strtoupper($subdomain->type);
        $relativeName = match ($type) {
            'SRV' => sprintf(
                '%s._%s.%s',
                $subdomain->record->service,
                $subdomain->record->protocol,
                $subdomain->name
            ),
            default => $subdomain->name,
        };

        $names = [
            "{$relativeName}.{$domain->name}",
            $relativeName,
        ];

        foreach ($names as $name) {
            $response = $this->client($domain)->get(
                "https://api.cloudflare.com/client/v4/zones/{$zoneId}/dns_records",
                ['type' => $type, 'name' => $name]
            );

            if (!$response->successful() || !($response->json('success') ?? false)) {
                continue;
            }

            $recordId = $response->json('result.0.id');
            if ($recordId) {
                return (string) $recordId;
            }
        }

        return null;
    }
}
