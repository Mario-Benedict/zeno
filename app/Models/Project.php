<?php

namespace App\Models;

use App\Enums\ProjectRole;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Project extends Model
{
    protected $primaryKey = 'project_id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'project_name',
        'project_slug',
        'avatar_color',
        'avatar_url',
        'invitation_link',
        'invitation_role',
    ];

    protected function casts(): array
    {
        return [
            'invitation_role' => 'string',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Project $project) {
            if (empty($project->project_id)) {
                $project->project_id = Str::uuid()->toString();
            }
        });
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_user', 'project_id', 'user_id')
            ->withPivot(['role', 'is_pinned', 'opened_at']);
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(ProjectInvitation::class, 'project_id', 'project_id');
    }

    public function kanbanBoards(): HasMany
    {
        return $this->hasMany(KanbanBoard::class, 'kanban_board_project_id', 'project_id');
    }

    public static function generateUniqueSlug(string $name, ?string $excludeId = null): string
    {
        $base = Str::limit(Str::slug($name), 65, '');

        if ($base === '') {
            $base = Str::lower(Str::random(8));
        }

        $taken = fn (string $candidate): bool => static::where('project_slug', $candidate)
            ->when($excludeId, fn ($q) => $q->where('project_id', '!=', $excludeId))
            ->exists();

        if (! $taken($base)) {
            return $base;
        }

        do {
            $candidate = Str::limit($base, 59, '').'-'.Str::lower(Str::random(5));
        } while ($taken($candidate));

        return $candidate;
    }

    public function roleFor(User|int|string|null $user): ?ProjectRole
    {
        $userId = $user instanceof User ? $user->id : $user;

        if ($userId === null) {
            return null;
        }

        $role = $this->members()
            ->where('users.id', $userId)
            ->value('project_user.role');

        return is_string($role) ? ProjectRole::tryFrom($role) : null;
    }

    public function isMember(User|int|string|null $user): bool
    {
        $userId = $user instanceof User ? $user->id : $user;

        if ($userId === null) {
            return false;
        }

        return $this->members()
            ->where('users.id', $userId)
            ->exists();
    }
}
