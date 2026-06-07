<?php

namespace Realm\Models;

use Carbon\Carbon;
use Database\Factories\AllocationFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * Realm\Models\Allocation.
 *
 * @property int $id
 * @property int $node_id
 * @property string $ip
 * @property string|null $ip_alias
 * @property int $port
 * @property int|null $server_id
 * @property string|null $notes
 * @property bool $whitelist_enabled
 * @property string $protocol
 * @property array|null $allowed_ips
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string $alias
 * @property bool $has_alias
 * @property Server|null $server
 * @property Node $node
 * @property string $hashid
 *
 * @method static AllocationFactory factory(...$parameters)
 * @method static Builder|Allocation newModelQuery()
 * @method static Builder|Allocation newQuery()
 * @method static Builder|Allocation query()
 * @method static Builder|Allocation whereCreatedAt($value)
 * @method static Builder|Allocation whereId($value)
 * @method static Builder|Allocation whereIp($value)
 * @method static Builder|Allocation whereIpAlias($value)
 * @method static Builder|Allocation whereNodeId($value)
 * @method static Builder|Allocation whereNotes($value)
 * @method static Builder|Allocation wherePort($value)
 * @method static Builder|Allocation whereServerId($value)
 * @method static Builder|Allocation whereUpdatedAt($value)
 *
 * @mixin \Eloquent
 */
class Allocation extends Model
{
    /** @use HasFactory<AllocationFactory> */
    use HasFactory;

    /**
     * The resource name for this model when it is transformed into an
     * API representation using fractal.
     */
    public const RESOURCE_NAME = 'allocation';

    /**
     * The table associated with the model.
     */
    protected $table = 'allocations';

    /**
     * Fields that are not mass assignable.
     */
    protected $guarded = ['id', 'created_at', 'updated_at'];

    /**
     * Cast values to correct type.
     */
    protected $casts = [
        'node_id' => 'integer',
        'port' => 'integer',
        'server_id' => 'integer',
        'whitelist_enabled' => 'boolean',
        'allowed_ips' => 'array',
    ];

    public static array $validationRules = [
        'node_id' => 'required|exists:nodes,id',
        'ip' => 'required|ip',
        'port' => 'required|numeric|between:1024,65535',
        'ip_alias' => 'nullable|string',
        'server_id' => 'nullable|exists:servers,id',
        'notes' => 'nullable|string|max:256',
        'whitelist_enabled' => 'boolean',
        'protocol' => 'in:tcp,udp,both',
        'allowed_ips' => 'nullable|array',
        'allowed_ips.*' => ['string', 'regex:/^(\d{1,3}\.){3}\d{1,3}(\/([0-9]|[1-2][0-9]|3[0-2]))?$/'],
    ];

    public function getRouteKeyName(): string
    {
        return $this->getKeyName();
    }

    /**
     * Return a hashid encoded string to represent the ID of the allocation.
     */
    public function getHashidAttribute(): string
    {
        return app()->make('hashids')->encode($this->id);
    }

    /**
     * Accessor to automatically provide the IP alias if defined.
     */
    public function getAliasAttribute(?string $value): string
    {
        return (is_null($this->ip_alias)) ? $this->ip : $this->ip_alias;
    }

    /**
     * Accessor to quickly determine if this allocation has an alias.
     */
    public function getHasAliasAttribute(?string $value): bool
    {
        return !is_null($this->ip_alias);
    }

    public function toString(): string
    {
        return sprintf('%s:%s', $this->ip, $this->port);
    }

    /**
     * Gets information for the server associated with this allocation.
     *
     * @return BelongsTo<Server, $this>
     */
    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }

    /**
     * Return the Node model associated with this allocation.
     *
     * @return BelongsTo<Node, $this>
     */
    public function node(): BelongsTo
    {
        return $this->belongsTo(Node::class);
    }
}
