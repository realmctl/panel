<?php

namespace Realm\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubuserPermissionTemplate extends Model
{
    const RESOURCE_NAME = 'subuser_permission_template';

    protected $table = 'subuser_permission_templates';

    protected $fillable = [
        'uuid',
        'user_id',
        'name',
        'permissions',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'permissions' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
