<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

#[Fillable([
    'kanban_board_card_id',
    'kanban_board_card_title',
    'kanban_board_card_description',
    'is_completed',
])]
class KanbanBoardCardDetail extends Model
{
    protected $primaryKey = 'kanban_board_card_detail_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $casts = [
        'is_completed' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (KanbanBoardCardDetail $model) {
            if (empty($model->kanban_board_card_detail_id)) {
                $model->kanban_board_card_detail_id = Str::uuid()->toString();
            }
        });
    }

    public function kanbanBoardCard(): BelongsTo
    {
        return $this->belongsTo(KanbanBoardCard::class, 'kanban_board_card_id', 'kanban_board_card_id');
    }

    public function labels(): BelongsToMany
    {
        return $this->belongsToMany(
            CardLabel::class,
            'kanban_board_card_labels',
            'kanban_board_card_detail_id',
            'kanban_board_card_label_id'
        );
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'kanban_board_card_members',
            'kanban_board_card_detail_id',
            'kanban_board_card_account_id'
        );
    }

    public function checklists(): HasMany
    {
        return $this->hasMany(KanbanBoardCardChecklist::class, 'kanban_board_card_checklist_detail_id', 'kanban_board_card_detail_id');
    }

    public function dates(): HasOne
    {
        return $this->hasOne(KanbanBoardCardDate::class, 'kanban_board_card_detail_id', 'kanban_board_card_detail_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(KanbanBoardCardAttachment::class, 'kanban_board_card_detail_id', 'kanban_board_card_detail_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(KanbanBoardCardComment::class, 'kanban_board_card_detail_id', 'kanban_board_card_detail_id');
    }
}
