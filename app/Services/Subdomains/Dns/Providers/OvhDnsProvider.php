<?php

namespace Pterodactyl\Services\Subdomains\Dns\Providers;

use Illuminate\Support\Facades\Http;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Subdomain\Domain;
use Pterodactyl\Models\Subdomain\Subdomain;
use Pterodactyl\Services\Subdomains\Dns\DnsProviderInterface;
use Pterodactyl\Services\Subdomains\Dns\DnsRecordData;

class OvhDnsProvider implements DnsProviderInterface
{
    private const ENDPOINTS = [
        'eu' => 'https://eu.api.ovh.com/1.0',
        'us' => 'https://api.us.ovhcloud.com/1.0',
        'ca' => 'https://ca.api.ovh.com/1.0',
    ];

    public function create(Domain $domain, DnsRecordData $data): string
    {
        $recordType = strtoupper($data->recordType);
        $zone = $domain->name;

        $subDomain = match ($recordType) {
            'SRV' => sprintf('%s._%s.%s', $data->service, $data->protocol, $data->name),
            'CNAME' => $data->name,
            default => throw new DisplayException('Unsupported record type for OVH.'),
        };

        $target = match ($recordType) {
            'SRV' => sprintf('%d %s %s', $data->port, $data->target, $data->target),
            'CNAME' => $data->target,
            default => throw new DisplayException('Unsupported record type for OVH.'),
        };

        $payload = [
            'fieldType' => $recordType,
            'subDomain' => $subDomain,
            'target' => $target,
            'ttl' => (int) ($data->ttl ?? 3600),
        ];

        if ($recordType === 'SRV') {
            $payload['priority'] = (int) $data->priority;
        }

        $response = $this->request($domain, 'POST', "/domain/zone/{$zone}/record", $payload);

        if (!$response->successful()) {
            throw new DisplayException($response->json('message') ?? 'Failed to create OVH DNS record.');
        }

        $this->request($domain, 'POST', "/domain/zone/{$zone}/refresh");

        return (string) $response->json('id');
    }

    public function delete(Domain $domain, Subdomain $subdomain, Server $server): void
    {
        $zone = $domain->name;
        $recordId = $subdomain->api_id;

        if (!$recordId) {
            throw new DisplayException('Missing OVH record identifier.');
        }

        $response = $this->request($domain, 'DELETE', "/domain/zone/{$zone}/record/{$recordId}");

        if (!$response->successful() && $response->status() !== 404) {
            throw new DisplayException($response->json('message') ?? 'Failed to delete OVH DNS record.');
        }

        $this->request($domain, 'POST', "/domain/zone/{$zone}/refresh");
    }

    private function request(Domain $domain, string $method, string $path, ?array $body = null)
    {
        $endpoint = self::ENDPOINTS[$domain->ovh_api ?? 'eu'] ?? self::ENDPOINTS['eu'];
        $appKey = decrypt($domain->key);
        $appSecret = decrypt($domain->secret);
        $consumerKey = decrypt($domain->consumer);

        $url = $endpoint . $path;
        $timestamp = $this->serverTime($endpoint);
        $jsonBody = $body ? json_encode($body) : '';
        $signature = '$1$' . sha1(implode('+', [
            $appSecret,
            $consumerKey,
            strtoupper($method),
            $url,
            $jsonBody,
            $timestamp,
        ]));

        return Http::withHeaders([
            'X-Ovh-Application' => $appKey,
            'X-Ovh-Consumer' => $consumerKey,
            'X-Ovh-Timestamp' => $timestamp,
            'X-Ovh-Signature' => $signature,
            'Content-Type' => 'application/json',
        ])->withBody($jsonBody, 'application/json')->send($method, $url);
    }

    private function serverTime(string $endpoint): string
    {
        $base = str_replace('/1.0', '', $endpoint);

        return (string) Http::get("{$base}/auth/time")->body();
    }
}
