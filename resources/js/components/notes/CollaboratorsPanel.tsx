import React, { useState } from 'react';
import { router } from '@inertiajs/react';

const getProjectSlugFromUrl = () => {
    const pathSegments = window.location.pathname.split('/');
    const pIndex = pathSegments.indexOf('p');
    return pIndex !== -1 ? pathSegments[pIndex + 1] : 'zeno';
};

export interface PresenceUser {
    id: number;
    name: string;
}

interface CollaboratorUser {
    id: string;
    name: string;
    role: 'Editor' | 'Viewer Only';
    avatarUrl?: string;
    email: string;
}

interface CollaboratorsPanelProps {
    collaborators: CollaboratorUser[];
    activeOnlineUsers: PresenceUser[];
}

const CollaboratorsPanel = ({ collaborators, activeOnlineUsers = [] }: CollaboratorsPanelProps): React.ReactElement => {
    const bgColors = ['bg-accent-red', 'bg-accent-orange', 'bg-accent-blue', 'bg-accent-purple', 'bg-status-success'];
    
    // State untuk memunculkan input box add orang mini
    const [showAddForm, setShowAddForm] = useState(false);
    const [targetUserId, setTargetUserId] = useState('');
    const [canEdit, setCanEdit] = useState('1'); // 1 = Editor, 0 = Viewer Only

    const handleAddCollaboratorSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetUserId) return;

        const projectSlug = getProjectSlugFromUrl();
        // Mengambil ID Note aktif yang tertera di URL parameters ?noteId=xxx
        const urlParams = new URLSearchParams(window.location.search);
        const currentNoteId = urlParams.get('noteId');

        if (!currentNoteId) {
            alert('Silakan pilih atau buat catatan shared terlebih dahulu di panel kiri!');
            return;
        }

        // Tembak langsung ke fungsi STORE NoteCollaboratorController kelompokmu!
        router.post(`/p/${projectSlug}/notes/${currentNoteId}/collaborators`, {
            user_id: targetUserId,
            can_edit: canEdit === '1'
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setTargetUserId('');
                setShowAddForm(false);
            },
            onError: (errors) => {
                alert(errors.user_id || 'Gagal menambahkan kolaborator. Pastikan User ID terdaftar dan merupakan member project!');
            }
        });
    };

    return (
        <div className="flex h-full items-stretch shrink-0 select-none font-sans">
            <div className="w-[2px] h-full bg-dark-border rounded-[24px] shrink-0 opacity-40 mx-1" />

            <aside className="w-[100px] shrink-0 bg-transparent flex flex-col items-center box-border overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pt-4">
                <div className="w-full flex flex-col items-center justify-center mb-[12px] shrink-0 gap-2">
                    <span className="text-dark-secondary font-bold text-[11px] tracking-tight block text-center">
                        Collaborators
                    </span>
                    
                    {/* BUTTON (+) INTERAKTIF BARU UNTUK ADD MEMBER */}
                    <button 
                        onClick={() => setShowAddForm(!showAddForm)}
                        title="Invite Collaborator"
                        className="w-8 h-8 rounded-full bg-dark-surface-3 border border-dark-border flex items-center justify-center text-dark-secondary hover:bg-dark-surface-1 hover:text-white transition-colors duration-150"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </button>
                </div>

                {/* FORM POPUP MINI UNTUK ADD USER BERDASARKAN ID DATABASE */}
                {showAddForm && (
                    <form onSubmit={handleAddCollaboratorSubmit} className="bg-dark-surface-3 p-2 rounded-lg border border-dark-border mb-3 flex flex-col gap-1.5 w-[90px] box-border">
                        <input 
                            type="text" 
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
                            <option value="0">Viewer</option>
                        </select>
                        <button type="submit" className="w-full bg-status-success text-white font-bold text-[10px] py-1 border-none rounded cursor-pointer hover:opacity-90">
                            Invite
                        </button>
                    </form>
                )}
                
                <div className="flex flex-col gap-[12px] items-center w-full px-1 box-border">
                    {collaborators.map((user, index) => {
                        const firstLetter = user.name.charAt(0).toUpperCase();
                        const assignedBg = bgColors[index % bgColors.length];

                        const isOnline = activeOnlineUsers.some(
                            (onlineUser) => String(onlineUser.name).toLowerCase() === user.name.toLowerCase()
                        );

                        return (
                            <div key={user.id} className="flex flex-col items-center w-full text-center relative">
                                <div className={`w-[48px] h-[48px] rounded-full border-2 flex items-center justify-center overflow-hidden shrink-0 pointer-events-none transition-colors ${
                                    isOnline ? 'border-status-success' : 'border-dark-border'
                                }`}>
                                    {user.avatarUrl ? (
                                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className={`w-full h-full ${assignedBg} flex items-center justify-center`}>
                                            <span className="text-white font-bold text-normal">
                                                {firstLetter}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {isOnline && (
                                    <span className="absolute right-3 top-8 w-2.5 h-2.5 bg-status-success rounded-full border border-dark-surface-2 animate-pulse" />
                                )}

                                <p className="text-dark-primary font-medium text-xsmall leading-[14px] m-0 mt-1 w-full truncate px-0.5 lowercase">
                                    {user.name}
                                </p>
                                <p className="text-dark-secondary font-normal text-[10px] leading-[10px] m-0 w-full truncate lowercase">
                                    ({user.role === 'Editor' ? 'editor' : 'viewer'})
                                </p>
                            </div>
                        );
                    })}
                </div>
            </aside>
        </div>
    );
};

export default CollaboratorsPanel;