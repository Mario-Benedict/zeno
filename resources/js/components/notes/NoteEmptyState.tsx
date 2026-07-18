import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import LockIcon from '@public/icons/small/lock.svg';

/** Shown in the editor panel when no note is selected. */
const NoteEmptyState = (): React.ReactElement => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex max-w-[480px] flex-col items-center gap-4 text-center select-none">
        <LockIcon
          className="h-16 w-16 text-dark-primary opacity-40"
          width={64}
          height={64}
        />

        <h3 className="m-0 font-sans text-h5 font-bold text-dark-primary">
          {t('notes.noNoteSelectedTitle')}
        </h3>

        <p className="m-0 font-sans text-normal leading-[22.4px] text-dark-primary opacity-60">
          {t('notes.noNoteSelectedBody')}
        </p>
      </div>
    </div>
  );
};

export default NoteEmptyState;
