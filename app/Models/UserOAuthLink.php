<?php

namespace Realm\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserOAuthLink extends Model
{
    protected $table = 'user_oauth_links';

    protected $fillable = [
        'user_id',
        'provider',
        'provider_id',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
