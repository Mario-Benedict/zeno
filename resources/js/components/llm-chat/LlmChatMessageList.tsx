import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import type { LlmMessage } from '@/types/llm-chat';

// Allow a few extra inline formatting tags an LLM may emit as raw HTML
// (underline, highlight, sub/super-script) on top of the safe default schema.
// rehype-sanitize then strips everything else, so script/onclick/etc. can
// never reach the DOM even from a crafted model response.
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    'u',
    'ins',
    'mark',
    'sub',
    'sup',
  ],
};

const REMARK_PLUGINS = [remarkGfm];
const REHYPE_PLUGINS = [rehypeRaw, [rehypeSanitize, sanitizeSchema]] as const;

interface Props {
  messages: LlmMessage[];
  /** Question text shown as an optimistic user bubble while waiting for the API. */
  optimisticUser?: string | null;
  /** When true, render the bouncing "thinking" dots after the user message. */
  isThinking?: boolean;
  /** ID of the message that should reveal with a typewriter effect (one at a time). */
  animatingId?: string | null;
  /** Fired when the typewriter completes for the current `animatingId`. */
  onAnimationDone?: () => void;
}

// ─── Markdown renderer ──────────────────────────────────────────────────────

const Markdown = ({ text }: { text: string }) => (
  <div className="prose-chat">
    <ReactMarkdown
      remarkPlugins={REMARK_PLUGINS}
      rehypePlugins={REHYPE_PLUGINS as any}
    >
      {text}
    </ReactMarkdown>
  </div>
);

// ─── Thinking indicator — minimal left-aligned dots (no bubble) ─────────────

const ThinkingIndicator = () => (
  <div className="flex items-center gap-1.5 py-1 text-dark-secondary">
    <span className="llm-typing-dot inline-block h-2 w-2 rounded-full bg-current" />
    <span className="llm-typing-dot inline-block h-2 w-2 rounded-full bg-current" />
    <span className="llm-typing-dot inline-block h-2 w-2 rounded-full bg-current" />
  </div>
);

// ─── Typewriter — natural word-by-word reveal ───────────────────────────────

interface TypewriterProps {
  text: string;
  onTick: () => void;
  onDone: () => void;
}

/**
 * Compute a natural pause (ms) to wait *after* revealing `token`.
 *
 * Mimics how an LLM streams: a steady word cadence with slight jitter,
 * longer breaths after sentence/clause punctuation and line breaks.
 */
const delayAfter = (token: string): number => {
  const jitter = (base: number, spread: number) =>
    base + Math.random() * spread;

  const trimmed = token.trimEnd();
  const lastChar = trimmed.at(-1) ?? '';

  if (token.includes('\n\n')) return jitter(120, 90); // paragraph break
  if (token.includes('\n')) return jitter(70, 60); // line break
  if (/[.!?]["')\]]?$/.test(trimmed)) return jitter(120, 140); // sentence end
  if (/[,;:]$/.test(lastChar)) return jitter(70, 90); // clause pause

  // Longer words take a touch longer; short words fly by.
  const lengthFactor = Math.min(trimmed.length * 3, 30);

  return jitter(18 + lengthFactor, 28);
};

/**
 * Reveals `text` word-by-word into a ReactMarkdown renderer with variable
 * timing, producing the smooth "writing" feel of Gemini / ChatGPT / Claude
 * rather than a uniform mechanical typewriter.
 */
const Typewriter = ({ text, onTick, onDone }: TypewriterProps) => {
  const [shown, setShown] = useState('');

  useEffect(() => {
    // Split into tokens of "leading whitespace + word" so markdown structure
    // (spaces, newlines) is preserved exactly as we accumulate.
    const tokens = text.match(/\s*\S+|\s+/g) ?? [];

    let cursor = 0;
    let revealed = '';
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (tokens.length === 0) {
      onDone();

      return;
    }

    const tick = () => {
      if (cancelled) return;
      if (cursor >= tokens.length) {
        onDone();

        return;
      }

      revealed += tokens[cursor];
      cursor += 1;
      setShown(revealed);
      onTick();
      timer = setTimeout(tick, delayAfter(tokens[cursor - 1]));
    };

    timer = setTimeout(tick, 30);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
    // The animation should run exactly once per `text` (= per message).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return <Markdown text={shown} />;
};

// ─── Turn renderers ─────────────────────────────────────────────────────────

/** User turn — compact right-aligned bubble, like Gemini / ChatGPT. */
const UserTurn = ({ text }: { text: string }) => (
  <div className="flex justify-end">
    <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-dark-surface-3 px-4 py-2.5 text-sm leading-relaxed text-dark-primary">
      <p className="whitespace-pre-wrap">{text}</p>
    </div>
  </div>
);

/** Model turn — full-width document-style prose, no bubble. */
const ModelTurn = ({ children }: { children: React.ReactNode }) => (
  <div className="w-full text-sm leading-relaxed text-dark-primary">
    {children}
  </div>
);

// ─── Main ───────────────────────────────────────────────────────────────────

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

  // Smooth-scroll when message-list contents change (new turn, thinking toggle).
  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, optimisticUser, isThinking, scrollToBottom]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-dark-surface-3 hover:[&::-webkit-scrollbar-thumb]:bg-dark-secondary [&::-webkit-scrollbar-track]:bg-transparent">
      <div className="mx-auto w-full max-w-3xl py-6">
        <div className="space-y-6">
          {messages.map((msg) => {
            if (msg.role === 'user') {
              return (
                <UserTurn key={msg.llm_chat_message_id} text={msg.content} />
              );
            }

            const isAnimating = animatingId === msg.llm_chat_message_id;

            return (
              <ModelTurn key={msg.llm_chat_message_id}>
                {isAnimating ? (
                  <Typewriter
                    text={msg.content}
                    onTick={() => scrollToBottom('auto')}
                    onDone={() => onAnimationDone?.()}
                  />
                ) : (
                  <Markdown text={msg.content} />
                )}
              </ModelTurn>
            );
          })}

          {/* Optimistic user message — shown the instant the user hits Send. */}
          {optimisticUser && <UserTurn text={optimisticUser} />}

          {/* Bouncing dots — shown until the model reply arrives. */}
          {isThinking && (
            <ModelTurn>
              <ThinkingIndicator />
            </ModelTurn>
          )}

          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
};

export default LlmChatMessageList;
