export type HeadingTag = 'H1' | 'H2' | 'H3' | 'H4' | 'H5' | 'H6';
export type AlignCommand = 'justifyLeft' | 'justifyCenter' | 'justifyRight' | 'justifyFull';

export interface NoteContent {
    html: string;
    text: string;
    embedUrl?: string | null;
    embedTitle?: string | null;
}

interface CollaboratorUser {
    id: string;
    name: string;
    role: 'Editor' | 'Viewer Only';
    avatarUrl?: string;
    email: string;
}

export interface NoteItem {
    id: string;
    title: string;
    content: NoteContent | null;
    timeAgo?: string;
    is_shared: boolean;
    collaborators?: CollaboratorUser[]; // Validated strict type contract for SharedEditorPanel
}

export interface PersonalNotesProps {
    projectSlug: string;
    initialNotes: NoteItem[];
}

export interface EmbedProvider {
    id: string;
    label: string;
    matcher: (url: string) => boolean;
    getEmbedUrl?: (url: string) => string;
    renderIcon: () => React.ReactElement;
}