import { TEMPLATES } from './templates';
import type { TemplateId, DashboardTemplate } from './templates';

interface Props {
  onSelect: (id: TemplateId) => void;
}

const TemplatePreview = ({ template }: { template: DashboardTemplate }) => (
  <div className={`grid h-full w-full gap-1 ${template.gridClass}`}>
    {template.slotClasses.map((cls, i) => (
      <div
        key={i}
        className={`rounded-sm bg-accent-blue/25 ${cls}`}
      />
    ))}
  </div>
);

const TemplateCard = ({
  template,
  onSelect,
}: {
  template: DashboardTemplate;
  onSelect: (id: TemplateId) => void;
}) => (
  <button
    type="button"
    onClick={() => onSelect(template.id)}
    className="group flex flex-col gap-3 rounded-2xl border-2 border-transparent bg-dark-surface-2 p-4 text-left transition-all hover:border-accent-blue/50 hover:bg-dark-surface-3"
  >
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-dark-surface-3 p-2 transition-colors group-hover:bg-dark-surface-1">
      <TemplatePreview template={template} />
    </div>

    <div>
      <p className="text-medium font-semibold text-dark-primary">{template.name}</p>
      <p className="text-xsmall text-dark-secondary">{template.description}</p>
    </div>
  </button>
);

export const TemplatePicker = ({ onSelect }: Props) => (
  <div className="flex h-full flex-col items-center justify-center gap-8 overflow-y-auto px-8 py-10">
    <div className="text-center">
      <h1 className="text-large font-bold text-dark-primary">
        Choose a dashboard layout
      </h1>
      <p className="mt-1 text-small text-dark-secondary">
        Pick a template to get started. You can change it any time.
      </p>
    </div>

    <div className="grid w-full max-w-4xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {TEMPLATES.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          onSelect={onSelect}
        />
      ))}
    </div>
  </div>
);
