<?php

namespace Pterodactyl\Repositories\Wings;

use Pterodactyl\Models\Allocation;
use GuzzleHttp\Exception\GuzzleException;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;
use Webmozart\Assert\Assert;
use Pterodactyl\Models\Server;

/**
 * @method DaemonFirewallRepository setServer(Server $server)
 */
class DaemonFirewallRepository extends DaemonRepository
{
    /**
     * Push updated whitelist rules for a single allocation to Wings.
     * Wings is expected to translate this into iptables/nftables rules
     * scoped to the given port.
     *
     * @throws DaemonConnectionException
     */
    public function syncAllocation(Allocation $allocation): void
    {
        Assert::isInstanceOf($this->server, Server::class);

        $rules = [];

        if ($allocation->whitelist_enabled && !empty($allocation->allowed_ips)) {
            foreach ($allocation->allowed_ips as $ip) {
                $rules[] = ['ip' => $ip, 'action' => 'allow'];
            }
            // Implicit deny for everything else — Wings handles DROP rule generation.
            $rules[] = ['ip' => '0.0.0.0/0', 'action' => 'deny'];
        }

        try {
            $this->getHttpClient()->post(
                sprintf('/api/servers/%s/firewall', $this->server->uuid),
                [
                    'json' => [
                        'port' => $allocation->port,
                        'protocol' => $allocation->protocol,
                        'enabled' => $allocation->whitelist_enabled,
                        'rules' => $rules,
                    ],
                ]
            );
        } catch (GuzzleException $exception) {
            throw new DaemonConnectionException($exception);
        }
    }
}
