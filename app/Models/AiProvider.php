<?php

namespace Realm\Models;

use Illuminate\Database\Eloquent\Model;

class AiProvider extends Model
{
    protected $fillable = [
        'name',
        'type',
        'api_key',
        'base_url',
        'model',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
    ];
}
