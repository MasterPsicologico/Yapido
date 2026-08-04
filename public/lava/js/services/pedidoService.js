/**
 * pedidoService.js
 * Sistema de pedidos al estilo Didi/Rappi.
 *
 * Flujo de pedido:
 *   CLIENTE solicita
 *   -> Se asigna automáticamente a la tienda #1 (prioridad) de la ciudad
 *   -> Si la tienda #1 tiene autoAceptacion: pasa a ASIGNADO (notifica al cliente)
 *      - Si no tiene autoAceptacion: la tienda recibe notificación. Si en 5 min no acepta,
 *        el pedido pasa a la siguiente tienda.
 *   -> Tienda/repartidor confirma manualmente (CONFIRMADO) en 15 min o se libera
 *   -> Repartidor en camino -> llegada -> entregado
 *   -> Conoce horas de alquiler, se calcula valor total -> pago Nequi
 */

const PedidoService = (function () {
  const _listeners = [];
  const _timeoutHandlers = {}; // pedidoId -> timer

  function _notify(pedido, evento) {
    _listeners.forEach(cb => cb({ pedido, evento }));
  }

  /**
   * Cliente solicita una lavadora.
   * @param {object} datos - { clienteUid, nombre, phone, direccion, latitude, longitude, horas, notas }
   * @param {string} ciudad
   */
  async function solicitarPedido(datos, ciudad) {
    if (!datos.nombre) throw new Error("El nombre del cliente es obligatorio");
    if (!datos.phone) throw new Error("El teléfono/WhatsApp es obligatorio");
    if (!datos.direccion && !(datos.latitude && datos.longitude)) {
      throw new Error("Debe ingresar una dirección o usar GPS");
    }
    if (!datos.horas || datos.horas < 1) throw new Error("Indica cuántas horas necesitas");

    // Obtiene las tiendas de la ciudad ordenadas por prioridad
    const tiendas = await PrioridadService.getTiendasOrdenadasPorCiudad(ciudad);
    if (tiendas.length === 0) throw new Error("No hay tiendas disponibles en " + ciudad);

    const pedido = {
      ...datos,
      ciudad,
      departamento: ColombiaData.getDepartamentoByCiudad(ciudad),
      estado: APP_CONFIG.estadoPedido.PENDIENTE,
      tiendaAsignadaId: null,
      tiendaHistorial: [], // [{ tiendaId, asignadoEn, razonCambio }]
      repartidorUid: null,
      horasSolicitadas: datos.horas,
      precioCalculado: calcularPrecio(datos.horas),
      precioFinal: null,
      horasFinales: null,
      creadoEn: Date.now(),
      actualizadoEn: Date.now()
    };

    const saved = await Store.set("pedidos", pedido);

    // Dispara la asignación automática (siguiente tienda en prioridad)
    await asignarASiguienteTienda(saved.id);

    _notify(saved, "solicitado");
    return saved;
  }

  /**
   * Asigna el pedido a la siguiente tienda en prioridad que aún no haya intentado.
   */
  async function asignarASiguienteTienda(pedidoId) {
    const pedido = await Store.get("pedidos", pedidoId);
    if (!pedido) return;

    const tiendas = await PrioridadService.getTiendasOrdenadasPorCiudad(pedido.ciudad);
    const intentadas = new Set((pedido.tiendaHistorial || []).map(h => h.tiendaId));
    const siguiente = tiendas.find(t => !intentadas.has(t.id));

    if (!siguiente) {
      // Ninguna tienda tomó el pedido -> se cancela
      const cancelado = { ...pedido, estado: APP_CONFIG.estadoPedido.CANCELADO, razon: "ninguna tienda aceptó en tiempo" };
      await Store.set("pedidos", cancelado);
      _notify(cancelado, "cancelado");
      return;
    }

    // Asigna
    const historial = pedido.tiendaHistorial || [];
    historial.push({ tiendaId: siguiente.id, asignadoEn: Date.now(), razon: "asignacion automatica" });
    const actualizado = {
      ...pedido,
      tiendaAsignadaId: siguiente.id,
      estado: APP_CONFIG.estadoPedido.ASIGNADO,
      tiendaHistorial: historial,
      asignadaEn: Date.now(),
      actualizadoEn: Date.now()
    };
    await Store.set("pedidos", actualizado);
    _notify(actualizado, "asignado");

    // Si la tienda tiene autoaceptación, se acepta automáticamente
    // y a partir de ahí el dueño o repartidor debe confirmar manualmente en 15 min.
    if (siguiente.autoAceptacion === APP_CONFIG.autoAceptacion.ACTIVADA) {
      await aceptarPedido(pedidoId, true);
    } else {
      // Programa timeout: si en 5 min la tienda no acepta, pasa a la siguiente
      _setAceptacionTimeout(pedidoId, siguiente.id);
    }
  }

  /**
   * Programa el timeout de 5 minutos para que una tienda acepte o no.
   */
  function _setAceptacionTimeout(pedidoId, tiendaId) {
    const handler = setTimeout(async () => {
      const pedido = await Store.get("pedidos", pedidoId);
      if (!pedido) return;
      // Sólo releva si todavía está pendiente de aceptación de esta tienda
      if (pedido.estado === APP_CONFIG.estadoPedido.ASIGNADO && pedido.tiendaAsignadaId === tiendaId) {
        // Marca esta tienda como "no aceptó"
        const historial = pedido.tiendaHistorial || [];
        const last = historial[historial.length - 1];
        if (last && last.tiendaId === tiendaId) {
          last.razonCambio = "no acepto en 5 min";
          last.relevoEn = Date.now();
        }
        await Store.set("pedidos", { ...pedido, tiendaHistorial: historial });
        // Pasa a la siguiente
        await asignarASiguienteTienda(pedidoId);
      }
    }, APP_CONFIG.reglas.tiempoEsperaAceptacion);

    _timeoutHandlers[pedidoId] = handler;
  }

  /**
   * La tienda asignada acepta el pedido.
   * @param {boolean} auto true si es auto-aceptación de la tienda
   * @param {string} repartidorUid opcional — repartidor específico que tomará el pedido
   */
  async function aceptarPedido(pedidoId, auto = false, repartidorUid = null) {
    const pedido = await Store.get("pedidos", pedidoId);
    if (!pedido) throw new Error("Pedido no encontrado");
    if (pedido.estado !== APP_CONFIG.estadoPedido.ASIGNADO) throw new Error("El pedido no está asignado");

    clearTimeout(_timeoutHandlers[pedidoId]);
    delete _timeoutHandlers[pedidoId];

    // Marca el último intento del historial como aceptado
    const historial = pedido.tiendaHistorial || [];
    const last = historial[historial.length - 1];
    if (last) {
      last.aceptadoEn = Date.now();
      last.auto = auto;
    }

    const actualizado = {
      ...pedido,
      estado: APP_CONFIG.estadoPedido.ACEPTADO,
      repartidorUid,
      aceptadoEn: Date.now(),
      actualizadoEn: Date.now(),
      // Timestamp limite para la segunda confirmación manual (15 min)
      limiteConfirmacion: Date.now() + APP_CONFIG.reglas.tiempoConfirmacionEnvio
    };
    await Store.set("pedidos", actualizado);

    _notify(actualizado, "aceptado");

    // Programa el timeout de los 15 minutos para segunda confirmación
    _setConfirmacionTimeout(pedidoId);
    return actualizado;
  }

  /**
   * Timeout de 15 minutos para la confirmación manual del envío.
   * Si nadie confirma, el pedido se reasigna a la siguiente tienda.
   */
  function _setConfirmacionTimeout(pedidoId) {
    const handler = setTimeout(async () => {
      const pedido = await Store.get("pedidos", pedidoId);
      if (!pedido) return;
      if (pedido.estado === APP_CONFIG.estadoPedido.ACEPTADO) {
        // No se confirmó a tiempo -> reasigna
        const historial = pedido.tiendaHistorial || [];
        const last = historial[historial.length - 1];
        if (last) last.razonCambio = "no confirmo en 15 min";
        await Store.set("pedidos", { ...pedido, tiendaAsignadaId: null, estado: APP_CONFIG.estadoPedido.PENDIENTE, tiendaHistorial: historial });
        _notify(pedido, "no_confirmado");
        await asignarASiguienteTienda(pedidoId);
      }
    }, APP_CONFIG.reglas.tiempoConfirmacionEnvio);
    _timeoutHandlers[pedidoId + "_confirm"] = handler;
  }

  /**
   * Segunda confirmación manual — el dueño o repartidor confirma que llevará la lavadora.
   */
  async function confirmarEnvio(pedidoId) {
    const pedido = await Store.get("pedidos", pedidoId);
    if (!pedido) throw new Error("Pedido no encontrado");
    if (pedido.estado !== APP_CONFIG.estadoPedido.ACEPTADO) throw new Error("El pedido no está en estado ACEPTADO");

    clearTimeout(_timeoutHandlers[pedidoId + "_confirm"]);
    delete _timeoutHandlers[pedidoId + "_confirm"];

    const actualizado = {
      ...pedido,
      estado: APP_CONFIG.estadoPedido.CONFIRMADO,
      confirmadoEn: Date.now(),
      actualizadoEn: Date.now()
    };
    await Store.set("pedidos", actualizado);
    _notify(actualizado, "confirmado");
    return actualizado;
  }

  /**
   * Repartidor marca "en camino".
   */
  async function marcarEnCamino(pedidoId) {
    return _cambiarEstado(pedidoId, APP_CONFIG.estadoPedido.EN_CAMINO, "en_camino");
  }

  /**
   * Repartidor llega a la ubicación del cliente.
   * Activa la notificación con sonido y vibración — solo se apaga manualmente.
   */
  async function marcarLlegada(pedidoId) {
    return _cambiarEstado(pedidoId, APP_CONFIG.estadoPedido.LLEGADA, "llegada");
  }

  /**
   * Repartidor entrega la lavadora — empieza el alquiler.
   */
  async function entregarLavadora(pedidoId, horasFinales = null) {
    const pedido = await Store.get("pedidos", pedidoId);
    if (!pedido) throw new Error("Pedido no encontrado");
    const horas = horasFinales || pedido.horasSolicitadas;
    const actualizado = {
      ...pedido,
      estado: APP_CONFIG.estadoPedido.ENTREGADO,
      entregadoEn: Date.now(),
      horasFinales: horas,
      actualizadoEn: Date.now()
    };
    await Store.set("pedidos", actualizado);
    _notify(actualizado, "entregado");
    return actualizado;
  }

  /**
   * El repartidor recoge la lavadora — fin del alquiler.
   * Calcula el precio final según las horas reales y dispara el cobro.
   */
  async function completarServicio(pedidoId, horasReales = null) {
    const pedido = await Store.get("pedidos", pedidoId);
    if (!pedido) throw new Error("Pedido no encontrado");
    const horas = horasReales || pedido.horasFinales || pedido.horasSolicitadas;
    const precioFinal = calcularPrecio(horas);

    const actualizado = {
      ...pedido,
      estado: APP_CONFIG.estadoPedido.COMPLETADO,
      horasFinales: horas,
      precioFinal,
      finalizadoEn: Date.now(),
      actualizadoEn: Date.now()
    };
    await Store.set("pedidos", actualizado);

    // Acredita ganancias al repartidor
    if (pedido.repartidorUid && pedido.tiendaAsignadaId) {
      await RepartidorService.acreditarGanancia(pedido.tiendaAsignadaId, pedido.repartidorUid, precioFinal);
    }

    _notify(actualizado, "completado");
    return actualizado;
  }

  /**
   * Cliente o repartidor cancela el pedido.
   */
  async function cancelarPedido(pedidoId, razon = "") {
    const pedido = await Store.get("pedidos", pedidoId);
    if (!pedido) throw new Error("Pedido no encontrado");
    const actualizado = {
      ...pedido,
      estado: APP_CONFIG.estadoPedido.CANCELADO,
      razon,
      canceladoEn: Date.now(),
      actualizadoEn: Date.now()
    };
    await Store.set("pedidos", actualizado);
    clearTimeout(_timeoutHandlers[pedidoId]);
    clearTimeout(_timeoutHandlers[pedidoId + "_confirm"]);
    _notify(actualizado, "cancelado");
    return actualizado;
  }

  /**
   * Cambia el estado del pedido (helper interno).
   */
  async function _cambiarEstado(pedidoId, estado, evento) {
    const pedido = await Store.get("pedidos", pedidoId);
    if (!pedido) throw new Error("Pedido no encontrado");
    const actualizado = { ...pedido, estado, actualizadoEn: Date.now() };
    await Store.set("pedidos", actualizado);
    _notify(actualizado, evento);
    return actualizado;
  }

  /**
   * Calcula el precio según las horas de alquiler.
   * @param {number} horas
   * @returns {number}
   */
  function calcularPrecio(horas) {
    const precio = APP_CONFIG.reglas.precioHoraBase * horas;
    return Math.max(precio, APP_CONFIG.reglas.precioMinimo);
  }

  /**
   * Obtiene pedidos asignados a una tienda específica.
   */
  async function getPedidosByTienda(tiendaId) {
    return Store.where("pedidos", p =>
      p.tiendaAsignadaId === tiendaId &&
      [APP_CONFIG.estadoPedido.ASIGNADO, APP_CONFIG.estadoPedido.ACEPTADO].includes(p.estado)
    );
  }

  /**
   * Obtiene el historial completo de pedidos de una tienda.
   */
  async function getHistorialByTienda(tiendaId) {
    return Store.whereEq("pedidos", "tiendaAsignadaId", tiendaId);
  }

  /**
   * Obtiene los pedidos completados por un repartidor.
   */
  async function getPedidosByRepartidor(repartidorUid) {
    return Store.whereEq("pedidos", "repartidorUid", repartidorUid);
  }

  /**
   * Obtiene los pedidos del cliente actual.
   */
  async function getMisPedidos() {
    const user = Auth.currentUser();
    if (!user) return [];
    return Store.whereEq("pedidos", "clienteUid", user.uid);
  }

  /**
   * Recupera el historial de una tienda para calcular ingresos diarios/semanales/mensuales.
   * @param tiendaId
   * @param {"dia"|"semana"|"mes"} periodo
   */
  async function getIngresosByPeriodo(tiendaId, periodo = "mes") {
    const pedidos = await getHistorialByTienda(tiendaId);
    const completados = pedidos.filter(p => p.estado === APP_CONFIG.estadoPedido.COMPLETADO);

    const ahora = new Date();
    let desde;
    if (periodo === "dia") {
      desde = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime();
    } else if (periodo === "semana") {
      desde = ahora.getTime() - 7 * 24 * 60 * 60 * 1000;
    } else {
      desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1).getTime();
    }

    const enPeriodo = completados.filter(p => (p.finalizadoEn || 0) >= desde);
    const total = enPeriodo.reduce((acc, p) => acc + (p.precioFinal || 0), 0);
    const count = enPeriodo.length;
    return { total, count, pedidos: enPeriodo };
  }

  /**
   * Suscripción a eventos del sistema de pedidos.
   */
  function onEvento(cb) {
    _listeners.push(cb);
    return () => {
      const idx = _listeners.indexOf(cb);
      if (idx !== -1) _listeners.splice(idx, 1);
    };
  }

  return {
    solicitarPedido,
    aceptarPedido,
    confirmarEnvio,
    marcarEnCamino,
    marcarLlegada,
    entregarLavadora,
    completarServicio,
    cancelarPedido,
    calcularPrecio,
    getPedidosByTienda,
    getHistorialByTienda,
    getPedidosByRepartidor,
    getMisPedidos,
    getIngresosByPeriodo,
    onEvento
  };
})();

window.PedidoService = PedidoService;
