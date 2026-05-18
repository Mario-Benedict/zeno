<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

#[Fillable([
    'kanban_board_card_detail_id',
    'kanban_board_card_comment_from',
    'kanban_board_card_comment_message',
])]
class KanbanBoardCardComment extends Model
{
    protected $primaryKey = 'kanban_board_card_comment_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected static function booted(): void
    {
        static::creating(function (KanbanBoardCardComment $model) {
            if (empty($model->kanban_board_card_comment_id)) {
                $model->kanban_board_card_comment_id = Str::uuid()->toString();
            }
        });
    }

    public function cardDetail(): BelongsTo
    {
        return $this->belongsTo(KanbanBoardCardDetail::class, 'kanban_board_card_detail_id', 'kanban_board_card_detail_id');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'kanban_board_card_comment_from', 'user_id');
    }
}
