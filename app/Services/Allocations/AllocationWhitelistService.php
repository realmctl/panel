<?php

namespace Realm\Services\Allocations;

use Illuminate\Support\Facades\Log;
use Realm\Models\Server;
use Realm\Models\Allocation;
use Realm\Repositories\Wings\DaemonFirewallRepository;
use Realm\Exceptions\Http\Connection\DaemonConnectionException;

class AllocationWhitelistService
{
    public function __construct(private DaemonFirewallRepository $firewallRepository)
    {
    }

    /**
     * Sync the whitelist rules for the given allocation to Wings.
     * A failed sync is logged but does not interrupt the request — the database
     * state is authoritative and Wings will re-apply rules on next server start.
     */
    public function sync(Server $server, Allocation $allocation): void
    {
        try {
            $this->firewallRepository
                ->setServer($server)
                ->syncAllocation($allocation);
        } catch (DaemonConnectionException $e) {
            Log::warning('Failed to push firewall whitelist to Wings for allocation', [
                'allocation_id' => $allocation->id,
                'server_uuid' => $server->uuid,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
