/**
 * Lightweight offline queue persistence with IndexedDB fallback to localStorage.
 * API is intentionally small and synchronous-friendly for existing callers.
 */
const DB_NAME = "campreserv-offline";
const STORE = "queues";

function hasIndexedDb() {
  return typeof indexedDB !== "undefined";
}

export async function registerBackgroundSync(tag = "sync-queues") {
  if (typeof window === "undefined") return;
  try {
    const reg = await navigator.serviceWorker?.ready;
    const syncReg = reg as (ServiceWorkerRegistration & { sync?: { register: (tag: string) => Promise<void> } }) | undefined;
    if (syncReg?.sync?.register) {
      await syncReg.sync.register(tag);
    }
  } catch {
    // background sync not available; ignore
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: unknown) {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    return new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // swallow; caller will have written to localStorage already
  }
}

export function loadQueue<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveQueue<T>(key: string, items: T[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // ignore localStorage write issues
  }
  if (hasIndexedDb()) {
    void idbSet(key, items);
  }
}

