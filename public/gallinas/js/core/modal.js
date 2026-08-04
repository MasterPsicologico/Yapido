/* ============================================
   MODAL — contenedor unico de modales
   ============================================ */

const Modal = (() => {

  function open({ title, body, footer = [], size = "md" }) {
    close();
    const backdrop = UI.el("div", { class: "modal-backdrop", onclick: (e) => { if (e.target === backdrop) close(); } });
    const modal = UI.el("div", { class: "modal" },
      UI.el("div", { class: "modal-header" },
        UI.el("div", { class: "modal-title" }, title),
        UI.el("button", { class: "modal-close", onclick: close }, "×")
      ),
      UI.el("div", { class: "modal-body" }, body),
      footer.length ? UI.el("div", { class: "modal-footer" }, ...footer) : null
    );
    if (size === "lg") modal.style.maxWidth = "820px";
    if (size === "sm") modal.style.maxWidth = "420px";
    backdrop.append(modal);
    document.body.append(backdrop);
    return backdrop;
  }

  function close() {
    document.querySelectorAll(".modal-backdrop").forEach(m => m.remove());
  }

  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });

  return { open, close };

})();
