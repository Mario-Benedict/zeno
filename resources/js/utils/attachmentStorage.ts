/**
 * IndexedDB utilities for local attachment storage
 */

export interface LocalAttachment {
    id: string;
    name: string;
    size: number;
    type: string;
    dataUrl: string;
    uploadedAt: string;
}

const DB_NAME = 'kanban_attachments';
const DB_VERSION = 1;
const STORE_NAME = 'attachments';

const openDB = (): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });

export const dbGetByCard = async (cardId: string): Promise<LocalAttachment[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const results: LocalAttachment[] = [];
        const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).openCursor();
        req.onsuccess = () => {
            const cursor = req.result;
            if (cursor) {
                if ((cursor.value as any).cardId === cardId) results.push(cursor.value);
                cursor.continue();
            } else resolve(results);
        };
        req.onerror = () => reject(req.error);
    });
};

export const dbPut = async (cardId: string, att: LocalAttachment): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put({ ...att, cardId });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

export const dbDelete = async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

export const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const getFileEmoji = (type: string): string => {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return '📊';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('zip') || type.includes('tar') || type.includes('compress')) return '🗜️';
    if (type.startsWith('video/')) return '🎬';
    if (type.startsWith('audio/')) return '🎵';
    return '📎';
};
