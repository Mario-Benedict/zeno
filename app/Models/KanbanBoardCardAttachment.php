<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

#[Fillable([
    'kanban_board_card_detail_id',
    'kanban_board_card_attachment_name',
    'kanban_board_card_attachment_url',
])]
class KanbanBoardCardAttachment extends Model
{
    protected $primaryKey = 'kanban_board_card_attachment_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected static function booted(): void
    {
        static::creating(function (KanbanBoardCardAttachment $model) {
            if (empty($model->kanban_board_card_attachment_id)) {
                $model->kanban_board_card_attachment_id = Str::uuid()->toString();
            }
        });
    }

    public function cardDetail(): BelongsTo
    {
        return $this->belongsTo(KanbanBoardCardDetail::class, 'kanban_board_card_detail_id', 'kanban_board_card_detail_id');
    }
}
