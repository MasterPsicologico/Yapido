/**
 * Orquestador offline: snapshot de Firestore → IndexedDB → Service Worker.
 * Llamar a `warm()` en background tras montar la app.
 */
import { saveSnapshot } from './indexeddb-cache';

const COLLECTION_PATHS = [
  { path: 'products', limit: 100 },
  { path: 'stores', limit: 50 },
  { path: 'cities', limit: 25 },
  { path: 'appConfig/washerTypes', limit: 1 },
] as const;

const COLLECTION_NAME = 'snapshot:products';

async function fetchCollection(path: string, limit: number) {
  const res = await fetch(
    `/api/offline-snapshot?path=${encodeURIComponent(path)}&limit=${limit}`,
    { credentials: 'same-origin' },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { items: Array<{ id: string }> };
  return data.items;
}

export async function warm(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('indexedDB' in window)) return;

  try {
    const tasks = COLLECTION_PATHS.map(async ({ path, limit }) => {
      const items = await fetchCollection(path, limit);
      if (!items.length) return;
      const storeName =
        path === 'products'
          ? 'snapshot:products'
          : path === 'stores'
          ? 'snapshot:stores'
          : path === 'cities'
          ? 'snapshot:cities'
          : 'snapshot:washerTypes';
      await saveSnapshot(storeName as typeof COLLECTION_NAME, items as never);
    });
    await Promise.all(tasks);
  } catch (e) {
    console.warn('[offline] warm failed:', e);
  }
}
