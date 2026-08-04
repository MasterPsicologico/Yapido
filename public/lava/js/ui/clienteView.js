/**
 * clienteView.js
 * Vista principal del cliente - escoge ciudad, ve tiendas y solicita pedidos.
 * Tambien muestra sus pedidos activos.
 */

const ClienteView = (function () {

  let ciudadSeleccionada = null;
  let departamentoSeleccionado = null;

  async function render() {
    const user = Auth.currentUser();
    const wrap = UI.el("div.cliente-view");

    wrap.appendChild(UI.el("h2.section-title", {}, [
      "Hola " + ((user && (user.displayName || user.phone)) || "Invitado")
    ]));

    wrap.appendChild(UI.el("p", {}, ["Donde necesitas la lavadora?"]));

    const sc = UI.selectorColombia((dep, ciu) => {
      departamentoSeleccionado = dep;
      ciudadSeleccionada = ciu;
      if (ciu) cargarTiendas(ciudadSeleccionada);
    });
    wrap.appendChild(sc.wrap);

    const tiendasWrap = UI.el("div.tiendas-grid#tiendas-grid", {}, []);
    wrap.appendChild(UI.el("p.hint", {}, ["Selecciona tu ciudad para ver las tiendas disponibles"]));
    wrap.appendChild(tiendasWrap);

    const pedidosWrap = UI.el("div.mis-pedidos#mis-pedidos");
    pedidosWrap.appendChild(UI.el("h3", {}, ["Pedidos activos"]));
    const btnMisPedidos = UI.el("button.btn.btn-secondary", { onclick: cargarMisPedidos }, ["Actualizar mis pedidos"]);
    pedidosWrap.appendChild(btnMisPedidos);
    const pedidosLista = UI.el("div.pedidos-lista#pedidos-lista");
    pedidosWrap.appendChild(pedidosLista);
    wrap.appendChild(pedidosWrap);

    UI.setVista(wrap, "cliente");
    cargarMisPedidos();
  }

  async function cargarTiendas(ciudad) {
    const grid = UI.$("#tiendas-grid");
    grid.innerHTML = "";
    try {
      const tiendas = await TiendaService.getTiendasByCiudad(ciudad);
      const activas = tiendas.filter(t => t.estado === APP_CONFIG.estadoTienda.ACTIVA);
      if (activas.length === 0) {
        grid.appendChild(UI.el("p.empty", {}, [
          "No hay tiendas disponibles en " + ciudad + " todavia. Se el primero en registrar una."
        ]));
        return;
      }
      activas.forEach(async t => {
        const card = UI.el("div.tienda-card");
        card.appendChild(UI.el("h3", {}, [t.nombre]));
        card.appendChild(UI.el("p", {}, [t.ciudad + ", " + t.departamento]));
        if (t.direccion) card.appendChild(UI.el("p", {}, [t.direccion]));
        if (t.telefono) card.appendChild(UI.el("p", {}, ["Tel: " + t.telefono]));

        const btnPedir = UI.el("button.btn.btn-primary", {
          onclick: () => abrirFormularioPedido(t)
        }, ["Solicitar lavadora"]);
        card.appendChild(btnPedir);
        grid.appendChild(card);
      });
    } catch (e) {
      UI.toast(e.message, "error");
    }
  }

  function abrirFormularioPedido(tienda) {
    const user = Auth.currentUser();
    if (!user || user.isAnonymous) {
      UI.toast("Debes iniciar sesion con Google o telefono para solicitar.", "info");
      return;
    }
    const form = UI.el("div.form-pedido");
    form.appendChild(UI.el("h3", {}, ["Solicitar lavadora de " + tienda.nombre]));

    const inpNombre = UI.el("input.input", {
      type: "text", placeholder: "Tu nombre *",
      value: (user && user.displayName) || ""
    });
    const inpPhone = UI.el("input.input", {
      type: "tel", placeholder: "Tu WhatsApp / telefono *",
      value: (user && user.phone ? user.phone.replace("+57", "") : "")
    });
    const inpDireccion = UI.el("textarea.input", {
      placeholder: "Direccion de tu residencia *"
    });
    const btnGps = UI.el("button.btn.btn-ghost", { onclick: async () => {
      try {
        UI.toast("Obteniendo tu ubicacion GPS...");
        const pos = await GPS.getCurrentPosition();
        btnGps.dataset.lat = pos.latitude;
        btnGps.dataset.lng = pos.longitude;
        UI.toast("GPS capturado: " + pos.latitude.toFixed(5) + ", " + pos.longitude.toFixed(5));
        const enlace = UI.el("a", { target: "_blank", href: GPS.mapsUrl(pos) }, ["Ver en el mapa"]);
        const ya = form.querySelector(".gps-link");
        if (ya) ya.remove();
        enlace.className = "gps-link";
        form.appendChild(enlace);
      } catch (e) { UI.toast(e.message, "error"); }
    } }, ["Usar mi ubicacion GPS"]);

    const inpHoras = UI.el("input.input", { type: "number", min: "1", value: "4" });
    inpHoras.placeholder = "Horas que necesitas la lavadora";
    const labelHoras = UI.el("label", {}, ["Horas de alquiler *"]);

    const inpNotas = UI.el("textarea.input", { placeholder: "Notas (opcional)" });

    const precioPreview = UI.el("div.precio-preview");
    inpHoras.oninput = () => {
      const v = parseInt(inpHoras.value) || 0;
      const precio = PedidoService.calcularPrecio(v);
      precioPreview.textContent = "Aprox. " + UI.formatCOP(precio);
    };
    inpHoras.dispatchEvent(new Event("input"));

    form.appendChild(inpNombre);
    form.appendChild(inpPhone);
    form.appendChild(inpDireccion);
    form.appendChild(btnGps);
    form.appendChild(labelHoras);
    form.appendChild(inpHoras);
    form.appendChild(precioPreview);
    form.appendChild(UI.el("label", {}, ["Notas"]));
    form.appendChild(inpNotas);

    const m = UI.modal("Solicitar lavadora", form, {
      footer: [UI.el("button.btn.btn-primary", {
        onclick: async () => {
          if (!inpNombre.value || !inpPhone.value || (!inpDireccion.value && !(btnGps.dataset.lat))) {
            UI.toast("Completa todos los campos obligatorios (*).", "error");
            return;
          }
          try {
            const pedido = await PedidoService.solicitarPedido({
              clienteUid: user.uid,
              nombre: inpNombre.value.trim(),
              phone: inpPhone.value.trim(),
              direccion: inpDireccion.value.trim(),
              latitude: btnGps.dataset.lat ? parseFloat(btnGps.dataset.lat) : null,
              longitude: btnGps.dataset.lng ? parseFloat(btnGps.dataset.lng) : null,
              horas: parseInt(inpHoras.value) || 1,
              notas: inpNotas.value.trim()
            }, tienda.ciudad);
            UI.toast("Pedido solicitado! Buscando una tienda.");
            m.close();
            cargarMisPedidos();
          } catch (e) { UI.toast(e.message, "error"); }
        }
      }, ["Confirmar pedido"])]
    });
  }

  async function cargarMisPedidos() {
    const lista = UI.$("#pedidos-lista");
    if (!lista) return;
    lista.innerHTML = "";
    try {
      const pedidos = await PedidoService.getMisPedidos();
      if (pedidos.length === 0) {
        lista.appendChild(UI.el("p.empty", {}, ["Aun no tienes pedidos activos."]));
        return;
      }
      pedidos.sort((a, b) => (b.creadoEn || 0) - (a.creadoEn || 0));
      pedidos.forEach(p => {
        const card = UI.el("div.pedido-card." + p.estado);
        card.appendChild(UI.el("div.row", { html: "<strong>#" + String(p.id).slice(-6).toUpperCase() + "</strong>" }));
        card.appendChild(UI.el("div.row", {}, ["Estado: " + _labelEstado(p.estado)]));
        card.appendChild(UI.el("div.row", {}, ["Horas: " + (p.horasFinales || p.horasSolicitadas) + "h"]));
        if (p.precioFinal) card.appendChild(UI.el("div.row", {}, ["Precio: " + UI.formatCOP(p.precioFinal)]));
        if (p.pagoEstado === "pendiente") {
          card.appendChild(UI.el("button.btn.btn-primary", { onclick: async () => {
            const link = await PagoService.iniciarPago(p.id);
            const m = UI.modal("Pago con Nequi", UI.el("div", { html: `
              <p>Valor a pagar: <strong>${UI.formatCOP(p.precioFinal)}</strong></p>
              <p>Abre tu app Nequi y haz el pago a:</p>
              <p>Numero: <strong>${APP_CONFIG.nequi.nequiNumero}</strong></p>
              <p>Referencia: <strong>${link.datosPago.referencia}</strong></p>
              <a href="${link.urlPago}" target="_blank" class="btn btn-nequi">Abrir Nequi</a>
            ` }), {
              footer: [UI.el("button.btn.btn-primary", { onclick: async () => {
                try {
                  await PagoService.confirmarPagoManual(p.id);
                  UI.toast("Pago confirmado. Gracias!");
                  m.close();
                  cargarMisPedidos();
                } catch (e) { UI.toast(e.message, "error"); }
              } }, ["Ya pague (confirmar)"])]
            });
          } }, ["Pagar con Nequi"]));
        }
        if (p.estado === APP_CONFIG.estadoPedido.LLEGADA) {
          card.appendChild(UI.el("div.alert-llegada", { html: "<strong>Tu lavadora ha llegado. Sal a recibirla.</strong>" }));
        }
        if (p.estado === APP_CONFIG.estadoPedido.COMPLETADO && !p.calificacion) {
          card.appendChild(UI.el("button.btn.btn-secondary", {
            onclick: () => _calificar(p)
          }, ["Calificar servicio"]));
        }
        lista.appendChild(card);
      });
    } catch (e) { UI.toast(e.message, "error"); }
  }

  function _calificar(pedido) {
    const estrellas = [1, 2, 3, 4, 5];
    const row = UI.el("div.estrellas");
    estrellas.forEach(n => {
      const b = UI.el("button.estrella", { onclick: () => {
        Store.set("pedidos", { ...pedido, calificacion: n });
        UI.toast("Gracias por calificar!");
        cargarMisPedidos();
        const m = UI.$(".modal-overlay");
        if (m) m.remove();
      } }, ["*"]);
      row.appendChild(b);
    });
    UI.modal("Califica el servicio", row);
  }

  function _labelEstado(estado) {
    const map = {
      pendiente: "Pendiente - buscando tienda",
      asignado: "Tienda asignada",
      aceptado: "Aceptada por la tienda",
      confirmado: "Confirmada - la entregan pronto",
      en_camino: "En camino",
      llegada: "LLEGO - Sal a recibirla!",
      entregado: "Lavadora entregada - en uso",
      completado: "Completado",
      cancelado: "Cancelado"
    };
    return map[estado] || estado;
  }

  return { render };
})();

window.ClienteView = ClienteView;
