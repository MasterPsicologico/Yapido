/**
 * uiHelpers.js
 * Utilidades comunes para la capa de UI.
 */

const UI = (function () {

  function el(tag, attrs = {}, children = []) {
    const [tagName, ...classes] = tag.split(".");
    const [realTag, id] = tagName.split("#");
    const node = document.createElement(realTag || "div");
    if (id) node.id = id;
    if (classes.length) node.className = classes.join(" ");
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (k === "class") node.className = (node.className ? " " : "") + v;
        else if (k === "dataset") Object.assign(node.dataset, v);
        else if (k === "onclick") node.onclick = v;
        else if (k === "html") node.innerHTML = v;
        else node.setAttribute(k, v);
      }
    }
    if (children) {
      const arr = Array.isArray(children) ? children : [children];
      arr.forEach(c => {
        if (c == null) return;
        if (typeof c === "string") node.appendChild(document.createTextNode(c));
        else node.appendChild(c);
      });
    }
    return node;
  }

  function $(selector, root = document) { return root.querySelector(selector); }
  function $$(selector, root = document) { return Array.from(root.querySelectorAll(selector)); }

  function setVista(html, vista = "") {
    const main = $("#app-main");
    if (!main) return;
    main.innerHTML = "";
    if (typeof html === "string") main.innerHTML = html;
    else if (html instanceof Node) main.appendChild(html);
    if (vista) main.dataset.vista = vista;
  }

  function formatCOP(valor) { return "$" + Number(valor || 0).toLocaleString("es-CO"); }

  function formatFecha(timestamp) {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleString("es-CO", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  }

  function toast(mensaje, tipo = "info") {
    const container = $("#toast-container") || _ensureToastContainer();
    const t = el("div.toast." + tipo, {}, [mensaje]);
    container.appendChild(t);
    setTimeout(() => t.classList.add("show"), 10);
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 3500);
  }

  function _ensureToastContainer() {
    let c = $("#toast-container");
    if (!c) { c = el("div#toast-container.toast-container"); document.body.appendChild(c); }
    return c;
  }

  function modal(titulo, contenido, opts = {}) {
    const overlay = el("div.modal-overlay");
    const card = el("div.modal-card");
    const header = el("div.modal-header", {}, [
      el("h3", {}, [titulo]),
      el("button.btn-close", { onclick: () => overlay.remove() }, ["×"])
    ]);
    const body = el("div.modal-body");
    if (typeof contenido === "string") body.innerHTML = contenido;
    else body.appendChild(contenido);
    card.appendChild(header);
    card.appendChild(body);
    if (opts.footer) {
      const f = el("div.modal-footer");
      if (Array.isArray(opts.footer)) opts.footer.forEach(b => f.appendChild(b));
      else f.innerHTML = opts.footer;
      card.appendChild(f);
    }
    overlay.appendChild(card);
    overlay.onclick = (e) => { if (e.target === overlay && !opts.noCerrarOverlay) overlay.remove(); };
    document.body.appendChild(overlay);
    return { overlay, card, close: () => overlay.remove() };
  }

  function labelRol(rol) {
    switch (rol) {
      case APP_CONFIG.roles.CLIENTE: return "Cliente";
      case APP_CONFIG.roles.REPARTIDOR: return "Repartidor";
      case APP_CONFIG.roles.DUENO_TIENDA: return "Dueño de tienda";
      case APP_CONFIG.roles.ADMIN_PRINCIPAL: return "Admin principal";
    }
    return rol || "Invitado";
  }

  function selectorColombia(onSelect, defaults = { departamentos: ["Departamento...", "Ciudad..."] }) {
    const wrap = el("div.colombia-selector");
    const depSelect = el("select", { class: "dep-select" });
    depSelect.appendChild(el("option", { value: "" }, [defaults.departamentos]));
    ColombiaData.getDepartamentos().forEach(d => depSelect.appendChild(el("option", { value: d }, [d])));
    const ciuSelect = el("select.ciu-select", { disabled: true });
    ciuSelect.appendChild(el("option", { value: "" }, ["Ciudad..."]));

    depSelect.onchange = () => {
      ciuSelect.innerHTML = "";
      ciuSelect.appendChild(el("option", { value: "" }, ["Ciudad..."]));
      if (depSelect.value) {
        const ciudades = ColombiaData.getCiudadesByDepartamento(depSelect.value);
        ciudades.forEach(c => ciuSelect.appendChild(el("option", { value: c }, [c])));
        ciuSelect.disabled = false;
      } else {
        ciuSelect.disabled = true;
      }
      if (onSelect) onSelect(depSelect.value, ciuSelect.value);
    };
    ciuSelect.onchange = () => { if (onSelect) onSelect(depSelect.value, ciuSelect.value); };
    wrap.appendChild(depSelect);
    wrap.appendChild(ciuSelect);
    return {
      wrap,
      get departamento() { return depSelect.value; },
      get ciudad() { return ciuSelect.value; },
      set departamento(v) { depSelect.value = v; depSelect.dispatchEvent(new Event("change")); },
      set ciudad(v) { ciuSelect.value = v; }
    };
  }

  return { el, $, $$, setVista, formatCOP, formatFecha, toast, modal, labelRol, selectorColombia };
})();

window.UI = UI;
