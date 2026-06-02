<?php

namespace App\Models\LlmChat;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'llm_model_id',
    'llm_model_provider',
    'llm_model_name'
])]
class LlmModel extends Model
{
    protected $primaryKey = 'llm_model_id';
    public $incrementing = false;
    protected $keyType = 'string';

    public function llmChatSessions()
    {
      return $this->hasMany(LlmChatSession::class, 'llm_chat_current_model_id', 'llm_model_id');
    }

    public function llmAccounts()
    {
      return $this->hasMany(LlmAccount::class, 'llm_model_id', 'llm_model_id');
    }
}


