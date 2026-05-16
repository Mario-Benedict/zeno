<?php

namespace App\Models\LlmChat;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class LlmChatSession extends Model
{
    protected $primaryKey = 'llm_chat_session_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'llm_chat_session_id',
        'llm_chat_account_id',
        'llm_chat_session_name',
        'llm_chat_current_model_id',
    ];

    public function Users()
    {
      return $this->belongsTo(User::class, 'llm_chat_account_id', 'id');
    }

    public function llmModels()
    {
      return $this->belongsTo(LlmModel::class, 'llm_chat_current_model_id', 'llm_model_id');
    }

    public function llmChatMessages()
    {
      return $this->hasMany(LlmChatMessage::class, 'llm_chat_session_id', 'llm_chat_session_id');
    }
}
