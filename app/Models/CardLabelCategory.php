<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable([
    'card_label_category_name',
])]
class CardLabelCategory extends Model
{
    protected $primaryKey = 'card_label_category_id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected static function booted(): void
    {
        static::creating(function (CardLabelCategory $model) {
            if (empty($model->card_label_category_id)) {
                $model->card_label_category_id = Str::uuid()->toString();
            }
        });
    }

    public function cardLabels(): HasMany
    {
        return $this->hasMany(CardLabel::class, 'card_label_category_id', 'card_label_category_id');
    }
}
