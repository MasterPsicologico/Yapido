/**
 * adminView.js
 * Panel del administrador principal (el creador de la app):
 *  - Dashboard global con metricas
 *  - Lista de tiendas por ciudad, organizadas en tarjetas
 *  - Mover tiendas arriba/abajo para establecer prioridad 1, 2, 3...
 *  - Reset prioridades por ciudad
 *  - Ver y promover otros admins
 */

const AdminView = (function () {

  async function render() {
    const user = Auth.currentUser();
    if (!user || !user.isAdmin) {
      // Si tiene un codigo de admin especial, permitir activarse admin
      const codigo = prompt("Esta seccion es para el admin principal. Ingresa tu codigo de administrador:");
      if (codigo === "LAVAGO2026ADMIN") {
        await Auth.updateProfile({ isAdmin: true, role: APP_CONFIG.roles.ADMIN_PRINCIPAL });
        UI.toast("Acceso de admin principal concedido.");
        render();
        return;
      }
      UI.toast("Sin permisos de admin principal", "error");
      return;
    }
    _mostrarPanel();
  }

  async function _mostrarPanel() {
    const wrap = UI.el("div.admin-panel");
    wrap.appendChild(UI.el("h2", {}, ["Panel del administrador principal"]));

    // Metricas globales
    try {
      const m = await AdminService.getMetricasGlobales();
      const cards = UI.el("div.metricas-grid");
      cards.appendChild(_mCard("Tiendas", String(m.totalTiendas), ""));
      cards.appendChild(_mCard("Usuarios", String(m.totalUsuarios), ""));
      cards.appendChild(_mCard("Pedidos", String(m.totalPedidos), m.totalPedidosCompletados + " completados"));
      cards.appendChild(_mCard("Ingresos globales", UI.formatCOP(m.ingresoTotal), ""));
      wrap.appendChild(cards);
    } catch (e) { UI.toast(e.message, "error"); }

    // Seleccion de ciudad para gestionar prioridades
    wrap.appendChild(UI.el("h3", {}, ["Prioridades por ciudad"]));
    const sc = UI.selectorColombia(async (dep, ciu) => {
      if (ciu) await _actualizarLista(ciu);
    });
    wrap.appendChild(sc.wrap);

    // Contenedor para tarjetas de tiendas
    const lista = UI.el("div.tiendas-prioridad-list#tiendas-prioridad-list");
    lista.appendChild(UI.el("p.hint", {}, ["Selecciona una ciudad para administrar las prioridades de sus tiendas."]));
    wrap.appendChild(lista);

    UI.setVista(wrap, "admin-panel");
  }

  async function _actualizarLista(ciudad) {
    const lista = UI.$("#tiendas-prioridad-list");
    lista.innerHTML = "";
    try {
      const tiendas = await AdminService.listarTiendasPor(ciudad);
      if (tiendas.length === 0) {
        lista.appendChild(UI.el("p.empty", {}, ["No hay tiendas en " + ciudad + " todavia."]));
        return;
      }
      const header = UI.el("div.prioridad-header");
      header.appendChild(UI.el("span", {}, ["Prioridad"]));
      header.appendChild(UI.el("span", {}, ["Tienda"]));
      header.appendChild(UI.el("span", {}, ["Auto-aceptacion"]));
      header.appendChild(UI.el("span", {}, ["Acciones"]));
      lista.appendChild(header);

      const top = UI.el("div.prioridad-top-actions");
      top.appendChild(UI.el("button.btn.btn-ghost", {
        onclick: async () => {
          if (!confirm("Reset prioridades de " + ciudad + " (todas quedan sin orden)?")) return;
          await AdminService.resetPrioridades(ciudad);
          UI.toast("Prioridades reiniciadas");
          await _actualizarLista(ciudad);
        }
      }, ["Reset prioridades"]));
      lista.appendChild(top);

      tiendas.forEach((t, idx) => {
        const tr = UI.el("div.tienda-row");
        tr.appendChild(UI.el("div.pos", {}, [String(idx + 1)]));
        const info = UI.el("div.tienda-info");
        info.appendChild(UI.el("strong", {}, [t.nombre]));
        info.appendChild(UI.el("div.sub", {}, [t.direccion || "Sin direccion"]));
        info.appendChild(UI.el("div.sub", {}, ["Servicios: " + (t.serviciosTotales || 0)]));
        tr.appendChild(info);
        tr.appendChild(UI.el("div.auto-label", {}, [t.autoAceptacion === APP_CONFIG.autoAceptacion.ACTIVADA ? "SI" : "NO"]));

        const actions = UI.el("div.actions");
        actions.appendChild(UI.el("button.btn.btn-secondary", {
          onclick: async () => {
            await AdminService.moverPrioridad(t.id, "arriba");
            await _actualizarLista(ciudad);
          }
        }, ["↑"]));
        actions.appendChild(UI.el("button.btn.btn-secondary", {
          onclick: async () => {
            await AdminService.moverPrioridad(t.id, "abajo");
            await _actualizarLista(ciudad);
          }
        }, ["↓"]));
        actions.appendChild(UI.el("button.btn.btn-ghost", {
          onclick: async () => {
            const nv = prompt("Mover a posicion #:", String(idx + 1));
            if (!nv) return;
            const v = parseInt(nv);
            if (!v) { UI.toast("Numero invalido", "error"); return; }
            await AdminService.reordenarPrioridad(t.id, v);
            await _actualizarLista(ciudad);
          }
        }, ["Mover a #"]));
        tr.appendChild(actions);
        lista.appendChild(tr);
      });
    } catch (e) { UI.toast(e.message, "error"); }
  }

  function _mCard(titulo, valor, sub) {
    return UI.el("div.metric-card", { class: "admin-metric" }, [
      UI.el("div.metric-label", {}, [titulo]),
      UI.el("div.metric-value", {}, [valor]),
      UI.el("div.metric-sub", {}, [sub])
    ]);
  }

  return { render };
})();

window.AdminView = AdminView;
