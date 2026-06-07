<?php

namespace Realm\Events\Schedule;

use Realm\Models\ScheduleRun;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ScheduleRunCompleted
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(public ScheduleRun $run)
    {
    }
}
