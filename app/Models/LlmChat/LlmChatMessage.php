<?php

namespace App\Models\LlmChat;

use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'llm_chat_message_id', 'llm_chat_session_id', 'role', 'content'
])]
class LlmChatMessage extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'llm_chat_messages';

    protected $primaryKey = 'llm_chat_message_id';
    public $incrementing = false;
    protected $keyType = 'string';

    public function llmChatSessions()
    {
      return $this->belongsTo(LlmChatSession::class, 'llm_chat_session_id', 'llm_chat_session_id');
    }
}
