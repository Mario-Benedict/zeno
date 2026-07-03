import { getTemplate } from './templates';
import type { TemplateId } from './templates';

interface Props {
  templateId: TemplateId;
  onChangeLayout: () => void;
}

const PlusIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const EmptySlot = ({ index }: { index: number }) => (
  <div className="flex h-full min-h-0 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-dark-surface-3 bg-dark-surface-2 transition-colors hover:border-dark-secondary/40 hover:bg-dark-surface-3">
    <button
      type="button"
      className="flex flex-col items-center gap-2 rounded-xl p-6 text-dark-secondary transition hover:text-dark-primary"
      aria-label={`Add widget to slot ${index + 1}`}
    >
      <PlusIcon />
      <span className="text-xsmall font-medium">Add widget</span>
    </button>
  </div>
);

export const DashboardGrid = ({ templateId, onChangeLayout }: Props) => {
  const template = getTemplate(templateId);

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-small font-semibold text-dark-primary">
            Dashboard
          </span>
          <span className="rounded-full bg-dark-surface-3 px-2 py-0.5 text-xsmall text-dark-secondary">
            {template.name}
          </span>
        </div>

        <button
          type="button"
          onClick={onChangeLayout}
          className="rounded-lg px-3 py-1.5 text-xsmall font-medium text-dark-secondary transition hover:bg-dark-surface-3 hover:text-dark-primary"
        >
          Change layout
        </button>
      </div>

      {/* Grid */}
      <div className={`grid min-h-0 flex-1 gap-3 ${template.gridClass}`}>
        {template.slotClasses.map((cls, i) => (
          <div key={i} className={cls}>
            <EmptySlot index={i} />
          </div>
        ))}
      </div>
    </div>
  );
};
