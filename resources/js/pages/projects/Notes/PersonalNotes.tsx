/**
 * @file PersonalNotes.tsx
 * @description Personal notes page for the logged-in user.
 *
 * Layout (Figma-exact):
 *  - Left panel  : 401 × 886 px, bg Surface-2 (#242424), border-radius 8px
 *  - Right panel : flex-1, bg Surface-2 (#242424), border-radius 8px
 *  - Note cards  : 369 × 74 px, active = Surface-1, inactive = Surface-3
 *  - Switcher    : 350 × 52 px, bg Surface-3, active tab = Surface-1
 *  - Toolbar     : fully functional via document.execCommand + contentEditable
 *
 * Features: Create · Update (title + rich-text content, auto-save on blur) · Delete (soft-delete)
 * All CRUD calls go through Inertia router – no raw fetch.
 *
 * Naming convention  : camelCase variables, PascalCase components, kebab-case CSS vars
 * Branch convention  : feat/personal-notes-ui-crud
 * Commit convention  : https://www.conventionalcommits.org/en/v1.0.0/
 */

import { Head, Link, router } from '@inertiajs/react';
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import Header from '@/components/layouts/Header';
import Sidebar from '@/components/layouts/Sidebar';

// ─── CSS-variable tokens (mirrors tailwind.config / design-system) ─────────────
//
//  --color-surface-1  : #111111
//  --color-surface-2  : #242424
//  --color-surface-3  : #2E2E2E
//  --color-primary    : #F0F0F0
//  --color-secondary  : #7B7B7B
//  --color-red-1      : #D32F2F
//  --color-error      : #EB5757
//
// We write them as string constants so they're easy to refactor to Tailwind
// classes later once the config is confirmed.

const COLOR = {
    surface1: 'var(--color-surface-1, #111111)',
    surface2: 'var(--color-surface-2, #242424)',
    surface3: 'var(--color-surface-3, #2E2E2E)',
    primary: 'var(--color-primary, #F0F0F0)',
    secondary: 'var(--color-secondary, #7B7B7B)',
    red1: 'var(--color-red-1, #D32F2F)',
    error: 'var(--color-error, #EB5757)',
    white: '#FFFFFF',
    overlayBg: 'rgba(0,0,0,0.60)',
    recentLabel: 'rgba(255,255,255,0.60)',
} as const;

