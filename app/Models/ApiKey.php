<?php

namespace Pterodactyl\Models;

use Illuminate\Support\Carbon;
use Database\Factories\ApiKeyFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;
use Webmozart\Assert\Assert;
use Pterodactyl\Services\Acl\Api\AdminAcl;
use Laravel\Sanctum\Contracts\HasAbilities;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * Pterodactyl\Models\ApiKey.
 *
 * @property int $id
 * @property int $user_id
 * @property int $key_type
 * @property string $identifier
 * @property string $token
 * @property array|null $allowed_ips
 * @property string|null $memo
 * @property Carbon|null $last_used_at
 * @property Carbon|null $expires_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property int $r_servers
 * @property int $r_nodes
 * @property int $r_allocations
 * @property int $r_users
 * @property int $r_locations
 * @property int $r_nests
 * @property int $r_eggs
 * @property int $r_database_hosts
 * @property int $r_server_databases
 * @property User $tokenable
 * @property User $user
 *
 * @method static ApiKeyFactory factory(...$parameters)
 * @method static Builder|ApiKey newModelQuery()
 * @method static Builder|ApiKey newQuery()
 * @method static Builder|ApiKey query()
 * @method static Builder|ApiKey whereAllowedIps($value)
 * @method static Builder|ApiKey whereCreatedAt($value)
 * @method static Builder|ApiKey whereId($value)
 * @method static Builder|ApiKey whereIdentifier($value)
 * @method static Builder|ApiKey whereKeyType($value)
 * @method static Builder|ApiKey whereLastUsedAt($value)
 * @method static Builder|ApiKey whereMemo($value)
 * @method static Builder|ApiKey whereRAllocations($value)
 * @method static Builder|ApiKey whereRDatabaseHosts($value)
 * @method static Builder|ApiKey whereREggs($value)
 * @method static Builder|ApiKey whereRLocations($value)
 * @method static Builder|ApiKey whereRNests($value)
 * @method static Builder|ApiKey whereRNodes($value)
 * @method static Builder|ApiKey whereRServerDatabases($value)
 * @method static Builder|ApiKey whereRServers($value)
 * @method static Builder|ApiKey whereRUsers($value)
 * @method static Builder|ApiKey whereToken($value)
 * @method static Builder|ApiKey whereUpdatedAt($value)
 * @method static Builder|ApiKey whereUserId($value)
 *
 * @mixin \Eloquent
 */
class ApiKey extends Model implements HasAbilities
{
    /** @use HasFactory<ApiKeyFactory> */
    use HasFactory;

    /**
     * The resource name for this model when it is transformed into an
     * API representation using fractal.
     */
    public const RESOURCE_NAME = 'api_key';
    /**
     * Different API keys that can exist on the system.
     */
    public const TYPE_NONE = 0;
    public const TYPE_ACCOUNT = 1;
    /* @deprecated */
    public const TYPE_APPLICATION = 2;
    /* @deprecated */
    public const TYPE_DAEMON_USER = 3;
    /* @deprecated */
    public const TYPE_DAEMON_APPLICATION = 4;
    /**
     * The length of API key identifiers.
     */
    public const IDENTIFIER_LENGTH = 16;
    /**
     * The length of the actual API key that is encrypted and stored
     * in the database.
     */
    public const KEY_LENGTH = 32;

    /**
     * The table associated with the model.
     */
    protected $table = 'api_keys';

