<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $uuid
 * @property int $server_id
 * @property string $file_path
 * @property string|null $hash
 * @property int $size
 * @property int|null $user_id
 * @property string $action
 * @property string|null $content
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * @property Server $server
 * @property User|null $user
 */
class FileRevision extends Model
{
    public const RESOURCE_NAME = 'file_revision';

    public const ACTION_CREATED = 'created';
    public const ACTION_EDITED = 'edited';
    public const ACTION_UPLOADED = 'uploaded';
    public const ACTION_DELETED = 'deleted';
    public const ACTION_RESTORED = 'restored';

    protected $table = 'file_revisions';

    protected $guarded = ['id', 'created_at', 'updated_at'];

    protected $casts = [
        'server_id' => 'integer',
        'size' => 'integer',
        'user_id' => 'integer',
    ];

    public static array $validationRules = [
        'uuid' => 'required|uuid|unique:file_revisions,uuid',
        'server_id' => 'required|integer|exists:servers,id',
        'file_path' => 'required|string|max:512',
        'hash' => 'nullable|string|max:128',
        'size' => 'required|integer|min:0',
        'user_id' => 'nullable|integer|exists:users,id',
        'action' => 'required|string|in:created,edited,uploaded,deleted,restored',
        'content' => 'nullable|string',
    ];

    /**
     * @return BelongsTo<Server, $this>
     */
    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
