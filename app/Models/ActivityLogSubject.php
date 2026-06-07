<?php

namespace Realm\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * \Realm\Models\ActivityLogSubject.
 *
 * @property int $id
 * @property int $activity_log_id
 * @property int $subject_id
 * @property string $subject_type
 * @property ActivityLog|null $activityLog
 * @property Model $subject
 *
 * @method static Builder|ActivityLogSubject newModelQuery()
 * @method static Builder|ActivityLogSubject newQuery()
 * @method static Builder|ActivityLogSubject query()
 *
 * @mixin Model
 */
class ActivityLogSubject extends Pivot
{
    public $incrementing = true;
    public $timestamps = false;

    protected $table = 'activity_log_subjects';

    protected $guarded = ['id'];

    /**
     * @return BelongsTo<ActivityLog, $this>
     */
    public function activityLog(): BelongsTo
    {
        return $this->belongsTo(ActivityLog::class);
    }

    /**
     * @return MorphTo<Model, $this>
     */
    public function subject(): MorphTo
    {
        $morph = $this->morphTo();
        if (method_exists($morph, 'withTrashed')) { // @phpstan-ignore function.alreadyNarrowedType
            return $morph->withTrashed();
        }

        return $morph;
    }
}
