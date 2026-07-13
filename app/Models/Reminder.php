<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable([
    'reminder_project_id',
    'reminder_user_id',
    'reminder_title',
    'reminder_description',
    'reminder_due_at',
    'is_completed',
    'notification_read_at',
    'is_pinned',
    'source',
    'kanban_board_card_id',
])]
class Reminder extends Model
{
    protected $primaryKey = 'reminder_id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $casts = [
        'reminder_due_at' => 'datetime',
        'is_completed' => 'boolean',
        'notification_read_at' => 'datetime',
        'is_pinned' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (Reminder $model) {
            if (empty($model->reminder_id)) {
                $model->reminder_id = Str::uuid()->toString();
            }
        });
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'reminder_project_id', 'project_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reminder_user_id', 'id');
    }

    public function steps(): HasMany
    {
        return $this->hasMany(ReminderStep::class, 'reminder_id', 'reminder_id')->orderBy('position');
    }

    public function kanbanBoardCard(): BelongsTo
    {
        return $this->belongsTo(KanbanBoardCard::class, 'kanban_board_card_id', 'kanban_board_card_id');
    }
}
