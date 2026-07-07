<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

#[Fillable([
    'reminder_id',
    'reminder_step_name',
    'is_completed',
    'position',
])]
class ReminderStep extends Model
{
    protected $primaryKey = 'reminder_step_id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $casts = [
        'is_completed' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (ReminderStep $model) {
            if (empty($model->reminder_step_id)) {
                $model->reminder_step_id = Str::uuid()->toString();
            }
        });
    }

    public function reminder(): BelongsTo
    {
        return $this->belongsTo(Reminder::class, 'reminder_id', 'reminder_id');
    }
}
