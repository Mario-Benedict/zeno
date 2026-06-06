/**
 * @file PersonalNotes.embed.test.ts
 * @description Unit tests for YouTube/Drive embed detection, stripping, and
 *              the "embed survives after link is stripped" persistence behaviour.
 *
 * Run with:  npx vitest run PersonalNotes.embed.test.ts
 * (No DOM needed – all functions are pure string utilities)
 */

import { describe, it, expect } from 'vitest';

// ─── Copy of pure helpers from PersonalNotes.tsx ─────────────────────────────
// These are duplicated here so the test file is self-contained and doesn't
// require a full React/Inertia environment to import.

const isGoogleDriveUrl = (url: string): boolean => /drive\.google\.com/.test(url);

const findDriveLinkInHtml = (html: string): string | null => {
    const pattern = /href=["']([^"']*drive\.google\.com[^"']*)["']/gi;
    const match = pattern.exec(html);
    if (match) return match[1];
    const bare = /https?:\/\/drive\.google\.com\/[^\s<"']+/gi.exec(html);
    return bare ? bare[0] : null;
};

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

const findYoutubeIdInHtml = (html: string): string | null => {
    const anchorPattern = /href=["']([^"']*youtu[^"']+)["']/gi;
    let match: RegExpExecArray | null;
    while ((match = anchorPattern.exec(html)) !== null) {
        const id = extractYoutubeId(match[1]);
        if (id) return id;
    }
    const barePattern = /https?:\/\/(?:www\.)?(?:youtu\.be\/|youtube\.com\/watch\?(?:.*&)?v=)([^?&\s<"']+)/gi;
    const bareMatch = barePattern.exec(html);
    if (bareMatch) return bareMatch[1];
    return null;
};

const stripYoutubeLinksFromHtml = (html: string): string => {
    let result = html.replace(/<a\b[^>]*href=["'][^"']*youtu[^"']*["'][^>]*>.*?<\/a>/gi, '');
    result = result.replace(/https?:\/\/(?:www\.)?(?:youtu\.be|youtube\.com)\/[^\s<"'&]*/gi, '');
    result = result.replace(/<(div|p|span)[^>]*>\s*<\/\1>/gi, '');
    return result;
};

const stripDriveLinksFromHtml = (html: string): string => {
    let result = html.replace(/<a\b[^>]*href=["'][^"']*drive\.google\.com[^"']*["'][^>]*>.*?<\/a>/gi, '');
    result = result.replace(/https?:\/\/drive\.google\.com\/[^\s<"'&]*/gi, '');
    result = result.replace(/<(div|p|span)[^>]*>\s*<\/\1>/gi, '');
    return result;
};

// ─── Simulated triggerSave logic (the fixed version) ─────────────────────────
/**
 * Mirrors the fixed triggerSave: only SET embed state when a link is found in
 * HTML; never CLEAR it just because HTML is already stripped.
 * Returns the new embed state after save, preserving previous values.
 */
function simulateTriggerSave(
    currentHtml: string,
    prevYoutubeId: string | null,
    prevDriveUrl: string | null,
): { youtubeId: string | null; driveUrl: string | null } {
    const htmlYoutubeId = findYoutubeIdInHtml(currentHtml);
    const htmlDriveUrl  = findDriveLinkInHtml(currentHtml);
    return {
        youtubeId: htmlYoutubeId ?? prevYoutubeId,  // preserve if not found
        driveUrl:  htmlDriveUrl  ?? prevDriveUrl,
    };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('extractYoutubeId', () => {
    it('extracts ID from youtu.be short link', () => {
        expect(extractYoutubeId('https://youtu.be/mtg5bVwgvKU')).toBe('mtg5bVwgvKU');
    });
    it('extracts ID from youtu.be link with query params', () => {
        expect(extractYoutubeId('https://youtu.be/L55_qzr-mVo?si=sEdmt66NUac4YPxb')).toBe('L55_qzr-mVo');
    });
    it('extracts ID from youtube.com/watch?v= link', () => {
        expect(extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });
    it('extracts ID from youtube.com/embed/ link', () => {
        expect(extractYoutubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });
    it('returns null for non-YouTube URL', () => {
        expect(extractYoutubeId('https://drive.google.com/file/abc')).toBeNull();
    });
});

describe('findYoutubeIdInHtml', () => {
    it('finds ID from anchor href', () => {
        const html = `<a href="https://youtu.be/mtg5bVwgvKU?si=abc">watch</a>`;
        expect(findYoutubeIdInHtml(html)).toBe('mtg5bVwgvKU');
    });
    it('finds ID from bare URL in text', () => {
        const html = `some text https://youtu.be/dQw4w9WgXcQ more text`;
        expect(findYoutubeIdInHtml(html)).toBe('dQw4w9WgXcQ');
    });
    it('returns null for HTML with no YouTube link', () => {
        const html = `<ul><li>bullet item</li></ul><p>hello world</p>`;
        expect(findYoutubeIdInHtml(html)).toBeNull();
    });
    it('returns null for stripped HTML (after embed was detected)', () => {
        // This is the critical case: after stripping, triggerSave must NOT clear embed
        const strippedHtml = `<ul><li>bullet added after paste</li></ul>`;
        expect(findYoutubeIdInHtml(strippedHtml)).toBeNull();
    });
});

describe('findDriveLinkInHtml', () => {
    it('finds Drive URL from anchor href', () => {
        const html = `<a href="https://drive.google.com/drive/folders/abc123">Drive</a>`;
        expect(findDriveLinkInHtml(html)).toBe('https://drive.google.com/drive/folders/abc123');
    });
    it('finds Drive URL from bare text', () => {
        const html = `link: https://drive.google.com/drive/folders/1Jmg8zJrRj8kq-gM1_c3oMkHdGkT0D6I9`;
        expect(findDriveLinkInHtml(html)).toBe('https://drive.google.com/drive/folders/1Jmg8zJrRj8kq-gM1_c3oMkHdGkT0D6I9');
    });
    it('returns null when no Drive link present', () => {
        expect(findDriveLinkInHtml('<p>no links here</p>')).toBeNull();
    });
});

describe('stripYoutubeLinksFromHtml', () => {
    it('removes anchor tag with youtu.be href', () => {
        const html = `<div><a href="https://youtu.be/abc123">https://youtu.be/abc123</a></div>`;
        const result = stripYoutubeLinksFromHtml(html);
        expect(result).not.toContain('youtu.be');
    });
    it('removes bare youtu.be URL in text', () => {
        const html = `<p>check this https://youtu.be/abc123 out</p>`;
        const result = stripYoutubeLinksFromHtml(html);
        expect(result).not.toContain('youtu.be');
        expect(result).toContain('check this');
        expect(result).toContain('out');
    });
    it('removes bare youtube.com/watch URL in text', () => {
        const html = `<div>https://www.youtube.com/watch?v=dQw4w9WgXcQ</div>`;
        const result = stripYoutubeLinksFromHtml(html);
        expect(result).not.toContain('youtube.com');
    });
    it('preserves non-YouTube content', () => {
        const html = `<p>hello</p><a href="https://youtu.be/xyz">link</a><p>world</p>`;
        const result = stripYoutubeLinksFromHtml(html);
        expect(result).toContain('hello');
        expect(result).toContain('world');
        expect(result).not.toContain('youtu.be');
    });
    it('does not touch Google Drive links', () => {
        const html = `<a href="https://drive.google.com/file/abc">Drive</a>`;
        expect(stripYoutubeLinksFromHtml(html)).toContain('drive.google.com');
    });
});

describe('stripDriveLinksFromHtml', () => {
    it('removes anchor tag with Drive href', () => {
        const html = `<a href="https://drive.google.com/drive/folders/abc">Drive</a>`;
        const result = stripDriveLinksFromHtml(html);
        expect(result).not.toContain('drive.google.com');
    });
    it('preserves non-Drive content', () => {
        const html = `<p>notes</p><a href="https://drive.google.com/abc">link</a><ul><li>bullet</li></ul>`;
        const result = stripDriveLinksFromHtml(html);
        expect(result).toContain('notes');
        expect(result).toContain('bullet');
        expect(result).not.toContain('drive.google.com');
    });
});

describe('isGoogleDriveUrl', () => {
    it('returns true for drive.google.com URL', () => {
        expect(isGoogleDriveUrl('https://drive.google.com/file/abc')).toBe(true);
    });
    it('returns false for YouTube URL', () => {
        expect(isGoogleDriveUrl('https://youtu.be/abc')).toBe(false);
    });
});

// ─── Critical regression: embed must survive after link is stripped ───────────

describe('REGRESSION: embed state survives after link stripped from editor', () => {
    it('YouTube embed is NOT cleared when user adds bullet after paste', () => {
        // Step 1: user pastes YouTube link → handleEditorInput detects and strips it
        const htmlAfterPaste = `<div><a href="https://youtu.be/mtg5bVwgvKU">https://youtu.be/mtg5bVwgvKU</a></div>`;
        const youtubeId = findYoutubeIdInHtml(htmlAfterPaste);
        expect(youtubeId).toBe('mtg5bVwgvKU'); // detected

        const htmlStripped = stripYoutubeLinksFromHtml(htmlAfterPaste);
        expect(findYoutubeIdInHtml(htmlStripped)).toBeNull(); // link is gone from editor

        // Step 2: user clicks bullet → editor blurs → triggerSave runs on stripped HTML
        // BUG (old): setDetectedYoutubeId(null) ← embed disappears
        // FIX (new): preserve previous youtubeId
        const { youtubeId: afterSave } = simulateTriggerSave(
            `${htmlStripped}<ul><li>my bullet</li></ul>`,
            youtubeId,   // ← previous embed state passed in
            null,
        );
        expect(afterSave).toBe('mtg5bVwgvKU'); // embed must still be present
    });

    it('Drive embed is NOT cleared when user continues typing after paste', () => {
        const htmlAfterPaste = `<a href="https://drive.google.com/drive/folders/abc123">Drive</a>`;
        const driveUrl = findDriveLinkInHtml(htmlAfterPaste);
        expect(driveUrl).toBe('https://drive.google.com/drive/folders/abc123');

        const htmlStripped = stripDriveLinksFromHtml(htmlAfterPaste);
        expect(findDriveLinkInHtml(htmlStripped)).toBeNull();

        const { driveUrl: afterSave } = simulateTriggerSave(
            `${htmlStripped}<p>more notes</p>`,
            null,
            driveUrl,
        );
        expect(afterSave).toBe('https://drive.google.com/drive/folders/abc123');
    });

    it('embed state updates correctly if user pastes a SECOND different YouTube link', () => {
        // First link already stripped, embed showing video A
        const prevYoutubeId = 'videoAAA';
        // User pastes a new link (video B)
        const htmlWithNewLink = `<p>text</p><a href="https://youtu.be/videoBBB">link</a>`;
        const { youtubeId: afterSave } = simulateTriggerSave(htmlWithNewLink, prevYoutubeId, null);
        expect(afterSave).toBe('videoBBB'); // new video takes over
    });

    it('both YouTube and Drive embeds can coexist independently', () => {
        // YouTube stripped, Drive still in HTML
        const htmlMixed = `<a href="https://drive.google.com/drive/folders/xyz">Drive</a><p>text</p>`;
        const { youtubeId, driveUrl } = simulateTriggerSave(htmlMixed, 'youtubeAAA', null);
        expect(youtubeId).toBe('youtubeAAA'); // preserved (not in HTML)
        expect(driveUrl).toBe('https://drive.google.com/drive/folders/xyz'); // newly found
    });
});

describe('edge cases', () => {
    it('handles empty editor HTML without crashing', () => {
        expect(findYoutubeIdInHtml('')).toBeNull();
        expect(findDriveLinkInHtml('')).toBeNull();
        expect(stripYoutubeLinksFromHtml('')).toBe('');
        expect(stripDriveLinksFromHtml('')).toBe('');
    });

    it('handles YouTube link with extra query params (si= tracking)', () => {
        const html = `<a href="https://youtu.be/L55_qzr-mVo?si=sEdmt66NUac4YPxb">link</a>`;
        expect(findYoutubeIdInHtml(html)).toBe('L55_qzr-mVo');
    });

    it('strips multiple YouTube links in one HTML string', () => {
        const html = `<a href="https://youtu.be/aaa">a</a><p>text</p><a href="https://youtu.be/bbb">b</a>`;
        const result = stripYoutubeLinksFromHtml(html);
        expect(result).not.toContain('youtu.be');
        expect(result).toContain('text');
    });

    it('does not strip YouTube links from Drive strip function', () => {
        const html = `<a href="https://youtu.be/abc">yt</a>`;
        expect(stripDriveLinksFromHtml(html)).toContain('youtu.be');
    });
});