    /**
     * Cast values to correct type.
     */
    protected $casts = [
        'allowed_ips' => 'array',
        'user_id' => 'int',
        'last_used_at' => 'datetime',
        'expires_at' => 'datetime',
        self::CREATED_AT => 'datetime',
        self::UPDATED_AT => 'datetime',
        'r_' . AdminAcl::RESOURCE_USERS => 'int',
        'r_' . AdminAcl::RESOURCE_ALLOCATIONS => 'int',
        'r_' . AdminAcl::RESOURCE_DATABASE_HOSTS => 'int',
        'r_' . AdminAcl::RESOURCE_SERVER_DATABASES => 'int',
        'r_' . AdminAcl::RESOURCE_EGGS => 'int',
        'r_' . AdminAcl::RESOURCE_LOCATIONS => 'int',
        'r_' . AdminAcl::RESOURCE_NESTS => 'int',
        'r_' . AdminAcl::RESOURCE_NODES => 'int',
        'r_' . AdminAcl::RESOURCE_SERVERS => 'int',
    ];

    /**
     * Fields that are mass assignable.
     */
    protected $fillable = [
        'identifier',
        'token',
        'allowed_ips',
        'memo',
        'last_used_at',
        'expires_at',
    ];

    /**
     * Fields that should not be included when calling toArray() or toJson()
     * on this model.
     */
    protected $hidden = ['token'];

    /**
     * Rules to protect against invalid data entry to DB.
     */
    public static array $validationRules = [
        'user_id' => 'required|exists:users,id',
        'key_type' => 'present|integer|min:0|max:4',
        'identifier' => 'required|string|size:16|unique:api_keys,identifier',
        'token' => 'required|string',
        'memo' => 'required|nullable|string|max:500',
        'allowed_ips' => 'nullable|array',
        'allowed_ips.*' => 'string',
        'last_used_at' => 'nullable|date',
        'expires_at' => 'nullable|date',
        'r_' . AdminAcl::RESOURCE_USERS => 'integer|min:0|max:3',
        'r_' . AdminAcl::RESOURCE_ALLOCATIONS => 'integer|min:0|max:3',
        'r_' . AdminAcl::RESOURCE_DATABASE_HOSTS => 'integer|min:0|max:3',
        'r_' . AdminAcl::RESOURCE_SERVER_DATABASES => 'integer|min:0|max:3',
        'r_' . AdminAcl::RESOURCE_EGGS => 'integer|min:0|max:3',
        'r_' . AdminAcl::RESOURCE_LOCATIONS => 'integer|min:0|max:3',
        'r_' . AdminAcl::RESOURCE_NESTS => 'integer|min:0|max:3',
        'r_' . AdminAcl::RESOURCE_NODES => 'integer|min:0|max:3',
        'r_' . AdminAcl::RESOURCE_SERVERS => 'integer|min:0|max:3',
    ];

    public function can($ability)
    {
        // todo: this was never initially implemented and only became obvious once
        //  internal tooling was updated and started catching this mistake.
        return false;
    }

    public function cant($ability)
    {
        return ! $this->can($ability);
    }

    /**
     * Returns the user this token is assigned to.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Required for support with Laravel Sanctum.
     *
     * @return BelongsTo<User, $this>
     *
     * @see \Laravel\Sanctum\Guard::supportsTokens()
     */
    public function tokenable(): BelongsTo
    {
        return $this->user();
    }

    /**
     * Finds the model matching the provided token.
     */
    public static function findToken(string $token): ?self
    {
        $identifier = substr($token, 0, self::IDENTIFIER_LENGTH);

        $model = static::where('identifier', $identifier)->first();
        if (!is_null($model) && decrypt($model->token) === substr($token, strlen($identifier))) {
            return $model;
        }

        return null;
    }

    /**
     * Returns the standard prefix for API keys in the system.
     */
    public static function getPrefixForType(int $type): string
    {
        Assert::oneOf($type, [self::TYPE_ACCOUNT, self::TYPE_APPLICATION]);

        return $type === self::TYPE_ACCOUNT ? 'ptlc_' : 'ptla_';
    }

    /**
     * Generates a new identifier for an API key.
     */
    public static function generateTokenIdentifier(int $type): string
    {
        $prefix = self::getPrefixForType($type);

        return $prefix . Str::random(self::IDENTIFIER_LENGTH - strlen($prefix));
    }
}
