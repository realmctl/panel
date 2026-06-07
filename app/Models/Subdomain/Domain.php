<?php

namespace Realm\Models\Subdomain;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Domain extends Model
{
    protected $fillable = [
        'name',
        'type',
        'key',
        'secret',
        'display_type',
        'consumer',
        'cloudflare_id',
        'ovh_api',
    ];

    /**
     * @return HasMany<Subdomain, $this>
     */
    public function subdomains(): HasMany
    {
        return $this->hasMany(Subdomain::class);
    }

    /**
     * @return HasMany<Record, $this>
     */
    public function records(): HasMany
    {
        return $this->hasMany(Record::class);
    }
}
