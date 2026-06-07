<?php

namespace Realm\Events\Schedule;

use Realm\Models\ScheduleRun;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ScheduleRunStarted
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(public ScheduleRun $run)
    {
    }
}
