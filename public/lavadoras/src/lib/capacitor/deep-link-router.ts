/**
 * Deep-link router. Mapea Universal Links y custom scheme a rutas internas.
 * URL esperados:
 *  - https://lavadoras.yapido.click/<ruta>
 *  - lavadoras://<ruta>
 *
 * Ejemplos:
 *  - https://lavadoras.yapido.click/washer              → /washer
 *  - https://lavadoras.yapido.click/admin/washer        → /admin/washer
 *  - lavadoras://rental/abc-123                          → /washer/waiting-room/abc-123
 *  - https://lavadoras.yapido.click/reservar?plan=premium&hours=8 → /washer?plan=premium&hours=8
 */
import { getBridge, isNativePlatform } from './platform';

const KNOWN_HOSTS = new Set(['lavadoras.yapido.click', 'www.lavadoras.yapido.click']);

const PATH_ALIASES: Record<string, string> = {
  reservar: '/washer',
  rental: '/washer/waiting-room',
  admin: '/admin',
  delivery: '/delivery',
};

function urlToInternalRoute(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    let path = '';

    if (url.protocol === 'lavadoras:') {
      path = url.host || url.pathname.replace(/^\/+/, '');
      path = '/' + path;
    } else if (KNOWN_HOSTS.has(url.hostname)) {
      path = url.pathname;
    } else {
      return null;
    }

    path = path.replace(/\/+$/, '') || '/';

    if (path.startsWith('/rental/')) {
      const id = path.split('/')[2];
      return `/washer/waiting-room/${id}`;
    }

    const first = path.replace(/^\//, '').split('/')[0];
    if (first && PATH_ALIASES[first]) {
      return PATH_ALIASES[first] + path.slice(first.length + 1 || 0);
    }

    return path;
  } catch {
    return null;
  }
}

export async function handleDeepLinks(callback: (path: string) => void): Promise<() => void> {
  if (!isNativePlatform()) return () => {};

  const bridge = await getBridge();
  if (!bridge) return () => {};

  const dispatch = (url?: string) => {
    if (!url) return;
    const path = urlToInternalRoute(url);
    if (!path) return;
    callback(path);
  };

  try {
    const initial = await bridge.app.getInitialUrl();
    dispatch(initial?.url);
  } catch (e) {
    console.warn('[deep-link] getInitialUrl failed:', e);
  }

  const handle = await bridge.app.addListener('appUrlOpen', (payload) => dispatch(payload.url));
  return () => {
    handle.remove().catch(() => undefined);
  };
}
