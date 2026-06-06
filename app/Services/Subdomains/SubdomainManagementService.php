<?php

namespace Pterodactyl\Services\Subdomains;

use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Subdomain\Record;
use Pterodactyl\Models\Subdomain\Subdomain;
use Pterodactyl\Services\Subdomains\Dns\DnsProviderFactory;
use Pterodactyl\Services\Subdomains\Dns\DnsRecordData;

class SubdomainManagementService
{
    public function __construct(private DnsProviderFactory $providerFactory)
    {
    }

    public function create(Server $server, Record $record, string $name): Subdomain
    {
        $server->loadMissing(['node', 'allocation']);
        $domain = $record->domain;

        if ($server->subdomains()->where('name', $name)->where('domain_id', $domain->id)->exists()) {
            throw new DisplayException('This subdomain already exists for the selected domain.');
        }

        $data = new DnsRecordData(
            recordType: $record->type,
            name: $name,
            target: $server->node->fqdn,
            port: $server->allocation->port,
            ttl: $record->ttl,
            protocol: $record->protocol,
            priority: $record->priority,
            weight: $record->weight,
            service: $record->service,
        );

        $provider = $this->providerFactory->make($domain->type);
        $apiId = $provider->create($domain, $data);

        return $server->subdomains()->create([
            'domain_id' => $domain->id,
            'record_id' => $record->id,
            'server_id' => $server->id,
            'type' => $record->type,
            'name' => $name,
            'api_id' => $apiId,
        ]);
    }

    public function delete(Subdomain $subdomain, Server $server): void
    {
        $domain = $subdomain->domain;
        $provider = $this->providerFactory->make($domain->type);
        $provider->delete($domain, $subdomain, $server);
        $subdomain->delete();
    }

    public function deleteAll(Server $server): void
    {
        foreach ($server->subdomains()->with(['domain', 'record'])->get() as $subdomain) {
            try {
                $this->delete($subdomain, $server);
            } catch (DisplayException $exception) {
                Activity::event('server:subdomain.delete-failed')
                    ->subject($subdomain)
                    ->property('message', $exception->getMessage())
                    ->log();

                $subdomain->delete();
            }
        }
    }
}
