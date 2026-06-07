<?php

namespace Realm\Repositories\Wings;

use Realm\Models\Node;
use Webmozart\Assert\Assert;
use Realm\Models\Server;
use Psr\Http\Message\ResponseInterface;
use GuzzleHttp\Exception\TransferException;
use Realm\Exceptions\Http\Connection\DaemonConnectionException;

/**
 * @method DaemonPowerRepository setNode(Node $node)
 * @method DaemonPowerRepository setServer(Server $server)
 */
class DaemonPowerRepository extends DaemonRepository
{
    /**
     * Sends a power action to the server instance.
     *
     * @throws DaemonConnectionException
     */
    public function send(string $action): ResponseInterface
    {
        Assert::isInstanceOf($this->server, Server::class);

        try {
            return $this->getHttpClient()->post(
                sprintf('/api/servers/%s/power', $this->server->uuid),
                ['json' => ['action' => $action]]
            );
        } catch (TransferException $exception) {
            throw new DaemonConnectionException($exception);
        }
    }
}
