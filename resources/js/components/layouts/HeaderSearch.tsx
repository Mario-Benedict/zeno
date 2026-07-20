import { router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import SearchResultRow from '@/components/layouts/SearchResultRow';
import { useTranslation } from '@/hooks/useTranslation';
import SearchIcon from '@public/icons/small/search.svg';
import SpinnerIcon from '@public/icons/small/spinner.svg';

const HeaderSearch = () => {
  const { globalSearch, project } = usePage().props;
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestVersionRef = useRef(0);
  const normalizedQuery = query.trim();
  const projectId = project?.project_id;
  const results = useMemo(
    () =>
      globalSearch.query.trim().toLocaleLowerCase() ===
      normalizedQuery.toLocaleLowerCase()
        ? globalSearch.results
        : [],
    [globalSearch, normalizedQuery],
  );

  useEffect(() => {
    const onShortcut = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, [open]);

  useEffect(() => {
    const requestVersion = ++requestVersionRef.current;

    if (!projectId || normalizedQuery.length < 2) return;

    const timeout = window.setTimeout(() => {
      router.reload({
        data: { global_search: normalizedQuery },
        only: ['globalSearch'],
        preserveUrl: true,
        showProgress: false,
        onFinish: () => {
          if (requestVersionRef.current === requestVersion) setLoading(false);
        },
      });
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [normalizedQuery, projectId]);

  const closeSearch = () => {
    requestVersionRef.current += 1;
    setOpen(false);
    setQuery('');
    setLoading(false);
    setActiveIndex(0);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (results.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const result = results[activeIndex];
      if (result) {
        closeSearch();
        router.visit(result.href);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-96">
      <div className="flex h-8 w-full items-center rounded-full bg-dark-surface-2 px-3 transition-colors focus-within:bg-dark-surface-3">
        <span className="mr-3 flex shrink-0 items-center justify-center text-dark-secondary">
          {loading ? (
            <SpinnerIcon className="h-4 w-4 animate-spin" />
          ) : (
            <SearchIcon className="h-5 w-5" />
          )}
        </span>
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls="global-search-results"
          aria-autocomplete="list"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            const nextQuery = event.target.value;
            requestVersionRef.current += 1;
            setQuery(nextQuery);
            setLoading(Boolean(projectId) && nextQuery.trim().length >= 2);
            setActiveIndex(0);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={t('header.search')}
          aria-label={t('header.search')}
          className="min-w-0 flex-1 bg-transparent text-normal font-bold text-dark-primary outline-none placeholder:text-dark-secondary [&::-webkit-search-cancel-button]:hidden"
        />
        <span className="ml-2 hidden shrink-0 rounded border border-dark-border px-1.5 py-0.5 text-micro text-dark-secondary sm:inline">
          {t('header.searchShortcut')}
        </span>
      </div>

      {open && (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute top-full right-0 left-0 z-50 mt-2 max-h-[min(28rem,70dvh)] overflow-y-auto rounded-xl border border-dark-border bg-dark-surface-2 p-2 shadow-2xl"
        >
          {normalizedQuery.length < 2 ? (
            <p className="px-3 py-5 text-center text-xsmall text-dark-secondary">
              {t('header.searchHint')}
            </p>
          ) : loading && results.length === 0 ? (
            <p className="px-3 py-5 text-center text-xsmall text-dark-secondary">
              {t('header.searching')}
            </p>
          ) : results.length === 0 ? (
            <p className="px-3 py-5 text-center text-xsmall text-dark-secondary">
              {t('header.noSearchResults', { query: normalizedQuery })}
            </p>
          ) : (
            <div className="space-y-0.5">
              {results.map((result, index) => (
                <SearchResultRow
                  key={result.id}
                  result={result}
                  active={index === activeIndex}
                  onSelect={closeSearch}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HeaderSearch;
