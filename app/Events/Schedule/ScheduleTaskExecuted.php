<?php

namespace Pterodactyl\Events\Schedule;

use Pterodactyl\Models\ScheduleRunTask;
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
