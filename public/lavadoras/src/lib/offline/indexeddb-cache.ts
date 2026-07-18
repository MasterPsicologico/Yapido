/**
 * Capa de cache offline basada en IndexedDB (sin dependencias externas).
 * Guarda snapshots de colecciones críticas (productos, tiendas, perfil, ciudades)
 * que el SW puede servir cuando no hay red.
 *
 * Versión del schema incrementa cuando cambia la forma. SW hace `caches.delete`
 * por nombre, y cada colección incluye `version` para invalidar.
 */
const DB_NAME = 'lav-offline';
const DB_VERSION = 1;

const STORES = ['snapshot:profile', 'snapshot:products', 'snapshot:stores', 'snapshot:cities', 'snapshot:washerTypes'] as const;
type StoreName = (typeof STORES)[number];

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: 'id' });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(name: StoreName, mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(name, mode);
    const store = t.objectStore(name);
    const req = fn(store);
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
    t.oncomplete = () => db.close();
    t.onerror = () => {
      db.close();
      reject(t.error);
    };
  });
}

export interface VersionedSnapshot {
  id: string;
  version: string;
  savedAt: number;
  payload: unknown;
}

export async function saveSnapshot<T>(name: StoreName, items: T[] & { id: string }[]): Promise<void> {
  const stamped: VersionedSnapshot[] = items.map((it) => ({
    id: (it as unknown as { id: string }).id,
    version: `${DB_VERSION}`,
    savedAt: Date.now(),
    payload: it,
  }));
  await tx('snapshot:cities' as StoreName, 'readwrite', (store) => store.clear()).catch(() => undefined);
  const cleaned: VoidFunction[] = [];
  await Promise.all(
    stamped.map(
      (entry) =>
        new Promise<void>((resolve, reject) => {
          const dbPromise = openDb();
          dbPromise
            .then((db) => {
              const t = db.transaction(name, 'readwrite');
              const store = t.objectStore(name);
              const req = store.put(entry);
              req.onsuccess = () => {
                resolve();
                db.close();
              };
              req.onerror = () => {
                reject(req.error);
                db.close();
              };
            })
            .catch(reject);
        }),
    ),
  );
  void cleaned;
}

export async function loadSnapshot<T>(name: StoreName): Promise<T[]> {
  return tx<VersionedSnapshot[]>(name, 'readonly', (store) => store.getAll() as IDBRequest<VersionedSnapshot[]>).then(
    (rows) => rows.map((r) => r.payload as T),
  );
}

export async function clear(): Promise<void> {
  const db = await openDb();
  for (const name of STORES) {
    if (!db.objectStoreNames.contains(name)) continue;
    await new Promise<void>((resolve, reject) => {
      const t = db.transaction(name, 'readwrite');
      t.objectStore(name).clear();
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
    });
  }
  db.close();
}
