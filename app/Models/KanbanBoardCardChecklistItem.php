<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

#[Fillable([
    'kanban_board_card_checklist_id',
    'kanban_board_card_checklist_item_name',
    'is_completed',
])]
class KanbanBoardCardChecklistItem extends Model
{
    protected $primaryKey = 'kanban_board_card_checklist_item_id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $casts = [
        'is_completed' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (KanbanBoardCardChecklistItem $model) {
            if (empty($model->kanban_board_card_checklist_item_id)) {
                $model->kanban_board_card_checklist_item_id = Str::uuid()->toString();
            }
        });
    }

    public function checklist(): BelongsTo
    {
        return $this->belongsTo(KanbanBoardCardChecklist::class, 'kanban_board_card_checklist_id', 'kanban_board_card_checklist_id');
    }
}
