<?php

namespace Realm\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $uuid
 * @property string $name
 * @property string $adapter
 * @property string|null $bucket
 * @property string|null $region
 * @property string|null $access_key
 * @property string|null $secret_key
 * @property string|null $endpoint
 * @property bool $use_path_style_endpoint
 * @property string|null $storage_class
 * @property Location[] $locations
 */
class BackupDestination extends Model
{
    public const RESOURCE_NAME = 'backup_destination';

    protected $table = 'backup_destinations';

    protected $guarded = ['id', 'created_at', 'updated_at'];

    protected $casts = [
        'use_path_style_endpoint' => 'boolean',
        'access_key' => 'encrypted',
        'secret_key' => 'encrypted',
    ];

    public static array $validationRules = [
        'name' => 'required|string|between:1,191',
        'adapter' => 'required|string|in:s3',
        'bucket' => 'required_if:adapter,s3|nullable|string|between:1,191',
        'region' => 'nullable|string|between:1,191',
        'access_key' => 'required_if:adapter,s3|nullable|string',
        'secret_key' => 'required_if:adapter,s3|nullable|string',
        'endpoint' => 'nullable|string|between:1,191',
        'use_path_style_endpoint' => 'boolean',
        'storage_class' => 'nullable|string|between:1,64',
    ];

    public function getRouteKeyName(): string
    {
        return $this->getKeyName();
    }

    /**
     * @return HasMany<Location, $this>
     */
    public function locations(): HasMany
    {
        return $this->hasMany(Location::class);
    }
}
