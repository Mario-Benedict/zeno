import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface DeleteNoteDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteNoteDialog = ({
  onConfirm,
  onCancel,
}: DeleteNoteDialogProps): React.ReactElement => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="flex w-[360px] flex-col gap-4 rounded-xl bg-dark-surface-2 p-6">
        <h3 className="m-0 text-h5 font-bold text-dark-primary">
          {t('notes.deleteNoteConfirmTitle')}
        </h3>
        <p className="m-0 text-normal text-dark-secondary">
          {t('notes.deleteNoteConfirmBody')}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="cursor-pointer rounded-lg border border-dark-surface-3 bg-transparent px-4 py-2 text-small text-dark-primary"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="cursor-pointer rounded-lg border-none bg-status-error px-4 py-2 text-small font-bold text-white"
          >
            {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteNoteDialog;
