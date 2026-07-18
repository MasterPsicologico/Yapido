/**
 * Tests del deep-link router sin dependencias externas — usa node:test (built-in).
 * Ejecutar: `npm test` (o `node --test tests/*.test.mjs`)
 *
 * Estos tests replican la lógica de mapeo del router real (TS). Si cambian las
 * reglas en `src/lib/capacitor/deep-link-router.ts`, replicarlas aquí.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

const KNOWN_HOSTS = new Set(['lavadoras.yapido.click', 'www.lavadoras.yapido.click']);

const PATH_ALIASES = {
  reservar: '/washer',
  rental: '/washer/waiting-room',
  admin: '/admin',
  delivery: '/delivery',
};

function urlToInternalRoute(rawUrl) {
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
      return '/washer/waiting-room/' + id;
    }
    const first = path.replace(/^\//, '').split('/')[0];
    if (first && PATH_ALIASES[first]) {
      const rest = ('' + path).slice(first.length + 1);
      return PATH_ALIASES[first] + rest;
    }
    return path;
  } catch {
    return null;
  }
}

test('universal link root → /', () => {
  assert.equal(urlToInternalRoute('https://lavadoras.yapido.click/'), '/');
});

test('universal link /washer → /washer', () => {
  assert.equal(urlToInternalRoute('https://lavadoras.yapido.click/washer'), '/washer');
});

test('universal link /washer/abc → /washer/abc', () => {
  assert.equal(urlToInternalRoute('https://lavadoras.yapido.click/washer/abc'), '/washer/abc');
});

test('universal link /admin/washer', () => {
  assert.equal(urlToInternalRoute('https://lavadoras.yapido.click/admin/washer'), '/admin/washer');
});

test('alias reservar → /washer', () => {
  assert.equal(urlToInternalRoute('https://lavadoras.yapido.click/reservar'), '/washer');
});

test('custom scheme reservation', () => {
  assert.equal(urlToInternalRoute('lavadoras://washer'), '/washer');
});

test('rental id → waiting-room', () => {
  assert.equal(urlToInternalRoute('https://lavadoras.yapido.click/rental/abc-123'), '/washer/waiting-room/abc-123');
});

test('host desconocido retorna null', () => {
  assert.equal(urlToInternalRoute('https://evil.com/washer'), null);
});

test('URL malformada retorna null', () => {
  assert.equal(urlToInternalRoute('not a url at all'), null);
});

test('www subdomain permitido', () => {
  assert.equal(urlToInternalRoute('https://www.lavadoras.yapido.click/washer'), '/washer');
});
