import TemplatePreview from '@/components/dashboard/TemplatePreview';
import type {
  DashboardTemplate,
  TemplateId,
} from '@/components/dashboard/templates';
import { useTranslation } from '@/hooks/useTranslation';
import type { TranslationKey } from '@/i18n/dictionary';

interface Props {
  template: DashboardTemplate;
  onSelect: (id: TemplateId) => void;
}

const TEMPLATE_NAME_KEYS: Record<TemplateId, TranslationKey> = {
  '3a': 'dashboard.templateFocusName',
  '4a': 'dashboard.templateGridName',
  '4b': 'dashboard.templateOverviewName',
  '5a': 'dashboard.templateCommandName',
  '5b': 'dashboard.templateSpreadName',
};

const TEMPLATE_DESCRIPTION_KEYS: Record<TemplateId, TranslationKey> = {
  '3a': 'dashboard.templateFocusDescription',
  '4a': 'dashboard.templateGridDescription',
  '4b': 'dashboard.templateOverviewDescription',
  '5a': 'dashboard.templateCommandDescription',
  '5b': 'dashboard.templateSpreadDescription',
};

const TemplateCard = ({ template, onSelect }: Props) => {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={() => onSelect(template.id)}
      className="group flex flex-col gap-3 rounded-2xl border-2 border-transparent bg-dark-surface-2 p-4 text-left transition-all hover:border-accent-blue/50 hover:bg-dark-surface-3"
    >
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-dark-surface-3 p-2 transition-colors group-hover:bg-dark-surface-1">
        <TemplatePreview template={template} />
      </div>

      <div>
        <p className="text-medium font-semibold text-dark-primary">
          {t(TEMPLATE_NAME_KEYS[template.id])}
        </p>
        <p className="text-xsmall text-dark-secondary">
          {t(TEMPLATE_DESCRIPTION_KEYS[template.id])}
        </p>
      </div>
    </button>
  );
};

export default TemplateCard;
