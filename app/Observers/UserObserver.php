<?php

namespace Realm\Observers;

use Realm\Events\User\Creating;
use Realm\Events\User\Created;
use Realm\Events\User\Deleting;
use Realm\Events\User\Deleted;
use Realm\Events;
use Realm\Models\User;

class UserObserver
{
    protected string $uuid;

    /**
     * Listen to the User creating event.
     */
    public function creating(User $user): void
    {
        event(new Creating($user));
    }

    /**
     * Listen to the User created event.
     */
    public function created(User $user): void
    {
        event(new Created($user));
    }

    /**
     * Listen to the User deleting event.
     */
    public function deleting(User $user): void
    {
        event(new Deleting($user));
    }

    /**
     * Listen to the User deleted event.
     */
    public function deleted(User $user): void
    {
        event(new Deleted($user));
    }
}
