<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $egg_id
 * @property string $category
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @property Egg $egg
 */
class EggCategoryMapping extends Model
{
    protected $table = 'egg_category_mappings';

    protected $fillable = [
        'egg_id',
        'category',
    ];

    protected $casts = [
        'egg_id' => 'integer',
    ];

    public static array $validationRules = [
        'egg_id' => 'required|integer|exists:eggs,id',
        'category' => 'required|string|max:64',
    ];

    public function egg(): BelongsTo
    {
        return $this->belongsTo(Egg::class);
    }
}
