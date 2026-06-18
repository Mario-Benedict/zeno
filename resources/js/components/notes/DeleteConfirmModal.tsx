import React from 'react';

interface DeleteConfirmModalProps {
    onConfirm: () => void;
    onCancel: () => void;
}

const DeleteConfirmModal = ({ onConfirm, onCancel }: DeleteConfirmModalProps): React.ReactElement => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="w-[360px] bg-dark-surface-2 rounded-xl p-6 flex flex-col gap-4">
            <h3 className="text-dark-primary font-bold text-h5 m-0">
                Delete Note?
            </h3>
            <p className="text-dark-secondary text-normal m-0">
                This note will be moved to Trash. You can restore it later.
            </p>
            <div className="flex justify-end gap-3">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 rounded-lg border border-dark-surface-3 bg-transparent text-dark-primary text-small cursor-pointer"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    className="px-4 py-2 rounded-lg border-none bg-status-error text-white text-small font-bold cursor-pointer"
                >
                    Delete
                </button>
            </div>
        </div>
    </div>
);

export default DeleteConfirmModal;