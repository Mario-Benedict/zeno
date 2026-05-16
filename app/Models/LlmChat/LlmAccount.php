<?php

namespace App\Models\LlmChat;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class LlmAccount extends Model
{
    protected $primaryKey = null;
    public $incrementing = false;

    protected $fillable = [
        'llm_account_id',
        'llm_project_id',
        'llm_model_id',
        'llm_token_limits',
        'llm_token_used',
        'llm_token_reset_date',
    ];

    public function llmModels()
    {
      return $this->belongsTo(LlmModel::class, 'llm_model_id', 'llm_model_id');
    }

    public function users()
    {
      return $this->belongsTo(User::class, 'llm_account_id', 'account_id');
    }
}
