/**
 * prioridadService.js
 * Maneja la prioridad de las tiendas por ciudad/departamento.
 * Prioriza la asignación de pedidos — automática + manual (solo admin principal).
 *
 * Reglas:
 * - El admin principal puede asignar prioridad 1, 2, 3... a las tiendas por ciudad.
 * - Cuando entra un pedido, se asigna a la tienda #1 de esa ciudad.
 * - Si la #1 no acepta en 5 minutos, pasa a la siguiente.
 * - Si la #1 tiene autoaceptación activada, se acepta automáticamente.
 */

const PrioridadService = (function () {

  /**
   * Lista las tiendas de una ciudad ordenadas por prioridad.
   * Las tiendas con prioridad 999 (sin asignar) van al final.
   */
  async function getTiendasOrdenadasPorCiudad(ciudad) {
    const tiendas = await TiendaService.getTiendasByCiudad(ciudad);
    // Solo tiendas activas
    const activas = tiendas.filter(t => t.estado === APP_CONFIG.estadoTienda.ACTIVA);
    activas.sort((a, b) => (a.prioridad ?? 999) - (b.prioridad ?? 999));
    return activas;
  }

  async function getTiendasOrdenadasPorDepartamento(departamento) {
    const tiendas = await TiendaService.getTiendasByDepartamento(departamento);
    const activas = tiendas.filter(t => t.estado === APP_CONFIG.estadoTienda.ACTIVA);
    activas.sort((a, b) => (a.prioridad ?? 999) - (b.prioridad ?? 999));
    return activas;
  }

  /**
   * Asigna prioridad manualmente a una tienda (solo admin principal).
   * Al asignar prioridad N, las tiendas con prioridad >= N se reordenan:
   *  - La anterior N pasa a ser N+1, etc.
   */
  async function setPrioridad(tiendaId, prioridad, ciudad) {
    if (prioridad < 1) throw new Error("Prioridad mínima es 1");
    const tiendasCiudad = await getTiendasOrdenadasPorCiudad(ciudad);

    // Reordena: desplaza las tiendas cuya prioridad >= nueva para abajo
    const target = tiendasCiudad.find(t => t.id === tiendaId);
    if (!target) throw new Error("La tienda no pertenece a esa ciudad");

    const otras = tiendasCiudad.filter(t => t.id !== tiendaId);

    // Asigna prioridad en orden incremental
    let n = 1;
    for (const t of otras) {
      // Si esta posicion quedaria >= nueva, salta el slot
      if (n === prioridad) n++;
      t.prioridad = n;
      await TiendaService.actualizarTienda(t.id, { prioridad: t.prioridad });
      n++;
    }
    target.prioridad = prioridad;
    await TiendaService.actualizarTienda(tiendaId, { prioridad });
  }

  /**
   * Reordena automáticamente prioridades tras cualquier cambio.
   * Llena huecos: 1, 2, 3, 5, 9 -> 1, 2, 3, 4, 5
   */
  async function normalizarPrioridades(ciudad) {
    const tiendas = await getTiendasOrdenadasPorCiudad(ciudad);
    let n = 1;
    for (const t of tiendas) {
      if (t.prioridad !== n) {
        t.prioridad = n;
        await TiendaService.actualizarTienda(t.id, { prioridad: t.prioridad });
      }
      n++;
    }
  }

  /**
   * Mueve una tienda arriba o abajo en la lista de prioridad de su ciudad.
   * @param tiendaId
   * @param {"arriba"|"abajo"} direccion
   */
  async function moverPrioridad(tiendaId, direccion) {
    const tienda = await Store.get("tiendas", tiendaId);
    if (!tienda) throw new Error("Tienda no encontrada");
    const ordenadas = await getTiendasOrdenadasPorCiudad(tienda.ciudad);
    const idx = ordenadas.findIndex(t => t.id === tiendaId);
    if (idx < 0) return;

    if (direccion === "arriba" && idx > 0) {
      const anterior = ordenadas[idx - 1];
      await TiendaService.actualizarTienda(tienda.id, { prioridad: anterior.prioridad });
      await TiendaService.actualizarTienda(anterior.id, { prioridad: anterior.prioridad + 1 });
    } else if (direccion === "abajo" && idx < ordenadas.length - 1) {
      const siguiente = ordenadas[idx + 1];
      await TiendaService.actualizarTienda(tienda.id, { prioridad: siguiente.prioridad });
      await TiendaService.actualizarTienda(siguiente.id, { prioridad: siguiente.prioridad - 1 });
    }
  }

  /**
   * Limpia el orden de prioridad de todas las tiendas de una ciudad
   * (solo admin principal — útil cuando se quiere reiniciar la lista).
   */
  async function resetearPrioridades(ciudad) {
    const tiendas = await TiendaService.getTiendasByCiudad(ciudad);
    for (const t of tiendas) {
      await TiendaService.actualizarTienda(t.id, { prioridad: 999 });
    }
  }

  return {
    getTiendasOrdenadasPorCiudad,
    getTiendasOrdenadasPorDepartamento,
    setPrioridad,
    normalizarPrioridades,
    moverPrioridad,
    resetearPrioridades
  };
})();

window.PrioridadService = PrioridadService;
