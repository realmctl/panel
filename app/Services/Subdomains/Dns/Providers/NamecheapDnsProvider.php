<?php

namespace Pterodactyl\Services\Subdomains\Dns\Providers;

use Illuminate\Support\Facades\Http;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Subdomain\Domain;
use Pterodactyl\Models\Subdomain\Subdomain;
use Pterodactyl\Services\Subdomains\Dns\DnsProviderInterface;
use Pterodactyl\Services\Subdomains\Dns\DnsRecordData;
use SimpleXMLElement;

class NamecheapDnsProvider implements DnsProviderInterface
{
    public function create(Domain $domain, DnsRecordData $data): string
    {
        $recordType = strtoupper($data->recordType);
        [$sld, $tld] = $this->splitDomain($domain->name);

        $host = match ($recordType) {
            'SRV' => sprintf('%s._%s.%s', $data->service, $data->protocol, $data->name),
            'CNAME' => $data->name,
            default => throw new DisplayException('Unsupported record type for Namecheap.'),
        };

        $address = match ($recordType) {
            'SRV' => sprintf('%d %s %s', $data->port, $data->priority, $data->target),
            'CNAME' => $data->target,
            default => throw new DisplayException('Unsupported record type for Namecheap.'),
        };

        $hosts = $this->getExistingHosts($domain, $sld, $tld);
        $index = count($hosts) + 1;

        $params = [
            'Command' => 'namecheap.domains.dns.setHosts',
            'SLD' => $sld,
            'TLD' => $tld,
        ];

        foreach ($hosts as $i => $hostRecord) {
            $n = $i + 1;
            $params["HostName{$n}"] = $hostRecord['name'];
            $params["RecordType{$n}"] = $hostRecord['type'];
            $params["Address{$n}"] = $hostRecord['address'];
            $params["TTL{$n}"] = $hostRecord['ttl'];
            if (!empty($hostRecord['mxpref'])) {
                $params["MXPref{$n}"] = $hostRecord['mxpref'];
            }
        }

        $params["HostName{$index}"] = $host;
        $params["RecordType{$index}"] = $recordType;
        $params["Address{$index}"] = $address;
        $params["TTL{$index}"] = $data->ttl ?? 3600;
        if ($recordType === 'SRV') {
            $params["MXPref{$index}"] = $data->weight;
        }

        $this->apiRequest($domain, $params);

        return $host;
    }

    public function delete(Domain $domain, Subdomain $subdomain, Server $server): void
    {
        [$sld, $tld] = $this->splitDomain($domain->name);
        $recordType = strtoupper($subdomain->record->type);
        $host = $subdomain->api_id;

        if ($recordType === 'SRV') {
            $host = sprintf(
                '%s._%s.%s',
                $subdomain->record->service,
                $subdomain->record->protocol,
                $subdomain->name
            );
        }

        $hosts = $this->getExistingHosts($domain, $sld, $tld);
        $hosts = array_values(array_filter($hosts, fn ($record) => !($record['name'] === $host && $record['type'] === $recordType)));

        $params = [
            'Command' => 'namecheap.domains.dns.setHosts',
            'SLD' => $sld,
            'TLD' => $tld,
        ];

        foreach ($hosts as $i => $hostRecord) {
            $n = $i + 1;
            $params["HostName{$n}"] = $hostRecord['name'];
            $params["RecordType{$n}"] = $hostRecord['type'];
            $params["Address{$n}"] = $hostRecord['address'];
            $params["TTL{$n}"] = $hostRecord['ttl'];
            if (!empty($hostRecord['mxpref'])) {
                $params["MXPref{$n}"] = $hostRecord['mxpref'];
            }
        }

        $this->apiRequest($domain, $params);
    }

    /**
     * @return array<int, array{name: string, type: string, address: string, ttl: string, mxpref?: string}>
     */
    private function getExistingHosts(Domain $domain, string $sld, string $tld): array
    {
        $xml = $this->apiRequest($domain, [
            'Command' => 'namecheap.domains.dns.getHosts',
            'SLD' => $sld,
            'TLD' => $tld,
        ]);

        $hosts = [];
        foreach ($xml->CommandResponse->DomainDNSGetHostsResult->host ?? [] as $host) {
            $hosts[] = [
                'name' => (string) $host['Name'],
                'type' => (string) $host['Type'],
                'address' => (string) $host['Address'],
                'ttl' => (string) $host['TTL'],
                'mxpref' => (string) ($host['MXPref'] ?? ''),
            ];
        }

        return $hosts;
    }

    private function apiRequest(Domain $domain, array $params): SimpleXMLElement
    {
        $apiUser = decrypt($domain->key);
        $apiKey = $domain->secret ? decrypt($domain->secret) : $apiUser;

        $query = array_merge([
            'ApiUser' => $apiUser,
            'ApiKey' => $apiKey,
            'UserName' => $apiUser,
            'ClientIp' => request()->ip() ?? '127.0.0.1',
        ], $params);

        $response = Http::get('https://api.namecheap.com/xml.response', $query);
        $xml = new SimpleXMLElement($response->body());

        if ((string) $xml['Status'] !== 'OK') {
            $error = (string) ($xml->Errors->Error ?? 'Namecheap API request failed.');
            throw new DisplayException($error);
        }

        return $xml;
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function splitDomain(string $domain): array
    {
        $parts = explode('.', $domain, 2);

        if (count($parts) !== 2) {
            throw new DisplayException('Namecheap domains must be in SLD.TLD format.');
        }

        return [$parts[0], $parts[1]];
    }
}
