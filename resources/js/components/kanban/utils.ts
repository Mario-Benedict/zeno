import { KanbanBoardCardChecklist } from './types';

export const generateInitials = (name: string | null | undefined): string => {
    if (!name || typeof name !== 'string') return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((n) => n[0]?.toUpperCase()).join('') || '?';
};

export const MEMBER_COLORS = ['#8E24AA', '#F57C00', '#00897B', '#D32F2F', '#3949AB'];

export const LABEL_COLORS: { name: string; hex: string }[] = [
    { name: 'red',          hex: '#D32F2F' },
    { name: 'orange',       hex: '#F57C00' },
    { name: 'yellow',       hex: '#FBC02D' },
    { name: 'lime',         hex: '#7CB342' },
    { name: 'green',        hex: '#00897B' },
    { name: 'cyan',         hex: '#0288D1' },
    { name: 'blue',         hex: '#3949AB' },
    { name: 'purple',       hex: '#8E24AA' },
    { name: 'pink',         hex: '#C2185B' },
    { name: 'brown',        hex: '#8D6E63' },
    { name: 'red-light',    hex: '#FFB3B3' },
    { name: 'orange-light', hex: '#FFD1A1' },
    { name: 'yellow-light', hex: '#FFF0B3' },
    { name: 'lime-light',   hex: '#DCEDC8' },
    { name: 'green-light',  hex: '#B2DFDB' },
    { name: 'cyan-light',   hex: '#B3E5FC' },
    { name: 'blue-light',   hex: '#C5CAE9' },
    { name: 'purple-light', hex: '#E1BEE7' },
    { name: 'pink-light',   hex: '#F8BBD0' },
    { name: 'brown-light',  hex: '#D7CCC8' },
];

export const calculateChecklistProgress = (
    checklists?: KanbanBoardCardChecklist[] | null
): { done: number; total: number } => {
    if (!Array.isArray(checklists) || checklists.length === 0) return { done: 0, total: 0 };
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
