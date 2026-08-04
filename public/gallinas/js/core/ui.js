/* ============================================
   UI — helpers de renderizado DOM
   ============================================ */

const UI = (() => {

  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const k in attrs) {
      if (k === "class") node.className = attrs[k];
      else if (k === "html") node.innerHTML = attrs[k];
      else if (k === "text") node.textContent = attrs[k];
      else if (k === "dataset") for (const d in attrs.dataset) node.dataset[d] = attrs.dataset[d];
      else if (k.startsWith("on") && typeof attrs[k] === "function") node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      else if (k === "style" && typeof attrs[k] === "object") Object.assign(node.style, attrs[k]);
      else if (attrs[k] != null) node.setAttribute(k, attrs[k]);
    }
    children.flat().forEach(c => {
      if (c == null || c === false) return;
      node.append(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }

  function mount(parent, node) { clear(parent); parent.append(node); }

  function statCard({ label, value, sub = "", status = "" }) {
    return el("div", { class: `stat ${status}` },
      el("div", { class: "stat-label" }, label),
      el("div", { class: "stat-value" }, String(value)),
      sub ? el("div", { class: "stat-sub" }, sub) : null
    );
  }

  function emptyState({ icon = "📭", title = "Vacio", sub = "Aun no hay registros.", action = null }) {
    return el("div", { class: "empty" },
      el("div", { class: "empty-icon" }, icon),
      el("div", { class: "empty-title" }, title),
      el("div", { class: "empty-sub" }, sub),
      action || null
    );
  }

  function badge(text, type = "info") {
    return el("span", { class: `badge badge-${type}` }, text);
  }

  function confirmDialog(message) {
    return new Promise(resolve => {
      Modal.open({
        title: "Confirmar",
        body: el("p", { style: { color: "var(--color-text-muted)" } }, message),
        footer: [
          el("button", { class: "btn btn-ghost", onclick: () => { Modal.close(); resolve(false); } }, "Cancelar"),
          el("button", { class: "btn btn-danger", onclick: () => { Modal.close(); resolve(true); } }, "Confirmar"),
        ],
      });
    });
  }

  return { el, clear, mount, statCard, emptyState, badge, confirmDialog };

})();
