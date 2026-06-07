<?php

namespace Realm\Events\Server;

use Realm\Events\Event;
use Realm\Models\Server;
use Illuminate\Queue\SerializesModels;

class Deleted extends Event
{
    use SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(public Server $server)
    {
    }
}
