<?php

namespace Realm\Events\Auth;

use Realm\Models\User;
use Realm\Events\Event;

class DirectLogin extends Event
{
    public function __construct(public User $user, public bool $remember)
    {
    }
}
