<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

#[Fillable([
    'card_label_project_id',
    'card_label_color_hex',
    'card_label_name',
])]
class CardLabel extends Model
{
    protected $primaryKey = 'card_label_id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected static function booted(): void
    {
        static::creating(function (CardLabel $model) {
            if (empty($model->card_label_id)) {
                $model->card_label_id = Str::uuid()->toString();
            }
        });
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'card_label_project_id', 'project_id');
    }

    public function kanbanBoardCards(): BelongsToMany
    {
        return $this->belongsToMany(
            KanbanBoardCard::class,
            'kanban_board_card_labels',
            'kanban_board_card_label_id',
            'kanban_board_card_id'
        );
    }
}
