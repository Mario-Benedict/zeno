import { CardDetailModal } from './CardDetailModal';
import type { CardDetailPanelProps } from './CardDetailModal';

interface Props extends CardDetailPanelProps {
  isOpen: boolean;
}

export const CardDetailModalWrapper = ({ isOpen, ...modalProps }: Props) => {
  if (!isOpen) return null;

  return <CardDetailModal {...modalProps} />;
};
