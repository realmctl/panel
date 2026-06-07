<?php

namespace Realm\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $schedule_id
 * @property string $status
 * @property string $trigger
 * @property Carbon|null $started_at
 * @property Carbon|null $completed_at
 * @property string|null $error_message
 * @property Carbon $created_at
 * @property Carbon $updated_at
 * @property Schedule $schedule
 * @property Collection<int, ScheduleRunTask> $runTasks
 */
class ScheduleRun extends Model
{
    public const RESOURCE_NAME = 'schedule_run';

    public const STATUS_PENDING = 'pending';
    public const STATUS_RUNNING = 'running';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';
    public const STATUS_SKIPPED = 'skipped';

    public const TRIGGER_CRON = 'cron';
    public const TRIGGER_MANUAL = 'manual';

    protected $table = 'schedule_runs';

    protected $fillable = [
        'schedule_id',
        'status',
        'trigger',
        'started_at',
        'completed_at',
        'error_message',
    ];

    protected $casts = [
        'id' => 'integer',
        'schedule_id' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(Schedule::class);
    }

    public function runTasks(): HasMany
    {
        return $this->hasMany(ScheduleRunTask::class)->orderBy('sequence_id');
    }
}
