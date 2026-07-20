import { useCallback, useEffect, useRef } from 'react';
import LlmMarkdown from '@/components/llm-chat/LlmMarkdown';
import LlmModelTurn from '@/components/llm-chat/LlmModelTurn';
import LlmThinkingIndicator from '@/components/llm-chat/LlmThinkingIndicator';
import LlmTypewriter from '@/components/llm-chat/LlmTypewriter';
import LlmUserTurn from '@/components/llm-chat/LlmUserTurn';
import type { LlmMessage } from '@/types/llm-chat';

interface Props {
  messages: LlmMessage[];
  optimisticUser?: string | null;
  isThinking?: boolean;
  animatingId?: string | null;
  onAnimationDone?: () => void;
}

const LlmChatMessageList = ({
  messages,
  optimisticUser,
  isThinking,
  animatingId,
  onAnimationDone,
}: Props) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, optimisticUser, isThinking, scrollToBottom]);

  return (
    <div className="scrollbar-app flex min-h-0 flex-1 flex-col overflow-y-auto px-6">
      <div className="mx-auto w-full max-w-3xl py-6">
        <div className="space-y-6">
          {messages.map((message) => {
            if (message.role === 'user') {
              return (
                <LlmUserTurn
                  key={message.llm_chat_message_id}
                  text={message.content}
                />
              );
            }

            const isAnimating = animatingId === message.llm_chat_message_id;

            return (
              <LlmModelTurn key={message.llm_chat_message_id}>
                {isAnimating ? (
                  <LlmTypewriter
                    text={message.content}
                    onTick={() => scrollToBottom('auto')}
                    onDone={() => onAnimationDone?.()}
                  />
                ) : (
                  <LlmMarkdown text={message.content} />
                )}
              </LlmModelTurn>
            );
          })}

          {optimisticUser && <LlmUserTurn text={optimisticUser} />}

          {isThinking && (
            <LlmModelTurn>
              <LlmThinkingIndicator />
            </LlmModelTurn>
          )}

          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
};

export default LlmChatMessageList;
