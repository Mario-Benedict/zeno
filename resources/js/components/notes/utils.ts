import React from 'react';
import type { EmbedProvider } from './types';

/**
 * Daftar penyedia layanan media luar (Embed Providers) yang didukung oleh editor.
 * Regex sudah dibersihkan dari useless escapes agar lolos standarisasi ESLint.
 */
export const EMBED_PROVIDERS: EmbedProvider[] = [
    {
        id: 'youtube',
        label: 'YouTube',
        matcher: (url: string) => /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i.test(url),
        getEmbedUrl: (url: string) => {
            const match = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i);
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

/**
 * Mendeteksi provider embed berdasarkan URL yang dimasukkan pengguna.
 */
export const detectEmbedProvider = (url: string): EmbedProvider | null => {
    for (const provider of EMBED_PROVIDERS) {
        if (provider.matcher(url)) return provider;
    }
    return null;
};

/**
 * Menjalankan perintah manipulasi dokumen Rich Text format secara aman pada kontainer contentEditable.
 */
export const execFormatSafe = (editorRef: React.RefObject<HTMLDivElement | null>, cmd: string, value: string = '') => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand(cmd, false, value);
};

/**
 * Utility Regex untuk mendeteksi format tautan URL global.
 * Ditulis tanpa backslash (\') pada karakter petik tunggal untuk mematuhi aturan standar linter.
 */
export const urlRegex = /(https?:\/\/[^\s<>"']+)/g;