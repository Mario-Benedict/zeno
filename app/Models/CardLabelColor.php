<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable([
    'card_label_color_hex',
])]
class CardLabelColor extends Model
{
    protected $primaryKey = 'card_label_color_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected static function booted(): void
    {
        static::creating(function (CardLabelColor $model) {
            if (empty($model->card_label_color_id)) {
                $model->card_label_color_id = Str::uuid()->toString();
            }
        });
    }

    public function cardLabels(): HasMany
    {
        return $this->hasMany(CardLabel::class, 'card_label_color_id', 'card_label_color_id');
    }
}
