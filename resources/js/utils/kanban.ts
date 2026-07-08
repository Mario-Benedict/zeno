import type { TranslationKey } from '@/i18n/dictionary';
import type { KanbanBoardCardChecklist } from '@/types/kanban';

// ─── Display helpers ─────────────────────────────────────────────────────────

export const generateInitials = (name: string | null | undefined): string => {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);

  return (
    parts
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join('') || '?'
  );
};

// ─── Color palettes ──────────────────────────────────────────────────────────

export const MEMBER_COLORS = [
  '#8E24AA',
  '#F57C00',
  '#00897B',
  '#D32F2F',
  '#3949AB',
];

export const LABEL_COLORS: {
  id: string;
  hex: string;
  labelKey: TranslationKey;
}[] = [
  { id: 'red', hex: '#D32F2F', labelKey: 'kanban.colorRed' },
  { id: 'orange', hex: '#F57C00', labelKey: 'kanban.colorOrange' },
  { id: 'yellow', hex: '#FBC02D', labelKey: 'kanban.colorYellow' },
  { id: 'lime', hex: '#7CB342', labelKey: 'kanban.colorLime' },
  { id: 'green', hex: '#00897B', labelKey: 'kanban.colorGreen' },
  { id: 'cyan', hex: '#0288D1', labelKey: 'kanban.colorCyan' },
  { id: 'blue', hex: '#3949AB', labelKey: 'kanban.colorBlue' },
  { id: 'purple', hex: '#8E24AA', labelKey: 'kanban.colorPurple' },
  { id: 'pink', hex: '#C2185B', labelKey: 'kanban.colorPink' },
  { id: 'brown', hex: '#8D6E63', labelKey: 'kanban.colorBrown' },
  { id: 'red-light', hex: '#FFB3B3', labelKey: 'kanban.colorRedLight' },
  {
    id: 'orange-light',
    hex: '#FFD1A1',
    labelKey: 'kanban.colorOrangeLight',
  },
  {
    id: 'yellow-light',
    hex: '#FFF0B3',
    labelKey: 'kanban.colorYellowLight',
  },
  { id: 'lime-light', hex: '#DCEDC8', labelKey: 'kanban.colorLimeLight' },
  { id: 'green-light', hex: '#B2DFDB', labelKey: 'kanban.colorGreenLight' },
  { id: 'cyan-light', hex: '#B3E5FC', labelKey: 'kanban.colorCyanLight' },
  { id: 'blue-light', hex: '#C5CAE9', labelKey: 'kanban.colorBlueLight' },
  {
    id: 'purple-light',
    hex: '#E1BEE7',
    labelKey: 'kanban.colorPurpleLight',
  },
  { id: 'pink-light', hex: '#F8BBD0', labelKey: 'kanban.colorPinkLight' },
  { id: 'brown-light', hex: '#D7CCC8', labelKey: 'kanban.colorBrownLight' },
];

// ─── Progress / formatting ───────────────────────────────────────────────────

export const calculateChecklistProgress = (
  checklists?: KanbanBoardCardChecklist[] | null,
): { done: number; total: number } => {
  if (!Array.isArray(checklists) || checklists.length === 0) {
    return { done: 0, total: 0 };
  }
  let total = 0;
  let done = 0;
  checklists.forEach((cl) => {
    if (Array.isArray(cl.items)) {
      total += cl.items.length;
      done += cl.items.filter((i) => i?.is_completed).length;
    }
  });

  return { done, total };
};

export const formatDate = (iso: string | null | undefined): string => {
  if (!iso || typeof iso !== 'string') return '';
  try {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return '';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

export const getContrastColor = (hexColor: string): string => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;

  return yiq >= 128 ? '#1A1A1A' : '#FFFFFF';
};
