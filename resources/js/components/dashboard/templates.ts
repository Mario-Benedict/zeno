export type TemplateId = '3a' | '4a' | '4b' | '5a' | '5b';

export interface DashboardTemplate {
  id: TemplateId;
  name: string;
  description: string;
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
    name: 'Focus',
    description: '1 main · 2 side',
    slots: 3,
    gridClass: 'grid-cols-3 grid-rows-2',
    slotClasses: [
      'col-span-2 row-span-2', // large left
      '',                       // top-right
      '',                       // bottom-right
    ],
  },
  {
    id: '4a',
    name: 'Grid',
    description: '2 × 2 equal',
    slots: 4,
    gridClass: 'grid-cols-2 grid-rows-2',
    slotClasses: ['', '', '', ''],
  },
  {
    id: '4b',
    name: 'Overview',
    description: '1 wide top · 3 bottom',
    slots: 4,
    gridClass: 'grid-cols-3 grid-rows-2',
    slotClasses: [
      'col-span-3', // full-width top
      '',           // bottom-left
      '',           // bottom-center
      '',           // bottom-right
    ],
  },
  {
    id: '5a',
    name: 'Command',
    description: '1 main · 2 × 2 side',
    slots: 5,
    gridClass: 'grid-cols-3 grid-rows-2',
    slotClasses: [
      'col-span-1 row-span-2', // tall left
      '',                       // top-center
      '',                       // top-right
      '',                       // bottom-center
      '',                       // bottom-right
    ],
  },
  {
    id: '5b',
    name: 'Spread',
    description: '2 top · 3 bottom',
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
