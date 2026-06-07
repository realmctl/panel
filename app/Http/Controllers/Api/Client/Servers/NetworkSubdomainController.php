<?php

namespace Realm\Http\Controllers\Api\Client\Servers;

use Realm\Models\Server;
use Realm\Facades\Activity;
use Realm\Exceptions\DisplayException;
use Realm\Models\Subdomain\EggRecord;
use Realm\Models\Subdomain\Record;
use Realm\Models\Subdomain\Subdomain;
use Realm\Services\Subdomains\SubdomainManagementService;
use Realm\Http\Controllers\Api\Client\ClientApiController;
use Realm\Http\Requests\Api\Client\Servers\Network\GetSubdomainsRequest;
use Realm\Http\Requests\Api\Client\Servers\Network\StoreSubdomainRequest;
use Realm\Http\Requests\Api\Client\Servers\Network\DeleteSubdomainRequest;

class NetworkSubdomainController extends ClientApiController
{
    public function __construct(private SubdomainManagementService $subdomainService)
    {
        parent::__construct();
    }

    public function index(GetSubdomainsRequest $request, Server $server): array
    {
        $templates = EggRecord::query()
            ->where('egg_id', $server->egg_id)
            ->with(['record' => fn ($query) => $query->select('id', 'name', 'domain_id'), 'record.domain' => fn ($query) => $query->select('id', 'name')])
            ->get()
            ->pluck('record')
            ->filter()
            ->map(fn (Record $record) => [
                'id' => $record->id,
                'name' => $record->name,
                'domain' => $record->domain->name,
            ])
            ->values()
            ->toArray();

        $domains = $server->subdomains()
            ->with(['domain' => fn ($query) => $query->select('id', 'name')])
            ->select('created_at', 'id', 'type', 'name', 'domain_id')
            ->paginate(10);

        $domains->setCollection(
            $domains->getCollection()->map(fn ($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'type' => $item->type,
                'domain_id' => $item->domain_id,
                'created_at' => $item->created_at,
                'domain' => $item->domain->name,
            ])
        );

        return [
            'domains' => $domains,
            'template' => $templates,
            'meta' => [
                'egg_id' => $server->egg_id,
                'egg_name' => $server->egg->name,
                'limit' => $server->subdomain_limit,
                'can_create' => $server->subdomain_limit > 0
                    && $domains->total() < $server->subdomain_limit
                    && count($templates) > 0,
            ],
        ];
    }

    public function store(StoreSubdomainRequest $request, Server $server): array
    {
        if ($server->subdomain_limit <= 0) {
            throw new DisplayException('Subdomains cannot be created for this server.');
        }

        $record = Record::query()
            ->where('id', $request->input('record'))
            ->whereHas('eggRecords', fn ($query) => $query->where('egg_id', $server->egg_id))
            ->with('domain')
            ->first();

        if (!$record) {
            throw new DisplayException('Record not found.');
        }

        $subdomain = Activity::event('server:subdomain.create')->transaction(function ($log) use ($request, $server, $record) {
            if ($server->subdomains()->lockForUpdate()->count() >= $server->subdomain_limit) {
                throw new DisplayException('Cannot create additional subdomains on this server: limit has been reached.');
            }

            $subdomain = $this->subdomainService->create($server, $record, $request->input('data'));

            $log->subject($subdomain)->property('name', "{$subdomain->name}.{$record->domain->name}");

            return $subdomain;
        });

        return [
            'status' => 'success',
            'message' => 'Subdomain created successfully.',
            'subdomain' => [
                'id' => $subdomain->id,
                'name' => $subdomain->name,
                'domain' => $record->domain->name,
            ],
        ];
    }

    public function delete(DeleteSubdomainRequest $request, Server $server, Subdomain $subdomain): array
    {
        if ($subdomain->server_id !== $server->id) {
            throw new DisplayException('Record not found.');
        }

        $subdomain->load(['domain', 'record']);

        Activity::event('server:subdomain.delete')->subject($subdomain)->transaction(function () use ($subdomain, $server) {
            $this->subdomainService->delete($subdomain, $server);
        });

        return [
            'status' => 'success',
            'message' => 'Subdomain deleted successfully.',
        ];
    }
}
