<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * ChatRoom
 * ---------
 * PERBAIKAN:
 *  - belongsTo Project harus tunjuk ke 'project_id' sebagai ownerKey
 *    karena Project pakai custom PK 'project_id' bukan 'id'
 *  - participants() tidak pakai withTimestamps() karena pivot
 *    menggunakan 'joined_at' bukan created_at/updated_at
 *
 * @property string           $id
 * @property string           $project_id
 * @property 'group'|'dm'     $type
 * @property string|null      $name
 * @property string|null      $avatar_path
 * @property \Carbon\Carbon   $created_at
 * @property \Carbon\Carbon   $updated_at
 */
class ChatRoom extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'project_id',
        'type',
        'name',
        'avatar_path',
    ];

    protected $casts = [
        'type' => 'string',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id', 'project_id');
    }

    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'chat_room_participants',  
            'chat_room_id',           
            'user_id',
        )
        ->withPivot(['role', 'is_muted', 'last_read_message_id', 'joined_at']);
    }

    public function scopeGroup($query)
    {
        return $query->where('type', 'group');
    }

    public function scopeDm($query)
    {
        return $query->where('type', 'dm');
    }


    public function avatarUrl(): ?string
    {
        if (! $this->avatar_path) {
            return null;
        }

        return app(\App\Services\StorageService::class)->url($this->avatar_path);
    }
}