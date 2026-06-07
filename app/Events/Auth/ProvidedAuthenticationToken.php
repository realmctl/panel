<?php

namespace Realm\Events\Auth;

use Realm\Models\User;
use Realm\Events\Event;

class ProvidedAuthenticationToken extends Event
{
    public function __construct(public User $user, public bool $recovery = false)
    {
    }
}
