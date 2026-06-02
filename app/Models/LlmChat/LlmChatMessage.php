<?php

namespace App\Models\LlmChat;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use MongoDB\Laravel\Eloquent\Model;

#[Fillable([
    'llm_chat_message_id',
    'llm_chat_session_id',
    'role',
    'content',
])]
class LlmChatMessage extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'llm_chat_messages';

    protected $primaryKey = 'llm_chat_message_id';
    public $incrementing  = false;
    protected $keyType    = 'string';

    public function llmChatSession(): BelongsTo
    {
        return $this->belongsTo(LlmChatSession::class, 'llm_chat_session_id', 'llm_chat_session_id');
    }
}
