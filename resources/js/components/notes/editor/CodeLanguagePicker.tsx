import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import ChevronDownIcon from '@public/icons/small/chevron_down.svg';
import { CODE_LANGUAGES } from './codeLanguages';

interface CodeLanguagePickerProps {
  language: string;
  editable: boolean;
  onChange: (value: string) => void;
}

/** Searchable language selector for a code block. */
const CodeLanguagePicker = ({
  language,
  editable,
  onChange,
}: CodeLanguagePickerProps): React.ReactElement => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const languageLabel = useCallback(
    (languageOption: (typeof CODE_LANGUAGES)[number]) =>
      t(languageOption.labelKey),
    [t],
  );

  const current =
    CODE_LANGUAGES.find((item) => item.value === language) ?? CODE_LANGUAGES[0];

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return normalizedQuery
      ? CODE_LANGUAGES.filter((item) =>
          languageLabel(item).toLowerCase().includes(normalizedQuery),
        )
      : CODE_LANGUAGES;
  }, [languageLabel, query]);

  if (!editable) {
    return (
      <span className="px-1.5 py-0.5 text-xsmall font-medium text-dark-secondary">
        {languageLabel(current)}
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xsmall font-medium text-dark-secondary hover:bg-dark-surface-3 hover:text-dark-primary"
      >
        {languageLabel(current)}
        <ChevronDownIcon className="h-2.5 w-2.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-20 mt-1 w-48 overflow-hidden rounded-lg border border-dark-border bg-dark-surface-2 shadow-lg">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('notes.searchLanguagePlaceholder')}
              className="w-full border-b border-dark-border bg-transparent px-2 py-1.5 text-xsmall text-dark-primary outline-none placeholder:text-dark-secondary"
            />
            <div className="scrollbar-app max-h-56 overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <p className="px-2 py-1.5 text-xsmall text-dark-secondary">
                  {t('notes.noLanguageMatches')}
                </p>
              ) : (
                filtered.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      onChange(item.value);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`block w-full rounded-md px-2 py-1 text-left text-xsmall ${
                      item.value === language
                        ? 'bg-dark-surface-3 text-dark-primary'
                        : 'text-dark-secondary hover:bg-dark-surface-3 hover:text-dark-primary'
                    }`}
                  >
                    {languageLabel(item)}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CodeLanguagePicker;
