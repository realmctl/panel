<?php

namespace Realm\Observers;

use Realm\Events\Server\Creating;
use Realm\Events\Server\Created;
use Realm\Events\Server\Deleting;
use Realm\Events\Server\Deleted;
use Realm\Events\Server\Saving;
use Realm\Events\Server\Saved;
use Realm\Events\Server\Updating;
use Realm\Events\Server\Updated;
use Realm\Events;
use Realm\Models\Server;
use Illuminate\Foundation\Bus\DispatchesJobs;

class ServerObserver
{
    use DispatchesJobs;

    /**
     * Listen to the Server creating event.
     */
    public function creating(Server $server): void
    {
        event(new Creating($server));
    }

    /**
     * Listen to the Server created event.
     */
    public function created(Server $server): void
    {
        event(new Created($server));
    }

    /**
     * Listen to the Server deleting event.
     */
    public function deleting(Server $server): void
    {
        event(new Deleting($server));
    }

    /**
     * Listen to the Server deleted event.
     */
    public function deleted(Server $server): void
    {
        event(new Deleted($server));
    }

    /**
     * Listen to the Server saving event.
     */
    public function saving(Server $server): void
    {
        event(new Saving($server));
    }

    /**
     * Listen to the Server saved event.
     */
    public function saved(Server $server): void
    {
        event(new Saved($server));
    }

    /**
     * Listen to the Server updating event.
     */
    public function updating(Server $server): void
    {
        event(new Updating($server));
    }

    /**
     * Listen to the Server saved event.
     */
    public function updated(Server $server): void
    {
        event(new Updated($server));
    }
}
