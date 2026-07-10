export type TemplateId = '3a' | '4a' | '4b' | '5a' | '5b';

export interface DashboardTemplate {
  id: TemplateId;
  slots: number;
  /** Tailwind classes for the outer grid container */
  gridClass: string;
  /** Tailwind classes for each slot div, indexed by slot position */
  slotClasses: string[];
}

/**
 * All available dashboard layout templates.
 * To add a new template: append an entry here — no other changes required.
 */
export const TEMPLATES: DashboardTemplate[] = [
  {
    id: '3a',
    slots: 3,
    gridClass: 'grid-cols-3 grid-rows-2',
    slotClasses: [
      'col-span-2 row-span-2', // large left
      '', // top-right
      '', // bottom-right
    ],
  },
  {
    id: '4a',
    slots: 4,
    gridClass: 'grid-cols-2 grid-rows-2',
    slotClasses: ['', '', '', ''],
  },
  {
    id: '4b',
    slots: 4,
    gridClass: 'grid-cols-3 grid-rows-2',
    slotClasses: [
      'col-span-3', // full-width top
      '', // bottom-left
      '', // bottom-center
      '', // bottom-right
    ],
  },
  {
    id: '5a',
    slots: 5,
    gridClass: 'grid-cols-3 grid-rows-2',
    slotClasses: [
      'col-span-1 row-span-2', // tall left
      '', // top-center
      '', // top-right
      '', // bottom-center
      '', // bottom-right
    ],
  },
  {
    id: '5b',
    slots: 5,
    gridClass: 'grid-cols-6 grid-rows-2',
    slotClasses: [
      'col-span-3', // top-left half
      'col-span-3', // top-right half
      'col-span-2', // bottom-left third
      'col-span-2', // bottom-center third
      'col-span-2', // bottom-right third
    ],
  },
];

export const getTemplate = (id: TemplateId): DashboardTemplate =>
  TEMPLATES.find((t) => t.id === id)!;
