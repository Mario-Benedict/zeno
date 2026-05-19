<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Note extends Model
{
    use HasFactory;

    /**
     * Atribut yang dapat diisi secara massal (Mass Assignment).
     */
    protected $fillable = [
        'user_id',
        'project_slug',
        'title',
        'description',
        'content',
        'embed_url',
        'type',
        'embed_title',
    ];

    /**
     * Cast atribut ke tipe data yang sesuai.
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relasi Eloquent: Menghubungkan catatan kembali ke User pemiliknya.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}