const FONT = {
    figtree: 'Figtree, sans-serif',
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

/** Stored inside notes.content JSON column */
interface NoteContent {
    /** Raw HTML (from contentEditable editor) */
    html?: string;
    /** Legacy plain text – kept for backward compat */
    text?: string;
    embedUrl?: string;
    embedTitle?: string;
}

interface NoteItem {
    id: string;
    title: string;
    /** Human-readable relative time, e.g. "Last Updated: 5 min ago" */
    timeAgo?: string;
    content?: NoteContent | null;
    isShared: boolean;
    userId: string;
}

interface PersonalNotesProps {
    projectSlug: string;
    initialNotes: NoteItem[];
}

// ─── FormatCommand ────────────────────────────────────────────────────────────

type AlignCommand = 'justifyLeft' | 'justifyCenter' | 'justifyRight' | 'justifyFull';
type HeadingTag = 'H1' | 'H2' | 'H3' | 'H4' | 'H5' | 'H6' | 'P';

/** Wrapper around document.execCommand for the contentEditable editor */
const execFormat = (command: string, value?: string): void => {
    document.execCommand(command, false, value ?? '');
};

/**
 * Ensures the editor has focus before executing a command.
 * Bold/italic/underline work even without a selection — they toggle the
 * format for the current caret position (next typed characters will use it).
 * formatBlock (heading) also works on the current paragraph block.
 */
const execFormatSafe = (
    editorRef: React.RefObject<HTMLDivElement | null>,
    command: string,
    value?: string,
): boolean => {
    const editor = editorRef.current;
    if (!editor) return false;

    // If editor doesn't have focus, restore caret to end before executing
    if (!editor.contains(document.activeElement)) {
        editor.focus();
        // Place caret at end if nothing is selected inside
        const sel = window.getSelection();
        if (sel && sel.rangeCount === 0) {
            const range = document.createRange();
            range.selectNodeContents(editor);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }

    document.execCommand(command, false, value ?? '');
    return true;
};

// ─── Google Drive URL helper ──────────────────────────────────────────────────

const isGoogleDriveUrl = (url: string): boolean => /drive\.google\.com/.test(url);

const findDriveLinkInHtml = (html: string): string | null => {
    const pattern = /href=["']([^"']*drive\.google\.com[^"']*)["']/gi;
    const match = pattern.exec(html);
    if (match) return match[1];
    const bare = /https?:\/\/drive\.google\.com\/[^\s<"']+/gi.exec(html);
    return bare ? bare[0] : null;
};

// ─── YouTube URL helper ───────────────────────────────────────────────────────

/**
 * Extracts a YouTube video ID from common URL formats:
 *  - https://youtu.be/VIDEO_ID
 *  - https://www.youtube.com/watch?v=VIDEO_ID
 *  - https://www.youtube.com/embed/VIDEO_ID
 */
const extractYoutubeId = (url: string): string | null => {
    const patterns = [
        /youtu\.be\/([^?&\s]+)/,
        /youtube\.com\/watch\?(?:.*&)?v=([^&\s]+)/,
        /youtube\.com\/embed\/([^?&\s]+)/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
};

/**
 * Scans HTML string for YouTube links and returns the first video ID found.
 */
const findYoutubeIdInHtml = (html: string): string | null => {
    const anchorPattern = /href=["']([^"']*youtu[^"']+)["']/gi;
    let match: RegExpExecArray | null;
    while ((match = anchorPattern.exec(html)) !== null) {
        const id = extractYoutubeId(match[1]);
        if (id) return id;
    }
    // Also check bare URLs in text
    const barePattern = /https?:\/\/(?:www\.)?(?:youtu\.be\/|youtube\.com\/watch\?(?:.*&)?v=)([^?&\s<"']+)/gi;
    const bareMatch = barePattern.exec(html);
    if (bareMatch) return bareMatch[1];
    return null;
};/**
 * Removes YouTube links (both anchor tags and bare URLs) from HTML string.
 * Used to avoid showing the raw link alongside the embed preview.
 */
const stripYoutubeLinksFromHtml = (html: string): string => {
    // Remove <a href="...youtu...">...</a> tags entirely
    let result = html.replace(/<a\b[^>]*href=["'][^"']*youtu[^"']*["'][^>]*>.*?<\/a>/gi, '');
    // Remove bare youtu.be / youtube.com URLs in text nodes
    result = result.replace(/https?:\/\/(?:www\.)?(?:youtu\.be|youtube\.com)\/[^\s<"'&]*/gi, '');
    // Clean up empty block tags left behind (e.g. <div></div>, <p></p>)
    result = result.replace(/<(div|p|span)[^>]*>\s*<\/\1>/gi, '');
    return result;
};

/**
 * Removes Google Drive links (both anchor tags and bare URLs) from HTML string.
 */
const stripDriveLinksFromHtml = (html: string): string => {
    let result = html.replace(/<a\b[^>]*href=["'][^"']*drive\.google\.com[^"']*["'][^>]*>.*?<\/a>/gi, '');
    result = result.replace(/https?:\/\/drive\.google\.com\/[^\s<"'&]*/gi, '');
    result = result.replace(/<(div|p|span)[^>]*>\s*<\/\1>/gi, '');
    return result;
};


interface NoteTabSwitcherProps {
    projectSlug: string;
}

/**
 * Figma: 350 × 52 px pill container (bg Surface-3, radius 16px).
 * Shared tab (left, inactive): bg none, color Primary.
 * Personal tab (right, active): bg Surface-1, radius 8px, color white.
 */
const NoteTabSwitcher = ({ projectSlug }: NoteTabSwitcherProps): React.ReactElement => (
    <div
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: COLOR.surface3,
            borderRadius: '16px',
            padding: '6px',
            flexShrink: 0,
        }}
    >
        {/* ── Shared tab (inactive) ── */}
        <Link
            href={`/p/${projectSlug}/notes/shared`}
            style={{
                flex: 1,
                height: '40px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: COLOR.primary,
                fontFamily: FONT.figtree,
                fontSize: '20px',
                fontWeight: 700,
                lineHeight: '28px',
                textDecoration: 'none',
                padding: '0 16px',
            }}
        >
            {/* People icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLOR.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Shared
        </Link>

        {/* ── Personal tab (active) ── */}
        <div
            style={{
                flex: 1,
                height: '40px',
                background: COLOR.surface1,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: COLOR.white,
                fontFamily: FONT.figtree,
                fontSize: '20px',
                fontWeight: 700,
                lineHeight: '28px',
                padding: '0 16px',
            }}
        >
            {/* Person icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLOR.white} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
            </svg>
            Personal
            {/* Check icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLOR.white} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
            </svg>
        </div>
    </div>
);

// ─── ToolbarButton ────────────────────────────────────────────────────────────

interface ToolbarButtonProps {
    title: string;
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    style?: React.CSSProperties;
}

/** Reusable 24×24 toolbar icon button */
const ToolbarButton = ({
    title,
    onClick,
    isActive = false,
    children,
    style,
}: ToolbarButtonProps): React.ReactElement => (
    <button
        title={title}
        onMouseDown={(e) => {
            // Prevent editor from losing focus when clicking toolbar
            e.preventDefault();
            onClick();
        }}
        style={{
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isActive ? COLOR.surface1 : 'none',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            color: isActive ? COLOR.white : COLOR.secondary,
            fontFamily: FONT.figtree,
            flexShrink: 0,
            transition: 'background 0.15s',
            ...style,
        }}
    >
        {children}
    </button>
);

// ─── ToolbarSeparator ─────────────────────────────────────────────────────────

/** Figma: 2 × 32 px, bg Secondary, radius 16 */
const ToolbarSeparator = (): React.ReactElement => (
    <div
        style={{
            width: 2,
            height: 32,
            background: COLOR.secondary,
            borderRadius: 16,
            flexShrink: 0,
        }}
    />
);

// ─── NoteToolbar ──────────────────────────────────────────────────────────────

interface NoteToolbarProps {
    editorRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Fully functional formatting toolbar.
 * All commands target the contentEditable editor via document.execCommand.
 *
 * Figma layout: items flex-row, gap 16px, separated by vertical bars.
 * Separator: 2 × 32 px, bg #7B7B7B, radius 16.
 */
const NoteToolbar = ({ editorRef }: NoteToolbarProps): React.ReactElement => {
    const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
    const [headingLabel, setHeadingLabel] = useState<HeadingTag | 'P'>('P');
    const [showHeadingMenu, setShowHeadingMenu] = useState(false);
    const headingMenuRef = useRef<HTMLDivElement>(null);

    /** Sync active state by querying current selection */
    const syncFormats = useCallback(() => {
        const formats = new Set<string>();
        if (document.queryCommandState('bold'))        formats.add('bold');
        if (document.queryCommandState('italic'))      formats.add('italic');
        if (document.queryCommandState('underline'))   formats.add('underline');
        if (document.queryCommandState('justifyLeft')) formats.add('justifyLeft');
        if (document.queryCommandState('justifyCenter')) formats.add('justifyCenter');
        if (document.queryCommandState('justifyRight')) formats.add('justifyRight');
        if (document.queryCommandState('justifyFull')) formats.add('justifyFull');
        if (document.queryCommandState('insertUnorderedList')) formats.add('ul');
        setActiveFormats(formats);

        // Detect heading
        const block = document.queryCommandValue('formatBlock').toUpperCase() as HeadingTag | 'P' | '';
        setHeadingLabel((block as HeadingTag) || 'P');
    }, []);

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;
        editor.addEventListener('keyup', syncFormats);
        editor.addEventListener('mouseup', syncFormats);
        editor.addEventListener('selectionchange', syncFormats);
        return () => {
            editor.removeEventListener('keyup', syncFormats);
            editor.removeEventListener('mouseup', syncFormats);
            editor.removeEventListener('selectionchange', syncFormats);
        };
    }, [editorRef, syncFormats]);

    // Close heading menu when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (headingMenuRef.current && !headingMenuRef.current.contains(e.target as Node)) {
                setShowHeadingMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleAlign = (cmd: AlignCommand) => {
        execFormatSafe(editorRef, cmd);
        syncFormats();
    };

    const handleHeading = (tag: HeadingTag) => {
        const editor = editorRef.current;
        if (!editor) return;

        // Ensure editor has focus and a valid cursor/selection before formatBlock.
        // Without this, formatBlock is a no-op in most browsers.
        editor.focus();
        const sel = window.getSelection();
        if (sel && sel.rangeCount === 0) {
            // No selection at all — place caret at end of editor
            const range = document.createRange();
            range.selectNodeContents(editor);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        } else if (sel && sel.rangeCount > 0) {
            // Verify the existing range is actually inside our editor
            const range = sel.getRangeAt(0);
            if (!editor.contains(range.commonAncestorContainer)) {
                const newRange = document.createRange();
                newRange.selectNodeContents(editor);
                newRange.collapse(false);
                sel.removeAllRanges();
                sel.addRange(newRange);
            }
        }

        const value = tag === 'P' ? 'p' : tag.toLowerCase();
        document.execCommand('formatBlock', false, value);
        setHeadingLabel(tag);
        setShowHeadingMenu(false);
        // Small delay to let browser apply before querying
        setTimeout(syncFormats, 0);
    };

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                borderTop: `2px solid ${COLOR.secondary}`,
                borderBottom: `2px solid ${COLOR.secondary}`,
                paddingTop: '8px',
                paddingBottom: '8px',
                flexWrap: 'nowrap',
                overflowX: 'auto',
                scrollbarWidth: 'none',
            }}
        >
            {/* ── Bold ── */}
            <ToolbarButton
                title="Bold (Ctrl+B)"
                isActive={activeFormats.has('bold')}
                onClick={() => { execFormatSafe(editorRef, 'bold'); syncFormats(); }}
                style={{ fontSize: '16px', fontWeight: 700 }}
            >
                B
            </ToolbarButton>

            {/* ── Italic ── */}
            <ToolbarButton
                title="Italic (Ctrl+I)"
                isActive={activeFormats.has('italic')}
                onClick={() => { execFormatSafe(editorRef, 'italic'); syncFormats(); }}
                style={{ fontSize: '16px', fontStyle: 'italic' }}
            >
                I
            </ToolbarButton>

            {/* ── Underline ── */}
            <ToolbarButton
                title="Underline (Ctrl+U)"
                isActive={activeFormats.has('underline')}
                onClick={() => { execFormatSafe(editorRef, 'underline'); syncFormats(); }}
                style={{ fontSize: '16px', textDecoration: 'underline' }}
            >
                U
            </ToolbarButton>

            <ToolbarSeparator />

            {/* ── Align Left ── */}
            <ToolbarButton title="Align left" isActive={activeFormats.has('justifyLeft')} onClick={() => handleAlign('justifyLeft')}>
                <svg width="18" height="15" viewBox="0 0 18 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="0" y1="1" x2="18" y2="1" />
                    <line x1="0" y1="7" x2="12" y2="7" />
                    <line x1="0" y1="13" x2="14" y2="13" />
                </svg>
            </ToolbarButton>

            {/* ── Align Center ── */}
            <ToolbarButton title="Align center" isActive={activeFormats.has('justifyCenter')} onClick={() => handleAlign('justifyCenter')}>
                <svg width="18" height="15" viewBox="0 0 18 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="0" y1="1" x2="18" y2="1" />
                    <line x1="3" y1="7" x2="15" y2="7" />
                    <line x1="2" y1="13" x2="16" y2="13" />
                </svg>
            </ToolbarButton>

            {/* ── Align Right ── */}
            <ToolbarButton title="Align right" isActive={activeFormats.has('justifyRight')} onClick={() => handleAlign('justifyRight')}>
                <svg width="18" height="15" viewBox="0 0 18 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="0" y1="1" x2="18" y2="1" />
                    <line x1="6" y1="7" x2="18" y2="7" />
                    <line x1="4" y1="13" x2="18" y2="13" />
                </svg>
            </ToolbarButton>

            {/* ── Justify ── */}
            <ToolbarButton title="Justify" isActive={activeFormats.has('justifyFull')} onClick={() => handleAlign('justifyFull')}>
                <svg width="18" height="15" viewBox="0 0 18 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="0" y1="1" x2="18" y2="1" />
                    <line x1="0" y1="7" x2="18" y2="7" />
                    <line x1="0" y1="13" x2="18" y2="13" />
                </svg>
            </ToolbarButton>

            <ToolbarSeparator />

            {/* ── Heading dropdown ── */}
            <div ref={headingMenuRef} style={{ position: 'relative' }}>
                <button
                    title="Heading style"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        setShowHeadingMenu((v) => !v);
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: COLOR.secondary,
                        fontFamily: FONT.figtree,
                        fontSize: '20px',
                        fontWeight: 700,
                        lineHeight: '28px',
                        padding: 0,
                    }}
                >
                    {headingLabel === 'P' ? 'Heading' : headingLabel}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLOR.secondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </button>

                {showHeadingMenu && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            marginTop: '4px',
                            background: COLOR.surface3,
                            borderRadius: '8px',
                            padding: '4px',
                            zIndex: 100,
                            minWidth: '140px',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                        }}
                    >
                        {(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'] as const).map((tag) => (
                            <button
                                key={tag}
                                onMouseDown={(e) => { e.preventDefault(); handleHeading(tag); }}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    textAlign: 'left',
                                    background: headingLabel === tag ? COLOR.surface1 : 'none',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    color: COLOR.primary,
                                    fontFamily: FONT.figtree,
                                    fontSize: tag === 'P' ? '14px' : tag === 'H1' ? '20px' : tag === 'H2' ? '18px' : '16px',
                                    fontWeight: tag === 'P' ? 400 : 700,
                                    padding: '6px 12px',
                                }}
                            >
                                {tag === 'P' ? 'Paragraph' : tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <ToolbarSeparator />

            {/* ── Bulleted list ── */}
            <ToolbarButton title="Bulleted list" isActive={activeFormats.has('ul')} onClick={() => { execFormatSafe(editorRef, 'insertUnorderedList'); syncFormats(); }}>
                <svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="6" y1="1" x2="18" y2="1" />
                    <line x1="6" y1="6" x2="18" y2="6" />
                    <line x1="6" y1="11" x2="18" y2="11" />
                    <circle cx="2" cy="1" r="1.5" fill="currentColor" stroke="none" />
                    <circle cx="2" cy="6" r="1.5" fill="currentColor" stroke="none" />
                    <circle cx="2" cy="11" r="1.5" fill="currentColor" stroke="none" />
                </svg>
            </ToolbarButton>

            {/* ── Insert link ── */}
            <ToolbarButton
                title="Insert link"
                onClick={() => {
                    const url = window.prompt('Enter URL:');
                    if (url) execFormatSafe(editorRef, 'createLink', url);
                }}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
            </ToolbarButton>
        </div>
    );
};

// ─── NoteYoutubeEmbed ─────────────────────────────────────────────────────────

interface NoteYoutubeEmbedProps {
    embedUrl: string;
    embedTitle?: string;
}

/**
 * YouTube embed — logo + title link.
 * Auto-fetches video title from oEmbed API if embedTitle not provided.
 * Displays first 5 words of title, truncated with "...".
 */
const NoteYoutubeEmbed = ({ embedUrl, embedTitle }: NoteYoutubeEmbedProps): React.ReactElement => {
    const videoId = extractYoutubeId(embedUrl);
    const watchUrl = videoId
        ? `https://www.youtube.com/watch?v=${videoId}`
        : embedUrl.replace('/embed/', '/watch?v=');

    const [fetchedTitle, setFetchedTitle] = useState<string | null>(null);

    useEffect(() => {
        if (embedTitle) return; // already have title from props
        if (!videoId) return;
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        fetch(oembedUrl)
            .then((r) => r.json())
            .then((data) => {
                if (data?.title) setFetchedTitle(data.title);
            })
            .catch(() => {/* silently ignore */});
    }, [videoId, embedTitle]);

    const rawTitle = embedTitle || fetchedTitle || 'Watch on YouTube';

    return (
        <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
                color: COLOR.white,
                fontFamily: FONT.figtree,
                fontSize: '14px',
                fontWeight: 700,
                lineHeight: '19.6px',
                maxWidth: '100%',
                overflow: 'hidden',
            }}
        >
            {/* YouTube logo — 20×14px proporsional dengan teks 14px */}
            <svg width="20" height="14" viewBox="0 0 18 13" fill="none" style={{ flexShrink: 0 }}>
                <rect width="18" height="13" rx="3" fill={COLOR.red1} />
                <polygon points="7,9.5 13,6.5 7,3.5" fill={COLOR.white} />
            </svg>
            <span style={{ textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {rawTitle}
            </span>
        </a>
    );
};

// ─── NoteGoogleDriveEmbed ─────────────────────────────────────────────────────

interface NoteGoogleDriveEmbedProps {
    driveUrl: string;
    embedTitle?: string;
}

/**
 * Google Drive embed — logo + title link. Small Text Bold, 14px.
 */
const NoteGoogleDriveEmbed = ({ driveUrl, embedTitle }: NoteGoogleDriveEmbedProps): React.ReactElement => (
    <a
        href={driveUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            textDecoration: 'none',
            color: COLOR.white,
            fontFamily: FONT.figtree,
            fontSize: '14px',
            fontWeight: 700,
            lineHeight: '19.6px',
        }}
    >
        {/* Google Drive logo — 20×20px proporsional dengan teks 14px */}
        <svg width="20" height="20" viewBox="0 0 87.3 78" fill="none" style={{ flexShrink: 0 }}>
            <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L28.95 50H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066DA" />
            <path d="M43.65 25L28.45 0c-1.35.8-2.5 1.9-3.3 3.3L1.2 45.5C.4 46.9 0 48.45 0 50h28.95z" fill="#00AC47" />
            <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H58.35l6.1 11.5z" fill="#EA4335" />
            <path d="M43.65 25L58.85 0H28.45z" fill="#00832D" />
            <path d="M73.4 50H58.35L43.65 25 28.95 50z" fill="#2684FC" />
            <path d="M73.4 50l-9.95 17.25-6.1-11.5H28.95l15.2 26.25h30.1c1.35-.8 2.5-1.9 3.3-3.3L80.1 75l7.2-12.5c.8-1.4 1.2-2.95 1.2-4.5H73.4z" fill="#FFBA00" />
        </svg>
        <span style={{ textDecoration: 'underline' }}>
            {embedTitle || 'Open in Google Drive'}
        </span>
    </a>
);

// ─── NoteEmptyState ───────────────────────────────────────────────────────────

/** Shown when no note is selected */
const NoteEmptyState = (): React.ReactElement => (
    <div
        style={{
            display: 'flex',
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
        }}
    >
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                textAlign: 'center',
                maxWidth: '367px',
            }}
        >
            <svg width="64" height="64" viewBox="0 0 20 20" fill={COLOR.primary} style={{ opacity: 0.4 }}>
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <h3
                style={{
                    color: COLOR.primary,
                    fontFamily: FONT.figtree,
                    fontSize: '24px',
                    fontWeight: 700,
                    lineHeight: '26.4px',
                    margin: 0,
                }}
            >
                Your Private Space
            </h3>
            <p
                style={{
                    color: COLOR.primary,
                    opacity: 0.6,
                    fontFamily: FONT.figtree,
                    fontSize: '16px',
                    lineHeight: '22.4px',
                    margin: 0,
                }}
            >
                This section is for your personal, private notes. Keep track of ideas and
                feedback here. All contents are private — visible only to you.
            </p>
        </div>
    </div>
);

// ─── NoteDetail ───────────────────────────────────────────────────────────────

interface NoteDetailProps {
    note: NoteItem;
    onSave: (id: string, title: string, html: string) => void;
}

/**
 * Note detail with:
 *  - Editable title (input, 40px bold, placeholder "New page", color #7B7B7B)
 *  - Separator lines above & below toolbar (Figma: 2px, bg #7B7B7B)
 *  - contentEditable rich-text editor (16px, white)
 *  - YouTube embed (if present in content)
 *  - Auto-save on blur
 */
const NoteDetail = ({ note, onSave }: NoteDetailProps): React.ReactElement => {
    const [title, setTitle] = useState(note.title === 'Untitled' ? '' : note.title);
    const editorRef = useRef<HTMLDivElement>(null);
    const savedHtmlRef = useRef<string>(note.content?.html ?? note.content?.text ?? '');

    // Derive YouTube embed from stored embedUrl OR by scanning editor HTML
    const [detectedYoutubeId, setDetectedYoutubeId] = useState<string | null>(() => {
        if (note.content?.embedUrl && !isGoogleDriveUrl(note.content.embedUrl)) {
            return extractYoutubeId(note.content.embedUrl);
        }
        const html = note.content?.html ?? note.content?.text ?? '';
        return findYoutubeIdInHtml(html);
    });

    // Derive Google Drive link
    const [detectedDriveUrl, setDetectedDriveUrl] = useState<string | null>(() => {
        if (note.content?.embedUrl && isGoogleDriveUrl(note.content.embedUrl)) {
            return note.content.embedUrl;
        }
        const html = note.content?.html ?? note.content?.text ?? '';
        return findDriveLinkInHtml(html);
    });

    // Sync when note changes
    useEffect(() => {
        setTitle(note.title === 'Untitled' ? '' : note.title);
        const initialHtml = note.content?.html ?? note.content?.text ?? '';
        savedHtmlRef.current = initialHtml;
        if (editorRef.current) {
            editorRef.current.innerHTML = initialHtml;
        }
        if (note.content?.embedUrl) {
            if (isGoogleDriveUrl(note.content.embedUrl)) {
                setDetectedDriveUrl(note.content.embedUrl);
                setDetectedYoutubeId(null);
            } else {
                setDetectedYoutubeId(extractYoutubeId(note.content.embedUrl));
                setDetectedDriveUrl(null);
            }
        } else {
            setDetectedYoutubeId(findYoutubeIdInHtml(initialHtml));
            setDetectedDriveUrl(findDriveLinkInHtml(initialHtml));
        }
    }, [note.id]);

    const triggerSave = useCallback(() => {
        const currentTitle = title.trim() || 'Untitled';
        const currentHtml = editorRef.current?.innerHTML ?? '';
        if (currentTitle !== note.title || currentHtml !== savedHtmlRef.current) {
            savedHtmlRef.current = currentHtml;
            // Only update embed state if we find something NEW in the HTML.
            // If HTML has been stripped already (link removed after embed detected),
            // we must NOT reset the embed state — preserve whatever is already shown.
            const htmlYoutubeId = findYoutubeIdInHtml(currentHtml);
            const htmlDriveUrl  = findDriveLinkInHtml(currentHtml);
            if (htmlYoutubeId) setDetectedYoutubeId(htmlYoutubeId);
            if (htmlDriveUrl)  setDetectedDriveUrl(htmlDriveUrl);
            onSave(note.id, currentTitle, currentHtml);
        }
    }, [note.id, note.title, title, onSave]);

    /** Real-time scan: update embed previews immediately as user types/pastes links,
     *  then strip the raw link from the editor so it doesn't show twice. */
    const handleEditorInput = useCallback(() => {
        const editor = editorRef.current;
        if (!editor) return;
        const currentHtml = editor.innerHTML;

        const youtubeId = findYoutubeIdInHtml(currentHtml);
        const driveUrl = findDriveLinkInHtml(currentHtml);

        // Only update embed state when a NEW link is found — never clear it
        // just because the HTML is already stripped (e.g. user adding a bullet).
        if (youtubeId) setDetectedYoutubeId(youtubeId);
        if (driveUrl)  setDetectedDriveUrl(driveUrl);

        // Strip detected links from editor HTML so they don't appear raw
        let cleaned = currentHtml;
        if (youtubeId) cleaned = stripYoutubeLinksFromHtml(cleaned);
        if (driveUrl)  cleaned = stripDriveLinksFromHtml(cleaned);

        if (cleaned !== currentHtml) {
            // Preserve caret position by saving/restoring selection
            const sel = window.getSelection();
            // Just update innerHTML; caret will land at end — acceptable for paste scenario
            editor.innerHTML = cleaned;
            // Move caret to end
            const range = document.createRange();
            range.selectNodeContents(editor);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
    }, []);

    return (
        <>
            {/* ── Title input ── */}
            <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={triggerSave}
                placeholder="New page"
                style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontFamily: FONT.figtree,
                    fontSize: '40px',
                    fontWeight: 700,
                    lineHeight: '44px',
                    color: title ? COLOR.primary : COLOR.secondary,
                    marginBottom: '16px',
                    boxSizing: 'border-box',
                }}
            />

            {/* ── Toolbar ── */}
            <NoteToolbar editorRef={editorRef} />

            {/* ── Embed previews: muncul tepat di bawah toolbar, sesuai Figma ── */}
            {(detectedYoutubeId || detectedDriveUrl) && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {detectedYoutubeId && (
                        <NoteYoutubeEmbed
                            embedUrl={`https://www.youtube.com/embed/${detectedYoutubeId}`}
                            embedTitle={note.content?.embedTitle}
                        />
                    )}
                    {detectedDriveUrl && (
                        <NoteGoogleDriveEmbed
                            driveUrl={detectedDriveUrl}
                            embedTitle={note.content?.embedTitle}
                        />
                    )}
                </div>
            )}

            {/* ── Rich-text editor ── */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onBlur={triggerSave}
                onInput={handleEditorInput}
                data-placeholder="Start writing..."
                style={{
                    flex: 1,
                    minHeight: '200px',
                    marginTop: '16px',
                    outline: 'none',
                    fontFamily: FONT.figtree,
                    fontSize: '16px',
                    fontWeight: 400,
                    lineHeight: '22.4px',
                    color: COLOR.white,
                    wordBreak: 'break-word',
                }}
            />

            {/* Inline CSS for placeholder, list styling & heading sizes */}
            <style>{`
                [contenteditable][data-placeholder]:empty::before {
                    content: attr(data-placeholder);
                    color: var(--color-secondary, #7B7B7B);
                    pointer-events: none;
                }
                [contenteditable] ul {
                    padding-left: 20px;
                    list-style: disc;
                }
                [contenteditable] a {
                    color: var(--color-primary, #F0F0F0);
                    text-decoration: underline;
                }
                [contenteditable] h1 { font-size: 2em; font-weight: 700; margin: 0.5em 0; }
                [contenteditable] h2 { font-size: 1.5em; font-weight: 700; margin: 0.5em 0; }
                [contenteditable] h3 { font-size: 1.25em; font-weight: 700; margin: 0.5em 0; }
                [contenteditable] h4 { font-size: 1.1em; font-weight: 700; margin: 0.5em 0; }
                [contenteditable] h5 { font-size: 1em; font-weight: 700; margin: 0.5em 0; }
                [contenteditable] h6 { font-size: 0.9em; font-weight: 700; margin: 0.5em 0; }
                [contenteditable] p  { margin: 0.25em 0; }
            `}</style>
        </>
    );
};

// ─── NoteCard ─────────────────────────────────────────────────────────────────

interface NoteCardProps {
    note: NoteItem;
    isActive: boolean;
    onSelect: (note: NoteItem) => void;
    onDeleteRequest: (id: string) => void;
}

/**
 * Figma: 369 × 74 px, padding 9px 25px.
 * Active  → bg Surface-1 (#111111), border Surface-1
 * Inactive → bg Surface-3 (#2E2E2E), border Surface-3
 * Title: 20px bold white; subtitle: 14px regular white.
 * Delete icon: top-right, visible always (per current screenshot).
 */
const NoteCard = ({ note, isActive, onSelect, onDeleteRequest }: NoteCardProps): React.ReactElement => (
    <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(note)}
        onKeyDown={(e) => e.key === 'Enter' && onSelect(note)}
        style={{
            width: '369px',
            height: '74px',
            background: isActive ? COLOR.surface1 : COLOR.surface3,
            borderRadius: '8px',
            border: `2px solid ${isActive ? COLOR.surface1 : COLOR.surface3}`,
            padding: '9px 25px',
            cursor: 'pointer',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '4px',
            boxSizing: 'border-box',
            flexShrink: 0,
        }}
    >
        {/* Title */}
        <p
            style={{
                color: COLOR.white,
                fontFamily: FONT.figtree,
                fontSize: '20px',
                fontWeight: 700,
                lineHeight: '28px',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                paddingRight: '28px',
            }}
        >
            {note.title}
        </p>

        {/* Subtitle / timeAgo */}
        {note.timeAgo && (
            <p
                style={{
                    color: COLOR.white,
                    fontFamily: FONT.figtree,
                    fontSize: '14px',
                    fontWeight: 400,
                    lineHeight: '19.6px',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    paddingRight: '28px',
                }}
            >
                {note.timeAgo}
            </p>
        )}

        {/* Delete button */}
        <button
            onClick={(e) => { e.stopPropagation(); onDeleteRequest(note.id); }}
            title="Delete note"
            style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: COLOR.secondary,
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
        </button>
    </div>
);

// ─── DeleteConfirmModal ───────────────────────────────────────────────────────

interface DeleteConfirmModalProps {
    onConfirm: () => void;
    onCancel: () => void;
}

const DeleteConfirmModal = ({ onConfirm, onCancel }: DeleteConfirmModalProps): React.ReactElement => (
    <div
        style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: COLOR.overlayBg,
        }}
    >
        <div
            style={{
                width: '360px',
                background: COLOR.surface2,
                borderRadius: '12px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
            }}
        >
            <h3
                style={{
                    color: COLOR.primary,
                    fontFamily: FONT.figtree,
                    fontSize: '24px',
                    fontWeight: 700,
                    lineHeight: '26.4px',
                    margin: 0,
                }}
            >
                Delete Note?
            </h3>
            <p
                style={{
                    color: COLOR.secondary,
                    fontFamily: FONT.figtree,
                    fontSize: '16px',
                    lineHeight: '22.4px',
                    margin: 0,
                }}
            >
                This note will be moved to Trash. You can restore it later.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                    onClick={onCancel}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: `1px solid ${COLOR.surface3}`,
                        background: 'none',
                        color: COLOR.primary,
                        fontFamily: FONT.figtree,
                        fontSize: '14px',
                        lineHeight: '19.6px',
                        cursor: 'pointer',
                    }}
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: COLOR.error,
                        color: COLOR.white,
                        fontFamily: FONT.figtree,
                        fontSize: '14px',
                        fontWeight: 700,
                        lineHeight: '19.6px',
                        cursor: 'pointer',
                    }}
                >
                    Delete
                </button>
            </div>
        </div>
    </div>
);

