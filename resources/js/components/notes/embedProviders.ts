import React from 'react';
import type { TranslationKey } from '@/i18n/dictionary';

export interface EmbedProvider {
  id: string;
  labelKey: TranslationKey;
  matcher: (url: string) => boolean;
  getEmbedUrl?: (url: string) => string;
  renderIcon: (alt: string) => React.ReactElement;
}

export const EMBED_PROVIDERS: EmbedProvider[] = [
  {
    id: 'youtube',
    labelKey: 'notes.embedProviderYouTube',
    // Slashes outside character classes are safely escaped (\/), slashes inside character classes ([^/]) left clean
    matcher: (url: string) =>
      /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i.test(
        url,
      ),
    getEmbedUrl: (url: string) => {
      const match = url.match(
        /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i,
      );
      const videoId = match ? match[1] : '';

      return `https://www.youtube.com/embed/${videoId}`;
    },
    renderIcon: (alt) =>
      React.createElement('img', {
        src: 'https://www.youtube.com/s/desktop/28169123/img/favicon_32x32.png',
        alt,
        className: 'w-6 h-6 shrink-0',
      }),
  },
  {
    id: 'google-drive',
    labelKey: 'notes.embedProviderGoogleDrive',
    matcher: (url: string) => url.includes('drive.google.com'),
    getEmbedUrl: (url: string) => url.replace('/view', '/preview'),
    renderIcon: (alt) =>
      React.createElement('img', {
        src: 'https://ssl.gstatic.com/docs/doclist/images/drive_2021q4_32dp.png',
        alt,
        className: 'w-6 h-6 shrink-0',
      }),
  },
  {
    id: 'figma',
    labelKey: 'notes.embedProviderFigma',
    matcher: (url: string) =>
      url.includes('figma.com/file') || url.includes('figma.com/design'),
    renderIcon: (alt) =>
      React.createElement('img', {
        src: 'https://www.figma.com/assets/favicon.ico',
        alt,
        className: 'w-6 h-6 shrink-0',
      }),
  },
];

export const detectEmbedProvider = (url: string): EmbedProvider | null => {
  for (const provider of EMBED_PROVIDERS) {
    if (provider.matcher(url)) return provider;
  }
  return null;
};
