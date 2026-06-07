<?php

namespace Realm\Events\Subuser;

use Realm\Events\Event;
use Realm\Models\Subuser;
use Illuminate\Queue\SerializesModels;

class Creating extends Event
{
    use SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(public Subuser $subuser)
    {
    }
}
