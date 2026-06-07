<?php

namespace Realm\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $schedule_run_id
 * @property int|null $task_id
 * @property int $sequence_id
 * @property string $action
 * @property string|null $payload
 * @property string $status
 * @property Carbon|null $started_at
 * @property Carbon|null $completed_at
 * @property string|null $error_message
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property ScheduleRun $scheduleRun
 * @property Task|null $task
 */
class ScheduleRunTask extends Model
{
    public const RESOURCE_NAME = 'schedule_run_task';

    public const STATUS_PENDING = 'pending';
    public const STATUS_RUNNING = 'running';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';
    public const STATUS_SKIPPED = 'skipped';

    protected $table = 'schedule_run_tasks';

    protected $fillable = [
        'schedule_run_id',
        'task_id',
        'sequence_id',
        'action',
        'payload',
        'status',
        'started_at',
        'completed_at',
        'error_message',
    ];

    protected $casts = [
        'id' => 'integer',
        'schedule_run_id' => 'integer',
        'task_id' => 'integer',
        'sequence_id' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function scheduleRun(): BelongsTo
    {
        return $this->belongsTo(ScheduleRun::class);
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }
}
