<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Note model.
 *
 * Relations:
 *  - notes.user_id    → users.id       (unsignedBigInteger)
 *  - notes.project_id → projects.project_id (uuid)
 *  - note_collaborators pivot: note_id, user_id, can_edit
 *
 * is_shared: false = Personal, true = Project-wide (Shared)
 *
 * @property string          $note_id
 * @property int             $user_id
 * @property string          $project_id
 * @property string          $title
 * @property array|null      $content
 * @property bool            $is_shared
 * @property \Carbon\Carbon  $created_at
 * @property \Carbon\Carbon  $updated_at
 * @property \Carbon\Carbon|null $deleted_at
 */
class Note extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $primaryKey = 'note_id';

    protected $fillable = [
        'user_id',
        'project_id',
        'title',
        'content',
        'is_shared',
    ];

    protected $casts = [
        'content'    => 'array',
        'is_shared'  => 'boolean',
        'deleted_at' => 'datetime',
    ];

    // ── Relations ──────────────────────────────────────────────────────────────

    /** The user who owns this note. */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    /** The project this note belongs to. */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id', 'project_id');
    }

    /**
     * Collaborators on this note.
     * Pivot: note_collaborators (note_id, user_id, can_edit)
     */
    public function collaborators(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'note_collaborators',
            'note_id',
            'user_id',
        )->withPivot('can_edit');
    }
}