<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Str;

class Note extends Model
{
    use HasFactory, SoftDeletes;

    protected $primaryKey = 'note_id';

    // Menandakan bahwa primary key kelompokmu bukan auto-increment integer, melainkan UUID/String
    public $incrementing = false;
    protected $keyType = 'string';

    protected $guarded = [];

    protected $casts = [
        'content'   => 'array',
        'is_shared' => 'boolean',
    ];

    /**
     * Pemicu Siklus Hidup Otomatis (Universal Lifecycle Boot)
     * Menjamin note_id selalu terisi UUID otomatis baik saat aplikasi dijalankan 
     * di browser, di-post lewat controller, maupun saat unit testing!
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->note_id)) {
                $model->note_id = (string) Str::uuid();
            }
        });
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function collaborators(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'note_collaborators', 'note_id', 'user_id')
                    ->withPivot('can_edit')
                    ->withTimestamps();
    }
}