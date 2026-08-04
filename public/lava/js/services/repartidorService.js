/**
 * repartidorService.js
 * Gestión de repartidores: vinculación, desvinculación, porcentajes, ganancias.
 */

const RepartidorService = (function () {

  /**
   * Vincula al usuario actual como repartidor de una tienda usando su código.
   * Esto se invoca desde el perfil del usuario cuando introduce el código.
   * @param {string} codigo
   * @returns {object} tienda a la que queda vinculado
   */
  async function vincularConCodigo(codigo) {
    const user = Auth.currentUser();
    if (!user) throw new Error("Debes iniciar sesión");
    if (!codigo) throw new Error("Ingresa el código");

    const tienda = await TiendaService.verificarCodigo(codigo);
    if (!tienda) throw new Error("El código no corresponde a ninguna tienda");

    if (tienda.repartidores && tienda.repartidores.some(r => r.uid === user.uid)) {
      throw new Error("Ya eres repartidor de esta tienda");
    }

    // Vinculación: damn el porcentaje por defecto
    const nuevoRepartidor = {
      uid: user.uid,
      displayName: user.displayName || "Repartidor",
      phone: user.phone || "",
      photoURL: user.photoURL || "",
      porcentaje: APP_CONFIG.reglas.porcentajeRepartidorDefecto,
      vinculadoEn: Date.now(),
      activo: true,
      gananciasTotal: 0,
      serviciosHechos: 0
    };

    const repartidores = tienda.repartidores || [];
    repartidores.push(nuevoRepartidor);

    await TiendaService.actualizarTienda(tienda.id, { repartidores });

    // Actualiza el rol del usuario a repartidor
    await Auth.updateRole(APP_CONFIG.roles.REPARTIDOR, {
      tiendaId: tienda.id,
      porcentaje: nuevoRepartidor.porcentaje
    });

    return tienda;
  }

  /**
   * Desvincula al repartidor actual de su tienda.
   * Se invoca desde el perfil, con confirmación previa.
   */
  async function desvincular() {
    const user = Auth.currentUser();
    if (!user) throw new Error("No hay sesión");
    if (user.role !== APP_CONFIG.roles.REPARTIDOR || !user.tiendaId) {
      throw new Error("No eres repartidor de ninguna tienda");
    }

    const tienda = await Store.get("tiendas", user.tiendaId);
    if (!tienda) throw new Error("Tienda no encontrada");

    const repartidores = (tienda.repartidores || []).map(r =>
      r.uid === user.uid ? { ...r, activo: false, desvinculadoEn: Date.now() } : r
    );

    await TiendaService.actualizarTienda(tienda.id, { repartidores });

    await Auth.updateProfile({
      role: APP_CONFIG.roles.CLIENTE,
      tiendaId: null,
      porcentaje: null
    });

    return { ok: true };
  }

  /**
   * Revincula al repartidor (cuando ya estaba desvinculado).
   * Se reusa el mismo código original.
   */
  async function revincular(codigo) {
    const user = Auth.currentUser();
    if (!user) throw new Error("No hay sesión");

    const tienda = await TiendaService.verificarCodigo(codigo);
    if (!tienda) throw new Error("Código inválido");

    // Si ya estaba en la lista, reactivarlo
    const encontrado = (tienda.repartidores || []).some(r => r.uid === user.uid);
    let repartidores;
    if (encontrado) {
      repartidores = (tienda.repartidores || []).map(r =>
        r.uid === user.uid ? { ...r, activo: true, desvinculadoEn: null, revinculadoEn: Date.now() } : r
      );
    } else {
      repartidores = [...(tienda.repartidores || []), {
        uid: user.uid,
        displayName: user.displayName || "Repartidor",
        phone: user.phone || "",
        photoURL: user.photoURL || "",
        porcentaje: APP_CONFIG.reglas.porcentajeRepartidorDefecto,
        vinculadoEn: Date.now(),
        activo: true,
        gananciasTotal: 0,
        serviciosHechos: 0
      }];
    }

    await TiendaService.actualizarTienda(tienda.id, { repartidores });
    const porcentajeActual = (repartidores.find(r => r.uid === user.uid) || {}).porcentaje || APP_CONFIG.reglas.porcentajeRepartidorDefecto;
    await Auth.updateRole(APP_CONFIG.roles.REPARTIDOR, {
      tiendaId: tienda.id,
      porcentaje: porcentajeActual
    });

    return tienda;
  }

  /**
   * Como dueño de tienda, modifica el porcentaje de un repartidor vinculado.
   */
  async function setPorcentaje(tiendaId, repartidorUid, porcentaje) {
    if (porcentaje < 0 || porcentaje > 100) throw new Error("Porcentaje debe estar entre 0 y 100");
    const tienda = await Store.get("tiendas", tiendaId);
    if (!tienda) throw new Error("Tienda no encontrada");

    const repartidores = (tienda.repartidores || []).map(r =>
      r.uid === repartidorUid ? { ...r, porcentaje } : r
    );
    await TiendaService.actualizarTienda(tiendaId, { repartidores });

    if (repartidorUid === (Auth.currentUser() || {}).uid) {
      await Auth.updateProfile({ porcentaje });
    }
    return true;
  }

  /**
   * Como dueño, elimina a un repartidor de la tienda.
   */
  async function eliminarRepartidor(tiendaId, repartidorUid) {
    const tienda = await Store.get("tiendas", tiendaId);
    if (!tienda) throw new Error("Tienda no encontrada");
    const repartidores = (tienda.repartidores || []).filter(r => r.uid !== repartidorUid);
    await TiendaService.actualizarTienda(tiendaId, { repartidores });
    return true;
  }

  /**
   * Acredita ganancias a un repartidor cuando termina un servicio.
   * @param tiendaId
   * @param repartidorUid
   * @param valorTotal
   */
  async function acreditarGanancia(tiendaId, repartidorUid, valorTotal) {
    const tienda = await Store.get("tiendas", tiendaId);
    if (!tienda) return;
    const rep = (tienda.repartidores || []).find(r => r.uid === repartidorUid);
    if (!rep) return;
    const porcentaje = rep.porcentaje / 100;
    const ganancia = Math.round(valorTotal * porcentaje);
    rep.gananciasTotal = (rep.gananciasTotal || 0) + ganancia;
    rep.serviciosHechos = (rep.serviciosHechos || 0) + 1;
    const repartidores = (tienda.repartidores || []).map(r => r.uid === repartidorUid ? rep : r);
    await TiendaService.actualizarTienda(tiendaId, {
      repartidores,
      gananciasTotales: (tienda.gananciasTotales || 0) + (valorTotal - ganancia),
      serviciosTotales: (tienda.serviciosTotales || 0) + 1
    });
    return { gananciaRepartidor: ganancia, ingresoTienda: valorTotal - ganancia };
  }

  /**
   * Obtiene las ganancias acumuladas del repartidor actual.
   */
  async function getMisGanancias() {
    const user = Auth.currentUser();
    if (!user || !user.tiendaId) return { total: 0, servicios: 0 };
    const tienda = await Store.get("tiendas", user.tiendaId);
    if (!tienda) return { total: 0, servicios: 0 };
    const rep = (tienda.repartidores || []).find(r => r.uid === user.uid);
    return {
      total: (rep && rep.gananciasTotal) || 0,
      servicios: (rep && rep.serviciosHechos) || 0,
      porcentaje: rep ? rep.porcentaje : 0
    };
  }

  return {
    vincularConCodigo,
    desvincular,
    revincular,
    setPorcentaje,
    eliminarRepartidor,
    acreditarGanancia,
    getMisGanancias
  };
})();

window.RepartidorService = RepartidorService;
