/* ============================================
   FORMAT — utilidades de formato
   ============================================ */

const Format = (() => {

  function money(n, config) {
    const sym = (config && config.simboloMoneda) || "$";
    const cur = (config && config.moneda) || "USD";
    const val = (Number(n) || 0).toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${sym}${val}`;
  }

  function number(n, dec = 0) {
    return (Number(n) || 0).toLocaleString("es", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }

  function date(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" });
  }

  function dateLong(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("es", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  }

  function todayISO() { return new Date().toISOString().slice(0, 10); }

  function daysBetween(a, b) {
    const ms = new Date(b) - new Date(a);
    return Math.round(ms / 86400000);
  }

  function daysSince(iso) { return daysBetween(iso, new Date()); }

  function ageString(isoBorn) {
    if (!isoBorn) return "—";
    const d = daysSince(isoBorn);
    if (d < 30) return `${d} dias`;
    if (d < 365) return `${Math.floor(d / 30)}m ${d % 30}d`;
    return `${Math.floor(d / 365)}a ${Math.floor((d % 365) / 30)}m`;
  }

  function pct(n, dec = 1) {
    return `${(Number(n) || 0).toFixed(dec)}%`;
  }

  return { money, number, date, dateLong, todayISO, daysBetween, daysSince, ageString, pct };

})();
