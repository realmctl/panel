<?php

namespace Realm\Events\Schedule;

use Realm\Models\ScheduleRunTask;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ScheduleTaskExecuted
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(public ScheduleRunTask $runTask, public bool $success)
    {
    }
}
