/* ============================================
   STORAGE — Capa de persistencia local
   Versionado de esquema + seed automatico
   ============================================ */

const Storage = (() => {

  const KEY = "gallinas_db_v1";
  const SCHEMA_VERSION = 1;

  const DEFAULT_DB = {
    meta: {
      schemaVersion: SCHEMA_VERSION,
      createdAt: null,
      updatedAt: null,
    },
    config: {
      nombreGranja: "Mi Granja",
      moneda: "USD",
      simboloMoneda: "$",
      capacidadModulo: 100,           // max gallinas por modulo
      diasMortalidadAlerta: 7,        // dias sin postura -> alerta
     diasBajaProduccion: 3,           // racha de dias bajo -> marca baja
      umbralBajaProduccion: 0.4,      // <40% del modulo -> baja
      precioHuevoVenta: 0.25,
      precioGallinaVenta: 8,
      precioGalloVenta: 12,
      pesoGallo: 0,
    },
    ubicaciones: [],     // lugares / fincas
    modulos: [],         // gallineros (modulos de max 100)
    aves: [],            // cada gallina/gallo individual
    posturas: [],        // registros diarios de postura por modulo/ave
    nidadas: [],         // tanda incubadora (20-40 huevos)
    huevosIncubados: [], // huevo individual dentro de nidada
    ventas: [],          // transacciones de venta
    gastos: [],          // transacciones de gasto (comida, etc.)
    depositosComida: [], // stock de comida/purina
    eventos: [],         // log de eventos / alertas IA
    ajustesManuales: [], // correcciones manuales
    predicciones: [],    // historial de predicciones IA
  };

  function _now() { return new Date().toISOString(); }

  function _clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        const fresh = _clone(DEFAULT_DB);
        fresh.meta.createdAt = _now();
        fresh.meta.updatedAt = _now();
        save(fresh);
        return fresh;
      }
      const db = JSON.parse(raw);
      return _migrate(db);
    } catch (e) {
      console.error("[Storage] load error", e);
      const fresh = _clone(DEFAULT_DB);
      fresh.meta.createdAt = _now();
      save(fresh);
      return fresh;
    }
  }

  function save(db) {
    if (!db) return;
    db.meta = db.meta || { schemaVersion: SCHEMA_VERSION };
    db.meta.updatedAt = _now();
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch (e) {
      console.error("[Storage] save error (quota?)", e);
      Toast.error("No se pudo guardar (almacenamiento lleno)");
    }
  }

  function _migrate(db) {
    if (!db.meta) db.meta = { schemaVersion: 0 };
    if (db.meta.schemaVersion < SCHEMA_VERSION) {
      const defaults = _clone(DEFAULT_DB);
      // merge shallow de claves faltantes
      for (const k in defaults) {
        if (db[k] === undefined) db[k] = defaults[k];
      }
      db.meta.schemaVersion = SCHEMA_VERSION;
      save(db);
    }
    return db;
  }

  function exportJSON() {
    const db = load();
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gallinas-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const db = JSON.parse(e.target.result);
          const merged = _migrate(db);
          save(merged);
          resolve(merged);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  function reset() {
    localStorage.removeItem(KEY);
  }

  function newId(prefix = "id") {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  return { load, save, exportJSON, importJSON, reset, newId, DEFAULT_DB, KEY };

})();
