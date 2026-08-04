/**
 * store.js
 * Capa de persistencia — emula Firestore usando LocalStorage.
 * Permite colecciones, queries, suscripciones en tiempo real.
 */

const Store = (function () {
  const PREFIX = "lavago_";

  function _key(collection) {
    return PREFIX + collection;
  }

  function _read(collection) {
    const raw = localStorage.getItem(_key(collection));
    if (!raw) return {};
    try { return JSON.parse(raw); } catch { return {}; }
  }

  function _write(collection, data) {
    localStorage.setItem(_key(collection), JSON.stringify(data));
  }

  function _genId() {
    return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
  }

  // Suscriptores en memoria
  const _listeners = {};

  function _notify(collection, eventType, doc) {
    if (!_listeners[collection]) return;
    _listeners[collection].forEach(cb => {
      try { cb({ type: eventType, collection, doc: doc || null }); } catch (e) { console.error(e); }
    });
  }

  /**
   * Crea o actualiza un documento.
   * @param {string} collection
   * @param {object} data  — sin id => crear, con id => actualizar
   * @returns {object} documento guardado (con id)
   */
  async function set(collection, data = {}) {
    const docs = _read(collection);
    let id = data.id;
    if (!id) {
      id = _genId();
      data.id = id;
      data.createdAt = Date.now();
      data.updatedAt = Date.now();
    } else {
      const existing = docs[id] || {};
      data = { ...existing, ...data, updatedAt: Date.now() };
    }
    docs[id] = data;
    _write(collection, docs);
    _notify(collection, data.createdAt === data.updatedAt ? "created" : "updated", data);
    return data;
  }

  /**
   * Obtiene un documento por id.
   */
  async function get(collection, id) {
    const docs = _read(collection);
    return docs[id] || null;
  }

  /**
   * Obtiene todos los documentos de una colección.
   */
  async function getAll(collection) {
    const docs = _read(collection);
    return Object.values(docs);
  }

  /**
   * Query simple: filtra por predicado.
   * @param collection
   * @param {(doc) => boolean} predicate
   */
  async function where(collection, predicate) {
    const docs = await getAll(collection);
    return docs.filter(predicate);
  }

  /**
   * Query por un campo igual a un valor.
   */
  async function whereEq(collection, field, value) {
    return where(collection, doc => doc[field] === value);
  }

  /**
   * Elimina un documento.
   */
  async function remove(collection, id) {
    const docs = _read(collection);
    if (docs[id]) {
      delete docs[id];
      _write(collection, docs);
      _notify(collection, "deleted", { id });
    }
  }

  /**
   * Suscripción a cambios de una colección.
   * @param collection
   * @param {(event) => void} callback
   * @returns {() => void} función para desuscribirse
   */
  function on(collection, callback) {
    if (!_listeners[collection]) _listeners[collection] = [];
    _listeners[collection].push(callback);
    // Notifica el estado inicial
    callback({ type: "initial", collection, docs: Object.values(_read(collection)) });
    return () => {
      _listeners[collection] = (_listeners[collection] || []).filter(cb => cb !== callback);
    };
  }

  /**
   * Consulta tiendas por ciudad.
   */
  async function getTiendasByCiudad(ciudad) {
    return whereEq("tiendas", "ciudad", ciudad);
  }

  return {
    set, get, getAll, where, whereEq, remove, on,
    getTiendasByCiudad
  };
})();

window.Store = Store;
