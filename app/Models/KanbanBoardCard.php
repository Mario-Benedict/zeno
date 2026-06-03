<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

#[Fillable([
    'kanban_board_id',
    'position',
])]
class KanbanBoardCard extends Model
{
    protected $primaryKey = 'kanban_board_card_id';

    public $incrementing = false;

    protected $keyType = 'string';

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

    public function detail(): HasOne
    {
        return $this->hasOne(KanbanBoardCardDetail::class, 'kanban_board_card_id', 'kanban_board_card_id');
    }
}