// ─── PersonalNotes (main page) ────────────────────────────────────────────────

/**
 * Main PersonalNotes page component.
 *
 * Props:
 *  - projectSlug   : used to build API URLs
 *  - initialNotes  : SSR-passed list of NoteItem from controller
 *
 * State:
 *  - notes           : local copy of note list (updated after each CRUD op)
 *  - searchQuery     : filters the note list in real-time
 *  - selectedNote    : currently open note in the right panel
 *  - isCreating      : prevents double-submit on create
 *  - deleteConfirmId : holds the note ID pending delete confirmation
 */
const PersonalNotes = ({
    projectSlug,
    initialNotes = [],
}: PersonalNotesProps): React.ReactElement => {
    const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNote, setSelectedNote] = useState<NoteItem | null>(initialNotes[0] ?? null);
    const [isCreating, setIsCreating] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    /** Notes filtered by search query (case-insensitive title match) */
    const filteredNotes = useMemo<NoteItem[]>(
        () =>
            notes.filter((note) =>
                note.title.toLowerCase().includes(searchQuery.toLowerCase()),
            ),
        [searchQuery, notes],
    );

    // Keep selectedNote in sync when filter removes it
    useEffect(() => {
        if (filteredNotes.length === 0) {
            setSelectedNote(null);
            return;
        }
        const stillVisible = filteredNotes.some((n) => n.id === selectedNote?.id);
        if (!stillVisible) setSelectedNote(filteredNotes[0]);
    }, [filteredNotes, selectedNote]);

    // ── CREATE ──────────────────────────────────────────────────────────────────
    const handleCreate = useCallback(() => {
        if (isCreating) return;
        setIsCreating(true);
        router.post(
            `/p/${projectSlug}/notes`,
            { title: 'Untitled', content: { html: '', text: '' }, is_shared: false },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const fresh = (page.props as unknown as PersonalNotesProps).initialNotes;
                    setNotes(fresh);
                    setSelectedNote(fresh[0] ?? null);
                },
                onFinish: () => setIsCreating(false),
            },
        );
    }, [projectSlug, isCreating]);

    // ── UPDATE (auto-save on blur) ───────────────────────────────────────────────
    const handleSave = useCallback(
        (id: string, title: string, html: string) => {
            router.patch(
                `/p/${projectSlug}/notes/${id}`,
                { title, content: { html, text: html } },
                {
                    preserveScroll: true,
                    onSuccess: (page) => {
                        const fresh = (page.props as unknown as PersonalNotesProps).initialNotes;
                        setNotes(fresh);
                        setSelectedNote((prev) => fresh.find((n) => n.id === prev?.id) ?? null);
                    },
                },
            );
        },
        [projectSlug],
    );

    // ── DELETE ───────────────────────────────────────────────────────────────────
    const handleDelete = useCallback(
        (id: string) => {
            router.delete(`/p/${projectSlug}/notes/${id}`, {
                preserveScroll: true,
                onSuccess: (page) => {
                    const fresh = (page.props as unknown as PersonalNotesProps).initialNotes;
                    setNotes(fresh);
                    setSelectedNote(fresh[0] ?? null);
                    setDeleteConfirmId(null);
                },
            });
        },
        [projectSlug],
    );

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100dvh',
                overflow: 'hidden',
                background: COLOR.surface1,
                fontFamily: FONT.figtree,
            }}
        >
            <Head title="Personal Notes" />
            <Header projectName="Project Zeno" />

            <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                <Sidebar projectSlug={projectSlug} />

                {/* ── Main content wrapper ── */}
                <div
                    style={{
                        margin: '8px',
                        display: 'flex',
                        flex: 1,
                        gap: '8px',
                        overflow: 'hidden',
                        borderRadius: '12px',
                        border: `2px solid ${COLOR.surface3}`,
                        padding: '8px',
                    }}
                >
                    {/* ════════════════════════════════════════════════
                        LEFT PANEL — note list
                        Figma: 401 × 886 px, bg Surface-2, radius 8px
                    ════════════════════════════════════════════════ */}
                    <section
                        style={{
                            width: '401px',
                            flexShrink: 0,
                            background: COLOR.surface2,
                            borderRadius: '8px',
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        {/* ── Header: title + create button ── */}
                        <div style={{ padding: '16px 16px 0 16px' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: '16px',
                                }}
                            >
                                {/* Title: 32px bold, Figma left:16 top:15.72 */}
                                <h2
                                    style={{
                                        color: COLOR.white,
                                        fontFamily: FONT.figtree,
                                        fontSize: '32px',
                                        fontWeight: 700,
                                        lineHeight: '35.2px',
                                        margin: 0,
                                    }}
                                >
                                    Personal Notes
                                </h2>

                                {/* Create new note button (+ icon) */}
                                <button
                                    onClick={handleCreate}
                                    disabled={isCreating}
                                    title="New note"
                                    style={{
                                        width: 32,
                                        height: 32,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: COLOR.surface3,
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: isCreating ? 'not-allowed' : 'pointer',
                                        color: COLOR.secondary,
                                        opacity: isCreating ? 0.5 : 1,
                                        flexShrink: 0,
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Search bar: 369 × 42 px, bg Surface-3, radius 8 */}
                            <div
                                style={{
                                    width: '369px',
                                    height: '42px',
                                    background: COLOR.surface3,
                                    borderRadius: '8px',
                                    marginBottom: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    boxSizing: 'border-box',
                                }}
                            >
                                <input
                                    type="text"
                                    placeholder="Search note..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        flex: 1,
                                        height: '100%',
                                        background: 'transparent',
                                        border: 'none',
                                        outline: 'none',
                                        paddingLeft: '16px',
                                        color: COLOR.secondary,
                                        fontFamily: FONT.figtree,
                                        fontSize: '18px',
                                        fontWeight: 700,
                                        lineHeight: '25.2px',
                                    }}
                                />
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke={COLOR.secondary}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{ marginRight: '12px', flexShrink: 0 }}
                                >
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </div>

                            {/* "Recent" label: Large Text Bold, 20px, rgba(255,255,255,0.60) */}
                            <span
                                style={{
                                    color: COLOR.recentLabel,
                                    fontFamily: FONT.figtree,
                                    fontSize: '20px',
                                    fontWeight: 700,
                                    lineHeight: '28px',
                                    display: 'block',
                                    marginBottom: '8px',
                                }}
                            >
                                Recent
                            </span>
                        </div>

                        {/* ── Card list: gap 16px, scrollable ── */}
                        <div
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '0 16px 16px 16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                                scrollbarWidth: 'none',
                            }}
                        >
                            {filteredNotes.length > 0 ? (
                                filteredNotes.map((note) => (
                                    <NoteCard
                                        key={note.id}
                                        note={note}
                                        isActive={selectedNote?.id === note.id}
                                        onSelect={setSelectedNote}
                                        onDeleteRequest={setDeleteConfirmId}
                                    />
                                ))
                            ) : (
                                <p
                                    style={{
                                        textAlign: 'center',
                                        color: COLOR.secondary,
                                        fontFamily: FONT.figtree,
                                        fontSize: '14px',
                                        lineHeight: '19.6px',
                                        marginTop: '16px',
                                    }}
                                >
                                    No notes found.
                                </p>
                            )}
                        </div>
                    </section>

                    {/* ════════════════════════════════════════════════
                        RIGHT PANEL — note editor
                        bg Surface-2 #242424, flex-1, radius 8px
                    ════════════════════════════════════════════════ */}
                    <main
                        style={{
                            flex: 1,
                            minWidth: 0,
                            background: COLOR.surface2,
                            borderRadius: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        }}
                    >
                        {/* ── Tab switcher ── */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '24px 24px 16px',
                            }}
                        >
                            <NoteTabSwitcher projectSlug={projectSlug} />
                        </div>

                        {/* ── Inner block: Surface-3, radius 8 ── */}
                        <div
                            style={{
                                flex: 1,
                                overflow: 'hidden',
                                padding: '0 16px 16px 16px',
                            }}
                        >
                            <div
                                style={{
                                    background: COLOR.surface3,
                                    borderRadius: '8px',
                                    height: '100%',
                                    overflow: 'hidden',
                                    display: 'flex',
                                }}
                            >
                                {selectedNote ? (
                                    <div
                                        style={{
                                            flex: 1,
                                            overflowY: 'auto',
                                            padding: '24px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            scrollbarWidth: 'none',
                                        }}
                                    >
                                        <NoteDetail
                                            key={selectedNote.id}
                                            note={selectedNote}
                                            onSave={handleSave}
                                        />
                                    </div>
                                ) : (
                                    <NoteEmptyState />
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            {/* ── Delete confirmation modal ── */}
            {deleteConfirmId !== null && (
                <DeleteConfirmModal
                    onConfirm={() => handleDelete(deleteConfirmId)}
                    onCancel={() => setDeleteConfirmId(null)}
                />
            )}
        </div>
    );
};

export default PersonalNotes;