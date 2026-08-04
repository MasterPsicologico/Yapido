/**
 * pedidoRouter.js
 * Conecta eventos del sistema de pedidos con el sistema de notificaciones.
 * Cada vez que cambie un estado de pedido, router evalúa a quién notificar.
 */

const PedidoRouter = (function () {

  let _init = false;

  function init() {
    if (_init) return;
    _init = true;
    PedidoService.onEvento(handleEvento);
  }

  async function handleEvento(ev) {
    const pedido = ev.pedido;
    switch (ev.evento) {
      case "solicitado":
        // El pedido apenas fue creado por el cliente.
        // Aún no se ha asignado, no se notifica al cliente aquí.
        break;
      case "asignado":
        // El sistema asignó a una tienda: notifica a la tienda y repartidores vinculados
        if (pedido.tiendaAsignadaId) {
          const tienda = await Store.get("tiendas", pedido.tiendaAsignadaId);
          if (tienda) {
            if (tienda.autoAceptacion === APP_CONFIG.autoAceptacion.ACTIVADA) {
              // La tienda acepta automáticamente, notificamos al cliente
              Notificaciones.pedidoAsignadoCliente(pedido);
            } else {
              Notificaciones.nuevoPedidoTienda(pedido, tienda);
              // Notifica a cada repartidor activo vinculado a la tienda
              (tienda.repartidores || []).filter(r => r.activo).forEach(r => {
                Notificaciones.nuevoPedidoRepartidor(pedido, tienda);
              });
            }
          }
        }
        break;
      case "aceptado":
        // Alguien aceptó. Si viene de auto-aceptación, ya se notificó al cliente con "asignado".
        // Aquí igual informamos al cliente que está en proceso de confirmación
        break;
      case "confirmado":
        Notificaciones.pedidoConfirmadoCliente(pedido);
        break;
      case "en_camino":
        Notificaciones.repartidorEnCaminoCliente(pedido);
        break;
      case "llegada":
        Notificaciones.repartidorLlegoCliente(pedido);
        break;
      case "entregado":
        // No se notifica explícitamente — el usuario recibe la lavadora en este momento
        break;
      case "completado":
        const tienda = await Store.get("tiendas", pedido.tiendaAsignadaId);
        const rep = tienda && (tienda.repartidores || []).find(r => r.uid === pedido.repartidorUid);
        const ganancia = rep ? Math.round((pedido.precioFinal || 0) * rep.porcentaje / 100) : 0;
        if (tienda) Notificaciones.pedidoCompletadoTienda(pedido);
        if (rep) Notificaciones.pedidoCompletadoRepartidor(pedido, ganancia);
        break;
      case "cancelado":
        Notificaciones.simple(`El pedido #${String(pedido.id).slice(-6).toUpperCase()} fue cancelado.`,
          "pedido_cancelado", "⚠️");
        break;
      case "no_confirmado":
        Notificaciones.pedidoTimeoutTienda(pedido);
        break;
    }
  }

  function stop() {
    // En realidad no se puede quitar el callback de PedidoService, porque está embebido.
    // Pero basta con no llamar init de nuevo.
    _init = true;
  }

  return { init, stop };
})();

window.PedidoRouter = PedidoRouter;
