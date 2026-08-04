/**
 * adminService.js
 * Funciones del administrador principal (el creador de la app):
 * - Listar tiendas por ciudad/departamento
 * - Reordenar prioridades
 * - Resetear prioridades
 * - Ver métricas globales
 */

const AdminService = (function () {

  /**
   * Verifica que el usuario actual sea el admin principal.
   * Se define con un flag isAdmin en el perfil del usuario.
   */
  function _checkAdmin() {
    const user = Auth.currentUser();
    if (!user || !user.isAdmin) throw new Error("No tienes permiso de administrador");
  }

  /**
   * Da permisos de admin principal a un usuario (sólo otro admin puede hacerlo).
   */
  async function promoverAdmin(uid) {
    _checkAdmin();
    const usuario = await Store.where("usuarios", u => u.uid === uid);
    if (!usuario[0]) throw new Error("Usuario no encontrado");
    await Store.set("usuarios", { ...usuario[0], isAdmin: true, role: APP_CONFIG.roles.ADMIN_PRINCIPAL });
    return true;
  }

  /**
   * Lista todas las tiendas con su prioridad por ciudad, en tarjetas organizadas.
   * Devuelve una estructura agrupada por departamento -> { ciudad: [tiendas] }.
   */
  async function listarTiendasPorCiudad() {
    _checkAdmin();
    const tiendas = await TiendaService.getTodasTiendas();
    const agrupadas = {};
    for (const t of tiendas) {
      const dep = t.departamento || "(sin departamento)";
      const ciu = t.ciudad || "(sin ciudad)";
      if (!agrupadas[dep]) agrupadas[dep] = {};
      if (!agrupadas[dep][ciu]) agrupadas[dep][ciu] = [];
      agrupadas[dep][ciu].push(t);
    }
    // En cada ciudad ordena por prioridad
    for (const dep of Object.keys(agrupadas)) {
      for (const ciu of Object.keys(agrupadas[dep])) {
        agrupadas[dep][ciu] = agrupadas[dep][ciu].sort((a, b) => (a.prioridad ?? 999) - (b.prioridad ?? 999));
      }
    }
    return agrupadas;
  }

  /**
   * Lista las tiendas de una ciudad específicas para el admin.
   */
  async function listarTiendasPor(ciudad) {
    _checkAdmin();
    return PrioridadService.getTiendasOrdenadasPorCiudad(ciudad);
  }

  /**
   * Reordena prioridades manualmente — el admin mueve una tienda a un nuevo puesto.
   */
  async function reordenarPrioridad(tiendaId, nuevaPrioridad) {
    _checkAdmin();
    const tienda = await Store.get("tiendas", tiendaId);
    if (!tienda) throw new Error("Tienda no encontrada");
    return PrioridadService.setPrioridad(tiendaId, nuevaPrioridad, tienda.ciudad);
  }

  /**
   * Mueve una tienda arriba/abajo en la lista de prioridad de su ciudad.
   */
  async function moverPrioridad(tiendaId, direccion) {
    _checkAdmin();
    return PrioridadService.moverPrioridad(tiendaId, direccion);
  }

  /**
   * Restablece las prioridades de una ciudad (todos quedan en 999 = sin prioridad).
   */
  async function resetPrioridades(ciudad) {
    _checkAdmin();
    return PrioridadService.resetearPrioridades(ciudad);
  }

  /**
   * Métricas globales para el dashboard del admin.
   */
  async function getMetricasGlobales() {
    _checkAdmin();
    const tiendas = await TiendaService.getTodasTiendas();
    const pedidos = await Store.getAll("pedidos");
    const usuarios = await Store.getAll("usuarios");

    const pedidosCompletados = pedidos.filter(p => p.estado === APP_CONFIG.estadoPedido.COMPLETADO);
    const ingresoTotal = pedidosCompletados.reduce((acc, p) => acc + (p.precioFinal || 0), 0);
    const ciudadesActivas = [...new Set(tiendas.filter(t => t.estado === APP_CONFIG.estadoTienda.ACTIVA).map(t => t.ciudad))];

    return {
      totalTiendas: tiendas.length,
      totalUsuarios: usuarios.length,
      totalPedidos: pedidos.length,
      totalPedidosCompletados: pedidosCompletados.length,
      ingresoTotal,
      ciudadesActivas,
      tiendasPorCiudad: tiendas.reduce((acc, t) => {
        acc[t.ciudad] = (acc[t.ciudad] || 0) + 1;
        return acc;
      }, {})
    };
  }

  return {
    promoverAdmin,
    listarTiendasPorCiudad,
    listarTiendasPor,
    reordenarPrioridad,
    moverPrioridad,
    resetPrioridades,
    getMetricasGlobales
  };
})();

window.AdminService = AdminService;
