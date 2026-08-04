/* ============================================
   CHART — mini charts en canvas sin libreria
   ============================================ */

const Chart = (() => {

  function _safe(container, fn) {
    if (!container || typeof document !== "undefined" && !document.contains(container)) return false;
    try { fn(); return true; } catch (e) { /* silencio */ return false; }
  }

  function _canvas(parent, cls = "chart-canvas") {
    if (!parent) return null;
    const c = UI.el("canvas", { class: cls, width: 600, height: 240 });
    parent.style.position = "relative";
    parent.append(c);
    return c;
  }

  function line(container, series, opts = {}) {
    if (!container || !document.contains(container)) return;
    UI.clear(container);
    const c = _canvas(container);
    const ctx = c.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    c.width = container.clientWidth * dpr; c.height = 240 * dpr;
    ctx.scale(dpr, dpr);
    const W = container.clientWidth, H = 240;
    const pad = 32;
    const vals = series.flatMap(s => s.data);
    const min = Math.min(...vals, 0), max = Math.max(...vals, 1);
    const range = max - min || 1;
    const labels = opts.labels || [];
    // grid
    ctx.strokeStyle = "#2f3d34"; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad + (H - pad * 2) * (i / 4);
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
      ctx.fillStyle = "#6b7a72"; ctx.font = "10px JetBrains Mono";
      ctx.fillText(Math.round(max - (range * i / 4)), 2, y + 3);
    }
    series.forEach((s, si) => {
      const n = s.data.length;
      if (!n) return;
      ctx.beginPath();
      s.data.forEach((v, i) => {
        const x = pad + (W - pad * 2) * (i / Math.max(1, n - 1));
        const y = pad + (H - pad * 2) * (1 - (v - min) / range);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = s.color || "#f2b705"; ctx.lineWidth = 2; ctx.stroke();
      // points
      if (opts.points) {
        s.data.forEach((v, i) => {
          const x = pad + (W - pad * 2) * (i / Math.max(1, n - 1));
          const y = pad + (H - pad * 2) * (1 - (v - min) / range);
          ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fillStyle = s.color; ctx.fill();
        });
      }
    });
    // x labels
    ctx.fillStyle = "#6b7a72"; ctx.font = "9px JetBrains Mono";
    labels.forEach((l, i) => {
      const x = pad + (W - pad * 2) * (i / Math.max(1, labels.length - 1));
      ctx.fillText(l, x - 8, H - 8);
    });
  }

  function bars(container, data, opts = {}) {
    if (!container || !document.contains(container)) return;
    UI.clear(container);
    const c = _canvas(container);
    const ctx = c.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    c.width = container.clientWidth * dpr; c.height = 240 * dpr;
    ctx.scale(dpr, dpr);
    const W = container.clientWidth, H = 240, pad = 32;
    const max = Math.max(...data.map(d => d.value), 1);
    const bw = (W - pad * 2) / data.length;
    ctx.strokeStyle = "#2f3d34"; ctx.beginPath(); ctx.moveTo(pad, H - pad); ctx.lineTo(W - pad, H - pad); ctx.stroke();
    data.forEach((d, i) => {
      const x = pad + i * bw + 4;
      const h = (H - pad * 2) * (d.value / max);
      ctx.fillStyle = d.color || "#f2b705";
      ctx.fillRect(x, H - pad - h, bw - 8, h);
      ctx.fillStyle = "#9aa8a0"; ctx.font = "9px JetBrains Mono";
      ctx.fillText(String(d.value), x, H - pad - h - 4);
      if (d.label) {
        ctx.fillStyle = "#6b7a72";
        ctx.fillText(d.label, x, H - pad + 12);
      }
    });
  }

  function donut(container, segments, opts = {}) {
    if (!container || !document.contains(container)) return;
    UI.clear(container);
    const c = _canvas(container);
    const ctx = c.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    c.width = 240 * dpr; c.height = 240 * dpr;
    ctx.scale(dpr, dpr);
    const size = 240, cx = size / 2, cy = size / 2, r = 84, lw = 28;
    const total = segments.reduce((s, x) => s + x.value, 0) || 1;
    let start = -Math.PI / 2;
    segments.forEach(seg => {
      const ang = (seg.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, start, start + ang);
      ctx.strokeStyle = seg.color || "#f2b705"; ctx.lineWidth = lw; ctx.stroke();
      start += ang;
    });
    ctx.fillStyle = "#e8efe9"; ctx.font = "bold 22px JetBrains Mono"; ctx.textAlign = "center";
    ctx.fillText(opts.centerText || String(total), cx, cy + 6);
    ctx.fillStyle = "#9aa8a0"; ctx.font = "11px Inter"; ctx.textAlign = "center";
    ctx.fillText(opts.centerLabel || "total", cx, cy + 24);
  }

  return { line, bars, donut };

})();