<?php

namespace Pterodactyl\Models\Subdomain;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Record extends Model
{
    protected $fillable = [
        'ttl',
        'type',
        'protocol',
        'priority',
        'name',
        'domain_id',
        'service',
        'weight',
    ];

    /**
     * @return BelongsTo<Domain, $this>
     */
    public function domain(): BelongsTo
    {
        return $this->belongsTo(Domain::class);
    }

    /**
     * @return HasMany<EggRecord, $this>
     */
    public function eggRecords(): HasMany
    {
        return $this->hasMany(EggRecord::class);
    }
}
