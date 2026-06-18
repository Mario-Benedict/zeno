import React from 'react';

// Perbaikan: public modifier dihapus total sesuai standar kompatibilitas TypeScript compiler (ts1044)
export interface EmbedProvider {
    id: string;
    label: string;
    matcher: (url: string) => boolean;
    getEmbedUrl?: (url: string) => string;
    renderIcon: () => React.ReactElement;
}

export const EMBED_PROVIDERS: EmbedProvider[] = [
    {
        id: 'youtube',
        label: 'YouTube',
        matcher: (url: string) => /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i.test(url),
        getEmbedUrl: (url: string) => {
            const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
            const videoId = match ? match[1] : '';
            return `https://www.youtube.com/embed/${videoId}`;
        },
        renderIcon: () => React.createElement('img', {
            src: 'https://www.youtube.com/s/desktop/28169123/img/favicon_32x32.png',
            alt: 'YouTube',
            className: 'w-6 h-6 shrink-0'
        })
    },
    {
        id: 'google-drive',
        label: 'Google Drive',
        matcher: (url: string) => url.includes('drive.google.com'),
        getEmbedUrl: (url: string) => url.replace('/view', '/preview'),
        renderIcon: () => React.createElement('img', {
            src: 'https://ssl.gstatic.com/docs/doclist/images/drive_2021q4_32dp.png',
            alt: 'Google Drive',
            className: 'w-6 h-6 shrink-0'
        })
    },
    {
        id: 'figma',
        label: 'Figma',
        matcher: (url: string) => url.includes('figma.com/file') || url.includes('figma.com/design'),
        renderIcon: () => React.createElement('img', {
            src: 'https://www.figma.com/assets/favicon.ico',
            alt: 'Figma',
            className: 'w-6 h-6 shrink-0'
        })
    }
];

export const detectEmbedProvider = (url: string): EmbedProvider | null => {
    for (const provider of EMBED_PROVIDERS) {
        if (provider.matcher(url)) return provider;
    }
    return null;
};

export const execFormatSafe = (
    editorRef: React.RefObject<HTMLDivElement | null>,
    command: string,
    value: string = ''
): void => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
};

export const extractAllLinksFromHtml = (html: string): string[] => {
    if (!html) return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const links: string[] = [];
    
    doc.querySelectorAll('a').forEach((anchor) => {
        const href = anchor.getAttribute('href');
        if (href) links.push(href);
    });

    const textContent = doc.body.textContent || '';
    const urlRegex = /(https?:\/\/[^\s<>"\']+)/g;
    let match;
    while ((match = urlRegex.exec(textContent)) !== null) {
        links.push(match[0]);
    }

    return Array.from(new Set(links));
};

export const stripEmbedLinksFromHtml = (html: string): string => {
    if (!html) return '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    let hasChanged = false;

    doc.querySelectorAll('a').forEach((anchor) => {
        anchor.remove();
        hasChanged = true;
    });

    return hasChanged ? doc.body.innerHTML : html;
};