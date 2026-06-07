<?php

namespace Realm\Observers;

use Realm\Events\Subuser\Creating;
use Realm\Events\Subuser\Created;
use Realm\Events\Subuser\Deleting;
use Realm\Events\Subuser\Deleted;
use Realm\Events;
use Realm\Models\Subuser;
use Realm\Notifications\AddedToServer;
use Realm\Notifications\RemovedFromServer;

class SubuserObserver
{
    /**
     * Listen to the Subuser creating event.
     */
    public function creating(Subuser $subuser): void
    {
        event(new Creating($subuser));
    }

    /**
     * Listen to the Subuser created event.
     */
    public function created(Subuser $subuser): void
    {
        event(new Created($subuser));

        $subuser->user->notify(new AddedToServer([
            'user' => $subuser->user->name_first,
            'name' => $subuser->server->name,
            'uuidShort' => $subuser->server->uuidShort,
        ]));
    }

    /**
     * Listen to the Subuser deleting event.
     */
    public function deleting(Subuser $subuser): void
    {
        event(new Deleting($subuser));
    }

    /**
     * Listen to the Subuser deleted event.
     */
    public function deleted(Subuser $subuser): void
    {
        event(new Deleted($subuser));

        $subuser->user->notify(new RemovedFromServer([
            'user' => $subuser->user->name_first,
            'name' => $subuser->server->name,
        ]));
    }
}
