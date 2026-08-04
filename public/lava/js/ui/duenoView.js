/**
 * duenoView.js
 * Panel del dueno de tienda:
 *  - Si todavia no tiene tienda: asistente para registrar la primera
 *  - Si ya la tiene: panel completo con metricas, repartidores, pedidos, codigo de vinculacion
 */

const DuenoView = (function () {

  async function render() {
    const user = Auth.currentUser();
    if (!user) return;

    if (user.role !== APP_CONFIG.roles.DUENO_TIENDA || !user.tiendaId) {
      await _mostrarRegistroTienda();
      return;
    }
    await _mostrarPanelTienda(user.tiendaId);
  }

  async function _mostrarRegistroTienda() {
    const wrap = UI.el("div.dueno-registro");
    wrap.appendChild(UI.el("h2", {}, ["Registrar tu tienda de lavadoras"]));
    wrap.appendChild(UI.el("p", {}, ["Llena estos datos para crear tu tienda. Se categorizara por departamento y ciudad."]));

    const inpNombre = UI.el("input.input", { type: "text", placeholder: "Nombre de la tienda *" });
    const inpTelefono = UI.el("input.input", { type: "tel", placeholder: "Telefono de la tienda" });
    const inpDireccion = UI.el("textarea.input", { placeholder: "Direccion fisica" });

    const sc = UI.selectorColombia(() => {});
    wrap.appendChild(UI.el("label", {}, ["Nombre *"]));
    wrap.appendChild(inpNombre);
    wrap.appendChild(UI.el("label", {}, ["Telefono"]));
    wrap.appendChild(inpTelefono);
    wrap.appendChild(UI.el("label", {}, ["Direccion"]));
    wrap.appendChild(inpDireccion);
    wrap.appendChild(UI.el("label", {}, ["Departamento y ciudad *"]));
    wrap.appendChild(sc.wrap);

    const lblAuto = UI.el("label.switch", {}, [
      UI.el("input", { type: "checkbox" }),
      UI.el("span", {}, [" Auto-aceptacion: acepta pedidos automaticamente"])
    ]);
    const chkAuto = lblAuto.querySelector("input");
    wrap.appendChild(lblAuto);

    const btnRegistrar = UI.el("button.btn.btn-primary", {
      onclick: async () => {
        if (!inpNombre.value || !sc.departamento || !sc.ciudad) {
          UI.toast("Nombre, departamento y ciudad son obligatorios.", "error");
          return;
        }
        try {
          const user = Auth.currentUser();
          const tienda = await TiendaService.registrarTienda({
            nombre: inpNombre.value.trim(),
            telefono: inpTelefono.value.trim(),
            direccion: inpDireccion.value.trim(),
            departamento: sc.departamento,
            ciudad: sc.ciudad,
            duenoUid: user.uid,
            autoAceptacion: chkAuto.checked
          });
          UI.toast("Tienda registrada. Codigo de vinculacion: " + tienda.codigoVinculacion);
          render();
        } catch (e) { UI.toast(e.message, "error"); }
      }
    }, ["Crear tienda"]);
    wrap.appendChild(btnRegistrar);

    UI.setVista(wrap, "dueno-registro");
  }

  async function _mostrarPanelTienda(tiendaId) {
    const tienda = await Store.get("tiendas", tiendaId);
    if (!tienda) { UI.toast("Tienda no encontrada", "error"); return; }

    const wrap = UI.el("div.dueno-panel");

    // Header
    const header = UI.el("div.panel-header");
    header.appendChild(UI.el("h2", {}, [tienda.nombre]));
    header.appendChild(UI.el("p", {}, [tienda.ciudad + ", " + tienda.departamento]));
    wrap.appendChild(header);

    // Codigo de vinculacion (visible)
    const codigoWrap = UI.el("div.codigo-wrap");
    codigoWrap.appendChild(UI.el("h3", {}, ["Codigo de vinculacion para repartidores"]));
    codigoWrap.appendChild(UI.el("div.codigo-display", {}, [tienda.codigoVinculacion]));
    codigoWrap.appendChild(UI.el("p.hint", {}, ["Comparte este codigo con tus repartidores para que se vinculen a tu tienda."]));
    const btnCopiar = UI.el("button.btn.btn-secondary", {
      onclick: async () => {
        try {
          await navigator.clipboard.writeText(tienda.codigoVinculacion);
          UI.toast("Codigo copiado al portapapeles!");
        } catch (e) {
          prompt("Copia este codigo:", tienda.codigoVinculacion);
        }
      }
    }, ["Copiar codigo"]);
    const btnRegenerar = UI.el("button.btn.btn-ghost", {
      onclick: async () => {
        if (!confirm("Seguro que deseas generar un nuevo codigo? Los repartidores vinculados no se ven afectados pero el codigo anterior deja de funcionar.")) return;
        const nuevo = await TiendaService.regenerarCodigo(tiendaId);
        UI.toast("Nuevo codigo generado: " + nuevo);
        render();
      }
    }, ["Regenerar codigo"]);
    codigoWrap.appendChild(UI.el("div.row", {}, [btnCopiar, btnRegenerar]));
    wrap.appendChild(codigoWrap);

    // Metricas (panel completo del dueno)
    wrap.appendChild(await _panelMetricas(tiendaId));

    // Pedidos entrantes
    wrap.appendChild(await _panelPedidosEntrantes(tiendaId));

    // Repartidores vinculados
    wrap.appendChild(await _panelRepartidores(tiendaId));

    // Auto-aceptacion
    wrap.appendChild(_panelAutoAceptacion(tiendaId, tienda.autoAceptacion));

    UI.setVista(wrap, "dueno-panel");
  }

  async function _panelMetricas(tiendaId) {
    const wrap = UI.el("div.panel-section");
    wrap.appendChild(UI.el("h3", {}, ["Metricas financieras"]));

    const dia = await PedidoService.getIngresosByPeriodo(tiendaId, "dia");
    const semana = await PedidoService.getIngresosByPeriodo(tiendaId, "semana");
    const mes = await PedidoService.getIngresosByPeriodo(tiendaId, "mes");
    const tienda = await Store.get("tiendas", tiendaId);

    const cards = UI.el("div.metricas-grid");
    cards.appendChild(_metricCard("Hoy (dia)", UI.formatCOP(dia.total), dia.count + " servicios"));
    cards.appendChild(_metricCard("Esta semana", UI.formatCOP(semana.total), semana.count + " servicios"));
    cards.appendChild(_metricCard("Este mes", UI.formatCOP(mes.total), mes.count + " servicios"));
    cards.appendChild(_metricCard("Total acumulado", UI.formatCOP(tienda.gananciasTotales || 0), (tienda.serviciosTotales || 0) + " servicios"));

    wrap.appendChild(cards);
    return wrap;
  }

  function _metricCard(titulo, valor, sub) {
    return UI.el("div.metric-card", {}, [
      UI.el("div.metric-label", {}, [titulo]),
      UI.el("div.metric-value", {}, [valor]),
      UI.el("div.metric-sub", {}, [sub])
    ]);
  }

  async function _panelPedidosEntrantes(tiendaId) {
    const wrap = UI.el("div.panel-section");
    wrap.appendChild(UI.el("h3", {}, ["Pedidos asignados"]));
    const lista = UI.el("div.pedidos-lista");
    const pedidos = await PedidoService.getPedidosByTienda(tiendaId);

    if (pedidos.length === 0) {
      lista.appendChild(UI.el("p.empty", {}, ["No hay pedidos pendientes ahora mismo."]));
    }
    pedidos.sort((a, b) => (a.creadoEn || 0) - (b.creadoEn || 0));
    pedidos.forEach(p => {
      const card = UI.el("div.pedido-card." + p.estado);
      card.appendChild(UI.el("div.row", { html: "<strong>#" + String(p.id).slice(-6).toUpperCase() + "</strong>" }));
      card.appendChild(UI.el("div.row", {}, ["Cliente: " + (p.nombre || "(anonimo)")]));
      card.appendChild(UI.el("div.row", {}, ["Tel: " + (p.phone || "-")]));
      card.appendChild(UI.el("div.row", {}, ["Direccion: " + (p.direccion || "GPS")]));
      if (p.latitude) card.appendChild(UI.el("a", { href: GPS.mapsUrl({ latitude: p.latitude, longitude: p.longitude }), target: "_blank" }, ["Ver mapa"]));
      card.appendChild(UI.el("div.row", {}, ["Horas: " + (p.horasFinales || p.horasSolicitadas) + "h"]));
      card.appendChild(UI.el("div.row", {}, ["Estado: " + p.estado]));

      // Boton aceptar (si esta en ASIGNADO y no auto)
      if (p.estado === APP_CONFIG.estadoPedido.ASIGNADO) {
        card.appendChild(UI.el("button.btn.btn-primary", {
          onclick: async () => {
            try {
              await PedidoService.aceptarPedido(p.id);
              UI.toast("Pedido aceptado");
              render();
            } catch (e) { UI.toast(e.message, "error"); }
          }
        }, ["Aceptar pedido"]));
      }
      // Boton confirmar envio (si esta ACEPTADO)
      if (p.estado === APP_CONFIG.estadoPedido.ACEPTADO) {
        card.appendChild(UI.el("button.btn.btn-primary", {
          onclick: async () => {
            try {
              await PedidoService.confirmarEnvio(p.id);
              UI.toast("Envio confirmado");
              render();
            } catch (e) { UI.toast(e.message, "error"); }
          }
        }, ["Confirmar envio"]));
      }
      // Repartidor puede marcar estados en panel (si repartidor es el dueño)
      if (p.estado === APP_CONFIG.estadoPedido.CONFIRMADO) {
        card.appendChild(UI.el("button.btn.btn-secondary", {
          onclick: async () => { await PedidoService.marcarEnCamino(p.id); render(); }
        }, ["Marcar en camino"]));
      }
      if (p.estado === APP_CONFIG.estadoPedido.EN_CAMINO) {
        card.appendChild(UI.el("button.btn.btn-secondary", {
          onclick: async () => { await PedidoService.marcarLlegada(p.id); render(); }
        }, ["Marcar llegada"]));
      }
      if (p.estado === APP_CONFIG.estadoPedido.LLEGADA) {
        card.appendChild(UI.el("button.btn.btn-secondary", {
          onclick: async () => { await PedidoService.entregarLavadora(p.id); render(); }
        }, ["Entregar lavadora"]));
      }
      if (p.estado === APP_CONFIG.estadoPedido.ENTREGADO) {
        card.appendChild(UI.el("button.btn.btn-primary", {
          onclick: async () => { await PedidoService.completarServicio(p.id); render(); }
        }, ["Finalizar servicio y cobrar"]));
      }
      lista.appendChild(card);
    });
    wrap.appendChild(lista);
    return wrap;
  }

  async function _panelRepartidores(tiendaId) {
    const wrap = UI.el("div.panel-section");
    const tienda = await Store.get("tiendas", tiendaId);
    const titulo = UI.el("h3");
    wrap.appendChild(titulo);
    const lista = UI.el("div.repartidores-lista");
    const activos = (tienda.repartidores || []).filter(r => r.activo);
    titulo.textContent = "Repartidores vinculados (" + activos.length + ")";
    if (activos.length === 0) {
      lista.appendChild(UI.el("p.empty", {}, ["Aun no hay repartidores. Comparte el codigo para que se vinculen."]));
    }
    activos.forEach(r => {
      const card = UI.el("div.repartidor-card");
      card.appendChild(UI.el("div", {}, [(r.displayName || "Repartidor") + (r.uid === (Auth.currentUser() || {}).uid ? " (tu)" : "")]));
      card.appendChild(UI.el("div", {}, ["Tel: " + (r.phone || " - ")]));
      card.appendChild(UI.el("div", {}, ["Porcentaje: " + r.porcentaje + "%"]));
      card.appendChild(UI.el("div", {}, ["Ganancias: " + UI.formatCOP(r.gananciasTotal || 0)]));
      card.appendChild(UI.el("div", {}, ["Servicios: " + (r.serviciosHechos || 0)]));

      const btnPorcentaje = UI.el("button.btn.btn-ghost", {
        onclick: () => {
          const v = prompt("Nuevo porcentaje para el repartidor:", r.porcentaje);
          if (v === null) return;
          const nv = parseInt(v);
          if (isNaN(nv) || nv < 0 || nv > 100) { UI.toast("0-100 por favor", "error"); return; }
          RepartidorService.setPorcentaje(tiendaId, r.uid, nv).then(() => { UI.toast("Actualizado"); render(); });
        }
      }, ["Cambiar %"]);
      const btnEliminar = UI.el("button.btn.btn-danger", {
        onclick: async () => {
          if (!confirm("Eliminar a " + (r.displayName || "este repartidor") + "?")) return;
          await RepartidorService.eliminarRepartidor(tiendaId, r.uid);
          UI.toast("Repartidor eliminado");
          render();
        }
      }, ["Eliminar"]);
      card.appendChild(UI.el("div.row", {}, [btnPorcentaje, btnEliminar]));
      lista.appendChild(card);
    });
    wrap.appendChild(lista);
    return wrap;
  }

  function _panelAutoAceptacion(tiendaId, estaActivada) {
    const wrap = UI.el("div.panel-section");
    wrap.appendChild(UI.el("h3", {}, ["Auto-aceptacion de pedidos"]));
    wrap.appendChild(UI.el("p", {}, [
      "Si esta activada, tu tienda acepta automaticamente los pedidos asignados.",
      " Cuando se asigne un pedido, se le notificara al cliente enseguida. Tienes 15 minutos para confirmar el envio manualmente; de lo contrario el pedido pasa a la siguiente tienda."
    ]));
    const btn = UI.el("button.btn." + (estaActivada ? "btn-danger" : "btn-primary"), {
      onclick: async () => {
        await TiendaService.toggleAutoAceptacion(tiendaId, !estaActivada);
        UI.toast(estaActivada ? "Auto-aceptacion desactivada" : "Auto-aceptacion activada");
        render();
      }
    }, [estaActivada ? "Desactivar" : "Activar auto-aceptacion"]);
    wrap.appendChild(btn);
    return wrap;
  }

  return { render };
})();

window.DuenoView = DuenoView;
