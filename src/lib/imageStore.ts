const DB_NAME = 'charlie-fixes';
const STORE = 'images';
const VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;
const urlCache = new Map<string, string>();

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putImage(id: string, blob: Blob): Promise<void> {
  await tx('readwrite', (s) => s.put(blob, id));
}

export async function getImage(id: string): Promise<Blob | undefined> {
  const result = await tx<Blob | undefined>('readonly', (s) => s.get(id) as IDBRequest<Blob | undefined>);
  return result;
}

export async function deleteImage(id: string): Promise<void> {
  const cached = urlCache.get(id);
  if (cached) {
    URL.revokeObjectURL(cached);
    urlCache.delete(id);
  }
  await tx('readwrite', (s) => s.delete(id));
}

export async function getObjectUrl(id: string): Promise<string | undefined> {
  const cached = urlCache.get(id);
  if (cached) return cached;
  const blob = await getImage(id);
  if (!blob) return undefined;
  const url = URL.createObjectURL(blob);
  urlCache.set(id, url);
  return url;
}
