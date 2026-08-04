/* ============================================
   TOAST — notificaciones
   ============================================ */

const Toast = (() => {

  const container = () => document.getElementById("toastContainer");

  function show(message, type = "info", duration = 3500) {
    const icons = { success: "✅", warn: "⚠️", error: "❌", info: "ℹ️" };
    const t = UI.el("div", { class: `toast is-${type}` },
      UI.el("span", {}, icons[type] || "ℹ️"),
      UI.el("span", {}, message)
    );
    container().append(t);
    setTimeout(() => { t.style.opacity = "0"; t.style.transform = "translateX(40px)"; setTimeout(() => t.remove(), 300); }, duration);
  }

  return {
    show,
    success: (m, d) => show(m, "success", d),
    warn: (m, d) => show(m, "warn", d),
    error: (m, d) => show(m, "error", 5000),
    info: (m, d) => show(m, "info", d),
  };

})();
