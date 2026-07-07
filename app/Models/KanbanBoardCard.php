<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable([
    'kanban_board_id',
    'position',
    'kanban_board_card_title',
    'kanban_board_card_description',
    'is_completed',
    'kanban_board_card_start_date',
    'kanban_board_card_due_date',
])]
class KanbanBoardCard extends Model
{
    protected $primaryKey = 'kanban_board_card_id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $casts = [
        'is_completed' => 'boolean',
        'kanban_board_card_start_date' => 'datetime',
        'kanban_board_card_due_date' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (KanbanBoardCard $model) {
            if (empty($model->kanban_board_card_id)) {
                $model->kanban_board_card_id = Str::uuid()->toString();
            }
        });
    }

    public function kanbanBoard(): BelongsTo
    {
        return $this->belongsTo(KanbanBoard::class, 'kanban_board_id', 'kanban_board_id');
    }

    public function labels(): BelongsToMany
    {
        return $this->belongsToMany(
            CardLabel::class,
            'kanban_board_card_labels',
            'kanban_board_card_id',
            'kanban_board_card_label_id'
        );
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'kanban_board_card_members',
            'kanban_board_card_id',
            'kanban_board_card_account_id'
        );
    }

    public function checklists(): HasMany
    {
        return $this->hasMany(KanbanBoardCardChecklist::class, 'kanban_board_card_id', 'kanban_board_card_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(KanbanBoardCardAttachment::class, 'kanban_board_card_id', 'kanban_board_card_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(KanbanBoardCardComment::class, 'kanban_board_card_id', 'kanban_board_card_id');
    }
}
