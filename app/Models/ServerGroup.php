<?php

namespace Realm\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ServerGroup extends Model
{
    const RESOURCE_NAME = 'server_group';

    protected $table = 'server_groups';

    protected $fillable = [
        'uuid',
        'user_id',
        'name',
        'color',
        'sort_order',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'sort_order' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function servers(): BelongsToMany
    {
        return $this->belongsToMany(Server::class, 'server_group_server', 'group_id', 'server_id');
    }
}
