import type { TranslationKey } from '@/i18n/dictionary';

export type ProjectSearchKind =
  | 'navigation'
  | 'board'
  | 'card'
  | 'chat'
  | 'message'
  | 'note'
  | 'calendar'
  | 'reminder';

export interface ProjectSearchResult {
  id: string;
  kind: ProjectSearchKind;
  title: string | null;
  title_key: TranslationKey | null;
  context: string | null;
  href: string;
}

export interface GlobalSearchPayload {
  query: string;
  results: ProjectSearchResult[];
}
