import React from 'react';
import { detectEmbedProvider } from './utils';

// Mengganti interface prop agar menggunakan kontrak tipe yang jelas tanpa 'any'
interface NoteEmbedCardProps {
    url: string;
}

/**
 * Komponen Representasi Kartu Tautan Luar.
 * 100% menggunakan Tailwind CSS Utility Classes.
 * Menggunakan display inline-block agar bersahabat dengan Selection API (Ctrl+A).
 */
export const NoteEmbedCard = ({ url }: NoteEmbedCardProps): React.ReactElement | null => {
    if (!url) return null;

    const provider = detectEmbedProvider(url);
    const domainName = url.replace(/https?:\/\/(www\.)?/, '').split('/')[0];

    const renderVectorIcon = (): React.ReactElement => {
        if (url.includes('gemini.google.com')) {
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0">
                    <path d="M12 22C12 22 12 17 15 14C18 11 22 11 22 11C22 11 17 11 14 8C11 5 11 2 11 2C11 2 11 7 8 10C5 13 2 13 2 13C2 13 7 13 10 16C13 19 12 22 12 22Z" fill="url(#geminiGrad)" />
                    <defs>
                        <linearGradient id="geminiGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                            <stop offset="0" stopColor="#91B3FA" />
                            <stop offset="0.5" stopColor="#7FA3F7" />
                            <stop offset="1" stopColor="#E0AA94" />
                        </linearGradient>
                    </defs>
                </svg>
            );
        }
        if (provider?.id === 'figma') {
            return (
                <svg width="24" height="24" viewBox="0 0 36 36" fill="none" className="shrink-0">
                    <path d="M12 18c0-3.314 2.686-6 6-6s6 2.686 6 6-2.686 6-6 6-6-2.686-6-6z" fill="#1ABC9C"/>
                    <path d="M12 6c0-3.314 2.686-6 6-6s6 2.686 6 6v12h-12V6z" fill="#EA4335"/>
                    <path d="M24 6c0-3.314 2.686-6 6-6s6 2.686 6 6-2.686 6-6 6h-6V6z" fill="#4285F4"/>
                    <path d="M12 30c0-3.314 2.686-6 6-6h6v6c0 3.314-2.686 6-6 6s-6-2.686-6-6z" fill="#00AC47"/>
                    <path d="M12 18h12v12H12V18z" fill="#FFBA00"/>
                </svg>
            );
        }
        if (provider?.id === 'youtube') {
            return (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0">
                    <path fillRule="evenodd" clipRule="evenodd" d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.115C19.515 3.5 12 3.5 12 3.5s-7.515 0-9.388.548A3.003 3.003 0 0 0 .5 6.163C0 8.046 0 12 0 12s0 3.954.502 5.837a3.003 3.003 0 0 0 2.11 2.115c1.873.548 9.388.548 9.388.548s7.515 0 9.388-.548a3.003 3.003 0 0 0 2.111-2.115C24 15.954 24 12 24 12s0-3.954-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FF0000"/>
                </svg>
            );
        }
        return (
            <img 
                src={`https://www.google.com/s2/favicons?domain=${domainName}&sz=32`} 
                alt={domainName}
                className="w-6 h-6 rounded-md shrink-0 select-none"
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                    e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%237B7B7B" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
                }}
            />
        );
    };

    return (
        <span 
            contentEditable={false} 
            data-embed-url={url}
            className="embed-row-block-container inline-block w-full my-1.5 clear-both select-all pointer-events-auto"
        >
            <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="embed-card-block flex items-center justify-start w-full bg-dark-surface-2 border border-dark-secondary/10 rounded-xl px-4 py-3 no-underline transition-colors duration-150 hover:bg-dark-surface-1 text-dark-primary font-bold cursor-pointer select-all"
            >
                <div className="flex items-center gap-3 overflow-hidden pointer-events-none">
                    {renderVectorIcon()}
                    <span className="truncate text-white font-bold text-normal group-hover:underline">
                        {provider?.id === 'figma' ? 'Figma Resource' : provider ? `${provider.label} Resource` : domainName}
                    </span>
                </div>
            </a>
        </span>
    );
};