import { WidgetPicker } from '@/components/dashboard/WidgetPicker';
import { useTranslation } from '@/hooks/useTranslation';
import PlusIcon from '@public/icons/small/plus.svg';
import type { WidgetId } from './widgets';

interface Props {
  index: number;
  pickerOpen: boolean;
  onOpenPicker: () => void;
  onClosePicker: () => void;
  onSelect: (widgetId: WidgetId) => void;
}

const DashboardEmptySlot = ({
  index,
  pickerOpen,
  onOpenPicker,
  onClosePicker,
  onSelect,
}: Props) => {
  const { t } = useTranslation();

  if (pickerOpen) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-dark-surface-3 bg-dark-surface-2 transition-colors hover:border-dark-secondary/40 hover:bg-dark-surface-3">
        <WidgetPicker onSelect={onSelect} onClose={onClosePicker} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpenPicker}
      className="flex h-full min-h-0 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-dark-surface-3 bg-dark-surface-2 text-dark-secondary transition-colors hover:border-dark-secondary/40 hover:bg-dark-surface-3 hover:text-dark-primary"
      aria-label={t('dashboard.addWidget', { index: index + 1 })}
    >
      <PlusIcon className="h-6 w-6" />
      <span className="text-xsmall font-medium">
        {t('dashboard.addWidgetLabel')}
      </span>
    </button>
  );
};

export default DashboardEmptySlot;
