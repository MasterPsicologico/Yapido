/**
 * repartidorView.js
 * Panel del repartidor:
 *  - Si no esta vinculado: introduce codigo de 6 digitos para vincularse
 *  - Si esta vinculado: ve sus ganancias (porcentaje total), sus servicios, y pedidos activos para llevar
 */

const RepartidorView = (function () {

  let _gpsWatcher = null;

  async function render() {
    const user = Auth.currentUser();
    if (!user) return;

    if (!user.tiendaId || user.role !== APP_CONFIG.roles.REPARTIDOR) {
      await _mostrarVinculacion();
      return;
    }
    await _mostrarPanelRepartidor(user.tiendaId, user);
  }

  async function _mostrarVinculacion() {
    const wrap = UI.el("div.repartidor-vinc");
    wrap.appendChild(UI.el("h2", {}, ["Vinculate como repartidor"]));
    wrap.appendChild(UI.el("p", {}, ["Si ya tienes una cuenta y tu tienda te dio un codigo de 6 digitos, ingresalo para vincularte."]));

    const inp = UI.el("input.input", { type: "text", maxlength: "6", placeholder: "Codigo de 6 digitos *" });

    const btnVinc = UI.el("button.btn.btn-primary", {
      onclick: async () => {
        if (!inp.value || inp.value.length !== 6) { UI.toast("Ingresa un codigo valido de 6 digitos.", "error"); return; }
        try {
          await RepartidorService.vincularConCodigo(inp.value.trim());
          UI.toast("Vinculado. Ya eres repartidor!");
          render();
        } catch (e) { UI.toast(e.message, "error"); }
      }
    }, ["Vincularme"]);

    wrap.appendChild(UI.el("label", {}, ["Codigo *"]));
    wrap.appendChild(inp);
    wrap.appendChild(btnVinc);
    UI.setVista(wrap, "repartidor-vinc");
  }

  async function _mostrarPanelRepartidor(tiendaId, user) {
    const tienda = await Store.get("tiendas", tiendaId);
    if (!tienda) { UI.toast("Tienda no encontrada", "error"); return; }
    const gan = await RepartidorService.getMisGanancias();

    const wrap = UI.el("div.repartidor-panel");
    wrap.appendChild(UI.el("h2", {}, ["Panel del repartidor"]));
    wrap.appendChild(UI.el("p.tienda-ref", {}, ["Tienda: " + tienda.nombre + " - " + tienda.ciudad]));

    // Tarjeta de ganancias (direccionada al repartidor)
    const card = UI.el("div.ganancias-card");
    card.appendChild(UI.el("div.label", {}, ["Tu porcentaje"]));
    card.appendChild(UI.el("div.porcentaje", {}, [gan.porcentaje + "%"]));
    card.appendChild(UI.el("div.label", {}, ["Ganancias totales"]));
    card.appendChild(UI.el("div.valor", {}, [UI.formatCOP(gan.total)]));
    card.appendChild(UI.el("div.label", {}, ["Servicios hechos"]));
    card.appendChild(UI.el("div.valor", {}, [String(gan.servicios || 0)]));
    wrap.appendChild(card);

    // Tienda asociada - enlace al panel del dueno (si el usuario es tambien dueno)
    if (user.role === APP_CONFIG.roles.DUENO_TIENDA) {
      wrap.appendChild(UI.el("button.btn.btn-secondary", {
        onclick: () => DuenoView.render()
      }, ["Ir al panel de dueno de tienda"]));
    }

    // Boton desvincularse
    wrap.appendChild(UI.el("button.btn.btn-danger", {
      onclick: async () => {
        if (!confirm("Ya no quieres ser repartidor de esta tienda?")) return;
        try {
          await RepartidorService.desvincular();
          UI.toast("Te has desvinculado de la tienda.");
          render();
        } catch (e) { UI.toast(e.message, "error"); }
      }
    }, ["Desvincularme de esta tienda"]));

    // Pedidos disponibles para el repartidor
    wrap.appendChild(await _panelPedidosRepartidor(tiendaId, user));

    // Mi historial de servicios
    wrap.appendChild(await _panelHistorialRepartidor(user.uid));

    // GPS: el repartidor puede compartir su ubicacion en tiempo real
    wrap.appendChild(_panelGps());

    UI.setVista(wrap, "repartidor-panel");
  }

  async function _panelPedidosRepartidor(tiendaId, user) {
    const wrap = UI.el("div.panel-section");
    wrap.appendChild(UI.el("h3", {}, ["Pedidos para llevar"]));
    const pedidos = await PedidoService.getPedidosByTienda(tiendaId);
    // Un repartidor puede tomar un pedido en estado ACEPTADO o CONFIRMADO
    const disponibles = pedidos.filter(p =>
      p.estado === APP_CONFIG.estadoPedido.ACEPTADO ||
      p.estado === APP_CONFIG.estadoPedido.CONFIRMADO ||
      (p.repartidorUid === user.uid && (p.estado === APP_CONFIG.estadoPedido.EN_CAMINO ||
                                         p.estado === APP_CONFIG.estadoPedido.LLEGADA ||
                                         p.estado === APP_CONFIG.estadoPedido.ENTREGADO))
    );
    const lista = UI.el("div.pedidos-lista");
    if (disponibles.length === 0) {
      lista.appendChild(UI.el("p.empty", {}, ["No tienes pedidos activos ahora mismo."]));
    } else {
      disponibles.forEach(p => {
        const card = UI.el("div.pedido-card." + p.estado);
        card.appendChild(UI.el("div.row", { html: "<strong>#" + String(p.id).slice(-6).toUpperCase() + "</strong>" }));
        card.appendChild(UI.el("div.row", {}, ["Cliente: " + (p.nombre || " - ")]));
        card.appendChild(UI.el("div.row", {}, ["Direccion: " + (p.direccion || "por GPS")]));
        if (p.latitude) {
          const distEl = UI.el("div.row", {}, ["Distancia: calculando..."]);
          card.appendChild(distEl);
          //Si el repartidor activa GPS y el pedido ya esta CONFIRMADO, calcula la distancia
        }
        card.appendChild(UI.el("div.row", {}, ["Horas: " + (p.horasSolicitadas) + "h"]));
        card.appendChild(UI.el("div.row", {}, ["Estado: " + p.estado]));

        if (p.estado === APP_CONFIG.estadoPedido.ACEPTADO && !p.repartidorUid) {
          card.appendChild(UI.el("button.btn.btn-primary", {
            onclick: async () => {
              try {
                await PedidoService.aceptarPedido(p.id, false, user.uid);
                UI.toast("Pedido tomado. Ahora confirma el envio.");
                render();
              } catch (e) { UI.toast(e.message, "error"); }
            }
          }, ["Yo lo llevo!"]));
        }
        if (p.repartidorUid === user.uid) {
          if (p.estado === APP_CONFIG.estadoPedido.ACEPTADO) {
            card.appendChild(UI.el("button.btn.btn-primary", {
              onclick: async () => { await PedidoService.confirmarEnvio(p.id); render(); }
            }, ["Confirmar envio"]));
          }
          if (p.estado === APP_CONFIG.estadoPedido.CONFIRMADO) {
            card.appendChild(UI.el("button.btn.btn-secondary", {
              onclick: async () => { await PedidoService.marcarEnCamino(p.id); render(); }
            }, ["Marcar en camino"]));
          }
          if (p.estado === APP_CONFIG.estadoPedido.EN_CAMINO) {
            card.appendChild(UI.el("button.btn.btn-primary", {
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
            }, ["Finalizar y cobrar"]));
          }
        }
        lista.appendChild(card);
      });
    }
    wrap.appendChild(lista);
    return wrap;
  }

  async function _panelHistorialRepartidor(uid) {
    const wrap = UI.el("div.panel-section");
    wrap.appendChild(UI.el("h3", {}, ["Mi historial de servicios"]));
    const pedidos = await PedidoService.getPedidosByRepartidor(uid);
    const completados = pedidos.filter(p => p.estado === APP_CONFIG.estadoPedido.COMPLETADO).sort((a, b) => (b.finalizadoEn || 0) - (a.finalizadoEn || 0));
    const lista = UI.el("div.historial-lista");
    if (completados.length === 0) {
      lista.appendChild(UI.el("p.empty", {}, ["Todavia no has completado servicios."]));
    } else {
      completados.slice(0, 20).forEach(p => {
        const card = UI.el("div.historial-card");
        card.appendChild(UI.el("div", {}, ["#" + String(p.id).slice(-6).toUpperCase()]));
        card.appendChild(UI.el("div", {}, [UI.formatFecha(p.finalizadoEn)]));
        card.appendChild(UI.el("div", {}, ["Horas: " + (p.horasFinales || p.horasSolicitadas)]));
        card.appendChild(UI.el("div", {}, ["Total: " + UI.formatCOP(p.precioFinal || 0)]));
        lista.appendChild(card);
      });
    }
    wrap.appendChild(lista);
    return wrap;
  }

  function _panelGps() {
    const wrap = UI.el("div.panel-section");
    wrap.appendChild(UI.el("h3", {}, ["Compartir ubicacion GPS en tiempo real"]));
    wrap.appendChild(UI.el("p", {}, ["Mientras vas a entregar la lavadora, puedes compartir tu ubicacion para que el cliente vea cómo te acercas."]));
    const estado = UI.el("div.gps-estado", {}, ["GPS inactivo"]);
    const btn = UI.el("button.btn.btn-primary", {
      onclick: () => {
        if (_gpsWatcher) {
          _gpsWatcher.stop();
          _gpsWatcher = null;
          btn.textContent = "Activar GPS";
          estado.textContent = "GPS inactivo";
          return;
        }
        _gpsWatcher = GPS.watchPosition(pos => {
          estado.textContent = "GPS activo: " + pos.latitude.toFixed(5) + ", " + pos.longitude.toFixed(5);
          // Aqui se podria subir a servidor para que el cliente lo vea (en version servidor)
          localStorage.setItem("lavago_repartidor_pos", JSON.stringify({ uid: Auth.currentUser().uid, pos, ts: Date.now() }));
          // Si hay un pedido EN_CAMINO conmigo, revisar si etsa cerca y disparar aviso
          (async () => {
            const pedidos = await PedidoService.getPedidosByRepartidor(Auth.currentUser().uid);
            const enCamino = pedidos.find(p => p.estado === APP_CONFIG.estadoPedido.EN_CAMINO && p.latitude);
            if (enCamino && GPS.estaCercaDe(pos, { latitude: enCamino.latitude, longitude: enCamino.longitude })) {
              await PedidoService.marcarLlegada(enCamino.id);
              UI.toast("Llegaste a destino. Se aviso al cliente!");
              _gpsWatcher && _gpsWatcher.stop();
              _gpsWatcher = null;
              btn.textContent = "Activar GPS";
              estado.textContent = "GPS inactivo";
              render();
            }
          })();
        }, Auth.currentUser().uid);
        btn.textContent = "Detener GPS";
        estado.textContent = "Obteniendo ubicacion...";
      }
    }, ["Activar GPS"]);
    wrap.appendChild(estado);
    wrap.appendChild(btn);
    return wrap;
  }

  return { render };
})();

window.RepartidorView = RepartidorView;
