<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable([
    'kanban_board_project_id',
    'kanban_board_name',
    'kanban_board_position',
])]
class KanbanBoard extends Model
{
    protected $primaryKey = 'kanban_board_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected static function booted(): void
    {
        static::creating(function (KanbanBoard $model) {
            if (empty($model->kanban_board_id)) {
                $model->kanban_board_id = Str::uuid()->toString();
            }
        });
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'kanban_board_project_id', 'project_id');
    }

    public function cards(): HasMany
    {
        return $this->hasMany(KanbanBoardCard::class, 'kanban_board_id', 'kanban_board_id');
    }
}
