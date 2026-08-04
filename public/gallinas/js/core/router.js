/* ============================================
   ROUTER — navegacion SPA por hash/state
   ============================================ */

const Router = (() => {

  const routes = {};
  let current = null;

  function register(name, handler, header) {
    routes[name] = { handler, header: header || { title: name, sub: "" } };
  }

  function go(name) {
    if (!routes[name]) { console.warn("[Router] ruta desconocida:", name); name = "dashboard"; }
    current = name;
    const r = routes[name];

    document.querySelectorAll(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.route === name));
    document.getElementById("headerTitle").textContent = r.header.title;
    document.getElementById("headerSub").textContent = r.header.sub;

    const main = document.getElementById("main");
    UI.clear(main);
    try {
      const view = r.handler();
      if (view instanceof Promise) {
        view.then(v => main.append(v)).catch(e => { console.error(e); main.append(UI.el("div", { class: "empty" }, "Error: " + e.message)); });
      } else if (view) {
        main.append(view);
      }
    } catch (e) {
      console.error("[Router] error en ruta", name, e);
      main.append(UI.el("div", { class: "empty" }, "Error: " + e.message));
    }

    // cierre sidebar mobile
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("scrim").classList.remove("show");
  }

  function init() {
    document.querySelectorAll("[data-route]").forEach(item => {
      item.addEventListener("click", () => go(item.dataset.route));
    });
    go(current || "dashboard");
  }

  return { register, go, init };

})();
