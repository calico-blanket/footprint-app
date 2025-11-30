import { openDB } from "idb";

const DB_NAME = "footprint-db";
const STORE_NAME = "sync-queue";

export interface SyncAction {
    id?: number;
    type: 'add' | 'update' | 'delete';
    collectionPath: string; // e.g., "users/{uid}/records"
    docId?: string; // for update/delete or setDoc
    data?: any; // Record data
    files?: { file: Blob; urlPlaceholder: string }[]; // Files to upload
    timestamp: number;
}

export async function initDB() {
    return openDB(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
            }
        },
    });
}

export async function addToQueue(action: Omit<SyncAction, 'id' | 'timestamp'>) {
    const db = await initDB();
    await db.add(STORE_NAME, { ...action, timestamp: Date.now() });
}

export async function getQueue() {
    const db = await initDB();
    return db.getAll(STORE_NAME);
}

export async function clearQueueItem(id: number) {
    const db = await initDB();
    await db.delete(STORE_NAME, id);
}
