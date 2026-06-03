<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable([
    'kanban_board_card_checklist_detail_id',
    'kanban_board_card_checklist_name',
])]
class KanbanBoardCardChecklist extends Model
{
    protected $primaryKey = 'kanban_board_card_checklist_id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected static function booted(): void
    {
        static::creating(function (KanbanBoardCardChecklist $model) {
            if (empty($model->kanban_board_card_checklist_id)) {
                $model->kanban_board_card_checklist_id = Str::uuid()->toString();
            }
        });
    }

    public function cardDetail(): BelongsTo
    {
        return $this->belongsTo(KanbanBoardCardDetail::class, 'kanban_board_card_checklist_detail_id', 'kanban_board_card_detail_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(KanbanBoardCardChecklistItem::class, 'kanban_board_card_checklist_id', 'kanban_board_card_checklist_id');
    }
}
