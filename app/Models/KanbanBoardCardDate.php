<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

#[Fillable([
    'kanban_board_card_detail_id',
    'kanban_board_card_start_date',
    'kanban_board_card_due_date',
])]
class KanbanBoardCardDate extends Model
{
    protected $primaryKey = 'kanban_board_card_date_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $casts = [
        'kanban_board_card_start_date' => 'datetime',
        'kanban_board_card_due_date'   => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (KanbanBoardCardDate $model) {
            if (empty($model->kanban_board_card_date_id)) {
                $model->kanban_board_card_date_id = Str::uuid()->toString();
            }
        });
    }

    public function cardDetail(): BelongsTo
    {
        return $this->belongsTo(KanbanBoardCardDetail::class, 'kanban_board_card_detail_id', 'kanban_board_card_detail_id');
    }
}
