import { useEffect, useState } from 'react';
import LlmMarkdown from '@/components/llm-chat/LlmMarkdown';

interface Props {
  text: string;
  onTick: () => void;
  onDone: () => void;
}

const delayAfter = (token: string): number => {
  const jitter = (base: number, spread: number) =>
    base + Math.random() * spread;

  const trimmed = token.trimEnd();
  const lastChar = trimmed.at(-1) ?? '';

  if (token.includes('\n\n')) return jitter(120, 90);
  if (token.includes('\n')) return jitter(70, 60);
  if (/[.!?]["')\]]?$/.test(trimmed)) return jitter(120, 140);
  if (/[,;:]$/.test(lastChar)) return jitter(70, 90);

  return jitter(18 + Math.min(trimmed.length * 3, 30), 28);
};

const LlmTypewriter = ({ text, onTick, onDone }: Props) => {
  const [shown, setShown] = useState('');

  useEffect(() => {
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
    // The animation intentionally restarts only when a new message text arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return <LlmMarkdown text={shown} />;
};

export default LlmTypewriter;
