import { router } from '@inertiajs/react';
import React, { useState } from 'react';
import type { CollaboratorUser } from './types';

export interface PresenceUser {
    id: number;
    name: string;
}

interface CollaboratorsPanelProps {
    noteId: string | null;
    projectSlug: string;
    collaborators: CollaboratorUser[];
    activeOnlineUsers: PresenceUser[];
    isOwner: boolean;
}

const CollaboratorsPanel = ({ 
    noteId,
    projectSlug,
    collaborators, 
    activeOnlineUsers = [],
    isOwner
}: CollaboratorsPanelProps): React.ReactElement => {
    const bgColors = ['bg-accent-red', 'bg-accent-orange', 'bg-accent-blue', 'bg-accent-purple', 'bg-status-success'];
    
    const [showAddForm, setShowAddForm] = useState(false);
    const [targetUserId, setTargetUserId] = useState('');
    const [canEdit, setCanEdit] = useState('1');

    const handleAddCollaborator = () => {
        if (!targetUserId || !noteId) return;

        router.post(`/p/${projectSlug}/notes/${noteId}/collaborators`, {
            user_id: parseInt(targetUserId, 10),
            can_edit: canEdit === '1'
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setTargetUserId('');
                setShowAddForm(false);
            },
            onError: (errors) => {
                alert(errors.user_id || 'Gagal menambahkan kolaborator.');
            }
        });
    };

    const handleRemoveCollaborator = (userId: number) => {
        if (!noteId) return;
        router.delete(`/p/${projectSlug}/notes/${noteId}/collaborators/${userId}`, {
            preserveScroll: true,
        });
    };

    const handleChangeRole = (userId: number, newCanEdit: boolean) => {
        if (!noteId) return;
        router.patch(`/p/${projectSlug}/notes/${noteId}/collaborators/${userId}`, {
            can_edit: newCanEdit
        }, { preserveScroll: true });
    };

    return (
        <div className="flex h-full items-stretch shrink-0 select-none font-sans">
            <div className="w-[2px] self-stretch bg-dark-border rounded-[24px] shrink-0 opacity-40 mx-1" />

            <aside className="w-[140px] shrink-0 bg-transparent flex flex-col items-center box-border overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pt-4 pb-4">
                <div className="w-full flex flex-col items-center justify-center mb-3 shrink-0 gap-2 px-2">
                    <span className="text-dark-secondary font-bold text-[11px] tracking-tight block text-center">
                        Collaborators
                    </span>

                    {isOwner && (
                        <button
                            onClick={() => setShowAddForm(!showAddForm)}
                            title="Invite Collaborator"
                            className="w-8 h-8 rounded-full bg-dark-surface-3 border border-dark-border flex items-center justify-center text-dark-secondary hover:bg-dark-surface-1 hover:text-white transition-all cursor-pointer"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                        </button>
                    )}
                </div>

                {isOwner && showAddForm && (
                    <div className="bg-dark-surface-3 p-2 rounded-lg border border-dark-border mb-3 flex flex-col gap-1.5 w-[120px] box-border">
                        <input
                            type="number"
                            placeholder="User ID"
                            value={targetUserId}
                            onChange={(e) => setTargetUserId(e.target.value)}
                            className="w-full bg-dark-surface-2 border border-dark-border rounded p-1 text-[11px] text-white outline-none"
                        />
                        <select
                            value={canEdit}
                            onChange={(e) => setCanEdit(e.target.value)}
                            className="w-full bg-dark-surface-2 border border-dark-border rounded p-1 text-[10px] text-dark-secondary outline-none"
                        >
                            <option value="1">Editor</option>
                            <option value="0">Viewer Only</option>
                        </select>
                        <button
                            onClick={handleAddCollaborator}
                            className="w-full bg-status-success text-white font-bold text-[10px] py-1 border-none rounded cursor-pointer hover:opacity-90"
                        >
                            Invite
                        </button>
                    </div>
                )}

                <div className="flex flex-col gap-3 items-center w-full px-2 box-border">
                    {collaborators.map((user, index) => {
                        const firstLetter = user.name.charAt(0).toUpperCase();
                        const assignedBg = bgColors[index % bgColors.length];
                        const isOnline = activeOnlineUsers.some((u) => u.id === user.id);

                        return (
                            <div key={user.id} className="flex flex-col items-center w-full text-center relative">
                                <div className={`w-[48px] h-[48px] rounded-full border-2 flex items-center justify-center overflow-hidden shrink-0 transition-colors ${
                                    isOnline ? 'border-status-success' : 'border-dark-border'
                                }`}>
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className={`w-full h-full ${assignedBg} flex items-center justify-center`}>
                                            <span className="text-white font-bold text-normal">{firstLetter}</span>
                                        </div>
                                    )}
                                </div>

                                {isOnline && (
                                    <span className="absolute right-6 top-8 w-2.5 h-2.5 bg-status-success rounded-full border border-dark-surface-2 animate-pulse" />
                                )}

                                <p className="text-dark-primary font-medium text-xsmall leading-[14px] m-0 mt-1 w-full truncate px-0.5">
                                    {user.name}
                                </p>
                                <p className="text-dark-secondary font-normal text-[10px] leading-[12px] m-0 w-full truncate">
                                    {user.role === 'Editor' ? 'editor' : 'viewer'}
                                </p>

                                {isOwner && (
                                    <div className="flex gap-1 mt-1">
                                        <button
                                            onClick={() => handleChangeRole(user.id, user.role !== 'Editor')}
                                            title={user.role === 'Editor' ? 'Set to Viewer' : 'Set to Editor'}
                                            className="text-[9px] text-dark-secondary hover:text-white px-1 py-0.5 rounded bg-dark-surface-3 transition-colors"
                                        >
                                            {user.role === 'Editor' ? '→viewer' : '→editor'}
                                        </button>
                                        <button
                                            onClick={() => handleRemoveCollaborator(user.id)}
                                            title="Remove"
                                            className="text-[9px] text-status-error hover:opacity-70 px-1 py-0.5 rounded bg-dark-surface-3 transition-colors"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </aside>
        </div>
    );
};

export default CollaboratorsPanel;