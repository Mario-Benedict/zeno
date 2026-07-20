import TemplateCard from '@/components/dashboard/TemplateCard';
import { useTranslation } from '@/hooks/useTranslation';
import { TEMPLATES } from './templates';
import type { TemplateId } from './templates';

interface Props {
  onSelect: (id: TemplateId) => void;
}

export const TemplatePicker = ({ onSelect }: Props) => {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 overflow-y-auto px-8 py-10">
      <div className="text-center">
        <h1 className="text-large font-bold text-dark-primary">
          {t('dashboard.chooseLayoutTitle')}
        </h1>
        <p className="mt-1 text-small text-dark-secondary">
          {t('dashboard.chooseLayoutSubtitle')}
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
};
