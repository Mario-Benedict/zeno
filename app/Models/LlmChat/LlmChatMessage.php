<?php

namespace App\Models\LlmChat;

use MongoDB\Laravel\Eloquent\Model;

class LlmChatMessage extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'llm_chat_messages';
    
    protected $primaryKey = 'llm_chat_message_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'llm_chat_message_id',
        'llm_chat_session_id',
        'role',
        'content',
    ];

    public function llmChatSessions()
    {
      return $this->belongsTo(LlmChatSession::class, 'llm_chat_session_id', 'llm_chat_session_id');
    }
}
