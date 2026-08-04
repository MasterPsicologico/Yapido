/**
 * pagoService.js
 * Manejo de pagos vía Nequi.
 *
 * Estrategias:
 *  1. Link de pago Nequi (PSE/QR) — abre la URL y el usuario paga en Nequi
 *  2. Botón "Pagar con Nequi" — genera un deeplink nequi://
 *  3. Confirmación POST del webhook (en producción real)
 *
 * En la versión demo se simula la confirmación del pago tras presionar "Confirmé mi pago".
 */

const PagoService = (function () {

  /**
   * Genera un link de pago Nequi dado un valor.
   * @param {number} monto
   * @param {string} pedidoId
   * @param {string} descripcion
   */
  function generarLinkPago(monto, pedidoId, descripcion = "Alquiler de lavadora") {
    const nequi = APP_CONFIG.nequi;
    const ref = "LAVAGO-" + (pedidoId || "").slice(0, 8).toUpperCase();
    // Nequi paga via esta URL con numero del negocio + referencia + valor
    const url = `https://m.nequi.co/bdigital/fcgi/otf/ipayment-dollar/p`;
    // Simulación: parámetros que se usarían en la API de Nequi SDK V1
    const datos = {
      numero_destino: nequi.nequiNumero,
      valor: monto,
      referencia: ref,
      descripcion,
      sandbox: nequi.sandbox
    };
    return {
      urlPago: url + "?data=" + btoa(JSON.stringify(datos)),
      deeplinkNequi: `nequi://pay?numero=${nequi.nequiNumero}&valor=${monto}&ref=${ref}`,
      datosPago: datos
    };
  }

  /**
   * Inicia el proceso de pago.
   * Devuelve un objeto con instrucciones para el cliente.
   * @param {string} pedidoId
   */
  async function iniciarPago(pedidoId) {
    const pedido = await Store.get("pedidos", pedidoId);
    if (!pedido) throw new Error("Pedido no encontrado");
    if (!pedido.precioFinal) throw new Error("El servicio aún no tiene precio final");

    const link = generarLinkPago(pedido.precioFinal, pedidoId);

    // Marca el pedido como "en proceso de pago"
    await Store.set("pedidos", { ...pedido, pagoEstado: "pendiente", pagoLink: link, actualizadoEn: Date.now() });
    Notificaciones.simple("Pago Nequi creado. Abre tu app Nequi para completarlo.", "pago_pending", "💳");
    return link;
  }

  /**
   * Confirma el pago manualmente (por ahora, hasta integrar webhooks Nequi en backend).
   * @param pedidoId
   */
  async function confirmarPagoManual(pedidoId) {
    const pedido = await Store.get("pedidos", pedidoId);
    if (!pedido) throw new Error("Pedido no encontrado");
    if (!pedido.pagoEstado || pedido.pagoEstado === "pendiente") {
      const actualizado = { ...pedido, pagoEstado: "confirmado", pagoConfirmadoEn: Date.now(), actualizadoEn: Date.now() };
      await Store.set("pedidos", actualizado);
      Notificaciones.pagoExitoso(actualizado);
      return actualizado;
    }
    throw new Error("El pago no se pudo confirmar");
  }

  /**
   * Devuelve todos los pagos en proceso (para el admin principal).
   */
  async function getPagosPendientes() {
    return Store.whereEq("pedidos", "pagoEstado", "pendiente");
  }

  return { generarLinkPago, iniciarPago, confirmarPagoManual, getPagosPendientes };
})();

window.PagoService = PagoService;
