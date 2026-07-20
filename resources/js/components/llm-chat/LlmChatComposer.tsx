import { useEffect, useRef } from 'react';
import type { KeyboardEvent, SyntheticEvent } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import SendIcon from '@public/icons/small/arrow_up.svg';
import SpinnerIconSvg from '@public/icons/small/spinner.svg';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: SyntheticEvent) => void;
  disabled: boolean;
}

const SpinnerIcon = () => <SpinnerIconSvg className="animate-spin" />;

const LlmChatComposer = ({ value, onChange, onSubmit, disabled }: Props) => {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset height when value is cleared after send.
  useEffect(() => {
    if (value === '' && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value]);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSubmit(e);
      }
    }
  };

  const canSend = !disabled && value.trim().length > 0;

  return (
    <div className="shrink-0 px-3 pt-1 pb-3">
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 rounded-xl border border-dark-border bg-dark-surface-3 px-3 py-2"
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            adjustHeight();
          }}
          onKeyDown={handleKeyDown}
          placeholder={t('llmChat.askAnything')}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent py-0.5 text-small leading-normal text-dark-primary placeholder:text-dark-secondary focus:outline-none disabled:opacity-50"
          style={{ minHeight: '22px', maxHeight: '120px' }}
        />

        <button
          type="submit"
          disabled={!canSend}
          className={[
            'mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all',
            canSend
              ? 'bg-accent-blue text-white hover:opacity-90 active:scale-95'
              : 'cursor-not-allowed bg-dark-surface-2 text-dark-secondary',
          ].join(' ')}
        >
          {disabled ? <SpinnerIcon /> : <SendIcon />}
        </button>
      </form>
    </div>
  );
};

export default LlmChatComposer;
