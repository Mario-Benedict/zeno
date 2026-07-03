import React from 'react';

interface DeleteNoteDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteNoteDialog = ({ onConfirm, onCancel }: DeleteNoteDialogProps): React.ReactElement => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
    <div className="flex w-[360px] flex-col gap-4 rounded-xl bg-dark-surface-2 p-6">
      <h3 className="m-0 text-h5 font-bold text-dark-primary">Delete note?</h3>
      <p className="m-0 text-normal text-dark-secondary">This note will be moved to Trash. You can restore it later.</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="cursor-pointer rounded-lg border border-dark-surface-3 bg-transparent px-4 py-2 text-small text-dark-primary"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="cursor-pointer rounded-lg border-none bg-status-error px-4 py-2 text-small font-bold text-white"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

export default DeleteNoteDialog;
