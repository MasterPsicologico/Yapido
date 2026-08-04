/**
 * tiendaService.js
 * Lógica de negocio para tiendas: registro, edición, prioridades, códigos de vinculación.
 */

const TiendaService = (function () {

  /**
   * Registra una nueva tienda.
   * @param {object} datos - { nombre, departamento, ciudad, direccion, telefono, duenoUid, autoAceptacion, lat, lng }
   * @returns {object} tienda creada
   */
  async function registrarTienda(datos) {
    if (!datos.nombre) throw new Error("El nombre es obligatorio");
    if (!datos.departamento) throw new Error("El departamento es obligatorio");
    if (!datos.ciudad) throw new Error("La ciudad es obligatoria");
    if (!datos.duenoUid) throw new Error("Debe haber un dueño autenticado");

    // Categoriza automáticamente por ciudad y departamento
    const tienda = {
      ...datos,
      estado: APP_CONFIG.estadoTienda.ACTIVA,
      autoAceptacion: datos.autoAceptacion ?? APP_CONFIG.autoAceptacion.DESACTIVADA,
      // Genera el código de 6 dígitos para vincular repartidores
      codigoVinculacion: generarCodigo6(),
      prioridad: 999, // Sin prioridad asignada por defecto
      repartidores: [],
      gananciasTotales: 0,
      serviciosTotales: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const saved = await Store.set("tiendas", tienda);

    // Sube el rol del dueño a dueño_tienda
    await Auth.updateRole(APP_CONFIG.roles.DUENO_TIENDA, {
      tiendaId: saved.id,
      departamento: tienda.departamento,
      ciudad: tienda.ciudad
    });

    return saved;
  }

  /**
   * Actualiza una tienda existente.
   */
  async function actualizarTienda(id, datos) {
    const tienda = await Store.get("tiendas", id);
    if (!tienda) throw new Error("Tienda no encontrada");
    return Store.set("tiendas", { ...tienda, ...datos, id });
  }

  /**
   * Activa o desactiva la autoaceptación de una tienda.
   */
  async function toggleAutoAceptacion(id, valor) {
    return actualizarTienda(id, { autoAceptacion: valor });
  }

  /**
   * Genera un nuevo código de vinculación de 6 dígitos.
   */
  function generarCodigo6() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  /**
   * Rota el código de vinculación de una tienda (por seguridad).
   */
  async function regenerarCodigo(tiendaId) {
    const nuevo = generarCodigo6();
    await actualizarTienda(tiendaId, { codigoVinculacion: nuevo });
    return nuevo;
  }

  /**
   * Obtiene la lista de tiendas por ciudad.
   * Esta es la categorización geográfica: solo se mostraran las tiendas
   * cuya ciudad coincida con la que eligió el cliente.
   */
  async function getTiendasByCiudad(ciudad) {
    return Store.getTiendasByCiudad(ciudad);
  }

  /**
   * Obtiene la lista de tiendas por departamento.
   */
  async function getTiendasByDepartamento(departamento) {
    return Store.whereEq("tiendas", "departamento", departamento);
  }

  /**
   * Obtiene todas las tiendas (solo admin principal).
   */
  async function getTodasTiendas() {
    return Store.getAll("tiendas");
  }

  /**
   * Elimina una tienda (solo admin principal o dueño).
   */
  async function eliminarTienda(id) {
    return Store.remove("tiendas", id);
  }

  /**
   * Verifica que el código de vinculación sea válido.
   * @returns {object|null} tienda encontrada o null
   */
  async function verificarCodigo(codigo) {
    const tiendas = await Store.getAll("tiendas");
    return tiendas.find(t => t.codigoVinculacion === codigo) || null;
  }

  /**
   * Lista las tiendas donde el usuario actual está vinculado como dueño.
   */
  async function getTiendasByDueno(duenoUid) {
    return Store.whereEq("tiendas", "duenoUid", duenoUid);
  }

  return {
    registrarTienda,
    actualizarTienda,
    toggleAutoAceptacion,
    regenerarCodigo,
    generarCodigo6,
    getTiendasByCiudad,
    getTiendasByDepartamento,
    getTodasTiendas,
    eliminarTienda,
    verificarCodigo,
    getTiendasByDueno
  };
})();

window.TiendaService = TiendaService;
