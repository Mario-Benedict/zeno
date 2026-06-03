/**
 * types/llm-chat.ts
 * ──────────────────
 * Shared TypeScript interfaces for the LLM Chat feature.
 *
 * Sessions live in MySQL (llm_chat_sessions).
 * Messages live in MongoDB (llm_chat_messages).
 */

/** A single LLM chat session (sidebar list item). */
export interface LlmSession {
  llm_chat_session_id: string;
  llm_chat_session_name: string;
}

/** A single message inside an LLM chat session. */
export interface LlmMessage {
  llm_chat_message_id: string;
  /** 'user' = human turn, 'model' = AI response */
  role: 'user' | 'model';
  content: string;
}
