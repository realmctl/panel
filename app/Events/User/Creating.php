<?php

namespace Realm\Events\User;

use Realm\Models\User;
use Realm\Events\Event;
use Illuminate\Queue\SerializesModels;

class Creating extends Event
{
    use SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(public User $user)
    {
    }
}
