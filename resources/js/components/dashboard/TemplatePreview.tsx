import type { DashboardTemplate } from '@/components/dashboard/templates';

interface Props {
  template: DashboardTemplate;
}

const TemplatePreview = ({ template }: Props) => (
  <div className={`grid h-full w-full gap-1 ${template.gridClass}`}>
    {template.slotClasses.map((className, index) => (
      <div
        key={index}
        className={`rounded-sm bg-accent-blue/25 ${className}`}
      />
    ))}
  </div>
);

export default TemplatePreview;
