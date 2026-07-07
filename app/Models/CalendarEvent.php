<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class CalendarEvent extends Model
{
    protected $table = 'calendar_events';

    protected $primaryKey = 'id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'project_id',
        'title',
        'description',
        'start_time',
        'end_time',
        'priority',
        'created_by',
        'recurrence',
        'recurrence_group_id',
    ];

    protected function casts(): array
    {
        return [
            'start_time' => 'datetime',
            'end_time' => 'datetime',
            'excluded_occurrence_dates' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (CalendarEvent $event) {
            if (empty($event->id)) {
                $event->id = Str::uuid()->toString();
            }
        });
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id', 'project_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'calendar_event_participants', 'event_id', 'user_id');
    }
}
