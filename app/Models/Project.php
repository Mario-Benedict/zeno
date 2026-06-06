<?php

namespace App\Models;

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
        'invitation_link',
    ];

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

    public function notes(): HasMany
    {
        return $this->hasMany(Note::class, 'project_id', 'project_id');
    }
}
