<?php

namespace Realm\Repositories\Wings;

use GuzzleHttp\Client;
use GuzzleHttp\HandlerStack;
use Realm\Models\Node;
use Webmozart\Assert\Assert;
use Realm\Models\Server;
use Illuminate\Contracts\Foundation\Application;

abstract class DaemonRepository
{
    protected ?Server $server;

    protected ?Node $node;

    /**
     * A single, shared Guzzle handler stack reused across every client this
     * process creates. Sharing the underlying cURL handler keeps its
     * connection pool alive between calls, so repeated requests to the same
     * daemon reuse an established TCP + TLS connection instead of paying for a
     * fresh handshake each time. That handshake is the dominant per-request
     * cost whenever the panel reaches the daemon through a proxy or tunnel.
     */
    private static ?HandlerStack $handlerStack = null;

    /**
     * DaemonRepository constructor.
     */
    public function __construct(protected Application $app)
    {
    }

    /**
     * Set the server model this request is stemming from.
     */
    public function setServer(Server $server): self
    {
        $this->server = $server;

        $this->setNode($this->server->node);

        return $this;
    }

    /**
     * Set the node model this request is stemming from.
     */
    public function setNode(Node $node): self
    {
        $this->node = $node;

        return $this;
    }

    /**
     * Return an instance of the Guzzle HTTP Client to be used for requests.
     */
    public function getHttpClient(array $headers = []): Client
    {
        Assert::isInstanceOf($this->node, Node::class);

        if (self::$handlerStack === null) {
            self::$handlerStack = HandlerStack::create();
        }

        return new Client([
            'handler' => self::$handlerStack,
            'verify' => $this->app->environment('production'),
            'base_uri' => $this->node->getConnectionAddress(),
            'timeout' => config('realm.guzzle.timeout'),
            'connect_timeout' => config('realm.guzzle.connect_timeout'),
            'headers' => array_merge($headers, [
                'Authorization' => 'Bearer ' . $this->node->getDecryptedKey(),
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
                'Connection' => 'keep-alive',
            ]),
        ]);
    }
}
