/* ============================================
   HELPERS — utilidades generales
   ============================================ */

const H = (() => {

  function uid(prefix = "id") { return Storage.newId(prefix); }

  function groupBy(arr, keyFn) {
    return arr.reduce((acc, x) => {
      const k = keyFn(x);
      (acc[k] = acc[k] || []).push(x);
      return acc;
    }, {});
  }

  function sumBy(arr, keyFn) { return arr.reduce((s, x) => s + (Number(keyFn(x)) || 0), 0); }

  function uniqBy(arr, keyFn) {
    const seen = new Set();
    return arr.filter(x => { const k = keyFn(x); if (seen.has(k)) return false; seen.add(k); return true; });
  }

  function sortBy(arr, keyFn, dir = "asc") {
    const m = dir === "asc" ? 1 : -1;
    return [...arr].sort((a, b) => { const ka = keyFn(a); const kb = keyFn(b); return ka < kb ? -m : ka > kb ? m : 0; });
  }

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function uidSafe(arr) { return arr.length === 0; }

  function lastN(arr, n) { return arr.slice(Math.max(0, arr.length - n)); }

  function range(start, end) { return Array.from({ length: end - start + 1 }, (_, i) => start + i); }

  function byDate(arr, dateField = "fecha") {
    return [...arr].sort((a, b) => new Date(a[dateField]) - new Date(b[dateField]));
  }

  function filterByRange(arr, from, to, dateField = "fecha") {
    return arr.filter(x => {
      const d = x[dateField];
      if (!d) return false;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }

  function avg(arr) { if (!arr.length) return 0; return arr.reduce((s, x) => s + x, 0) / arr.length; }

  function round(v, dec = 2) { const f = Math.pow(10, dec); return Math.round(v * f) / f; }

  function promedioMovil(arr, window) {
    const out = [];
    for (let i = 0; i < arr.length; i++) {
      const slice = arr.slice(Math.max(0, i - window + 1), i + 1);
      out.push(avg(slice));
    }
    return out;
  }

  function daysBetween(a, b) {
    const ms = new Date(b) - new Date(a);
    return Math.round(ms / 86400000);
  }

  function daysSince(iso) { return daysBetween(iso, new Date().toISOString()); }

  function ageString(isoBorn) {
    if (!isoBorn) return "—";
    const d = daysSince(isoBorn);
    if (d < 30) return `${d} dias`;
    if (d < 365) return `${Math.floor(d / 30)}m ${d % 30}d`;
    return `${Math.floor(d / 365)}a ${Math.floor((d % 365) / 30)}m`;
  }

  return { uid, groupBy, sumBy, uniqBy, sortBy, clamp, lastN, range, byDate, filterByRange, avg, round, promedioMovil,
    daysBetween, daysSince, ageString };

})();
