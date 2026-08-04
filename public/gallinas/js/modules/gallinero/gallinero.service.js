/* ============================================
   GALLINERO.SERVICE
   Ubicaciones -> Modulos (max 100 aves cada uno)
   Separados para evitar enfermedades
   ============================================ */

const GallineroService = (() => {

  function ubicaciones() { return State.get().ubicaciones; }
  function modulos() { return State.get().modulos; }

  function modulo(id) { return State.get().modulos.find(m => m.id === id); }

  function avesEnModulo(moduloId) {
    return State.get().aves.filter(a => a.moduloId === moduloId && !a.vendida && !a.muerta);
  }

  function capacidadDisponible(modulo) {
    const config = State.get().config;
    const cap = modulo.capacidad || config.capacidadModulo;
    const ocupadas = avesEnModulo(modulo.id).length;
    return cap - ocupadas;
  }

  function stats(moduloId) {
    const aves = moduloId ? avesEnModulo(moduloId) : State.get().aves.filter(a => !a.vendida && !a.muerta);
    return {
      total: aves.length,
      hembras: aves.filter(a => a.sexo === "hembra").length,
      machos: aves.filter(a => a.sexo === "macho").length,
      pollitos: aves.filter(a => Format.daysSince(a.nacimiento) < 90).length,
    };
  }

  function addUbicacion({ nombre, direccion, notas }) {
    State.update(d => {
      d.ubicaciones.push({ id: Storage.newId("ubi"), nombre, direccion: direccion || "", notas: notas || "" });
    });
  }

  function updateUbicacion(id, patch) {
    State.update(d => {
      const u = d.ubicaciones.find(x => x.id === id); if (u) Object.assign(u, patch);
    });
  }

  function removeUbicacion(id) {
    const used = State.get().modulos.some(m => m.ubicacionId === id);
    if (used) { Toast.warn("Hay modulos usando esta ubicacion. Reasignalos antes de borrar."); return false; }
    State.update(d => { d.ubicaciones = d.ubicaciones.filter(u => u.id !== id); });
    return true;
  }

  function addModulo({ nombre, ubicacionId, capacidad, notas }) {
    const config = State.get().config;
    const cap = Math.min(Number(capacidad) || config.capacidadModulo, config.capacidadModulo);
    State.update(d => {
      d.modulos.push({ id: Storage.newId("mod"), nombre, ubicacionId, capacidad: cap || 100, notas: notas || "", creadoEn: new Date().toISOString() });
    });
  }

  function updateModulo(id, patch) {
    State.update(d => {
      const m = d.modulos.find(x => x.id === id); if (m) Object.assign(m, patch);
    });
  }

  function removeModulo(id) {
    const conAves = State.get().aves.some(a => a.moduloId === id && !a.vendida && !a.muerta);
    if (conAves) { Toast.warn("Hay aves activas en este modulo. Muevelas antes de borrar."); return false; }
    State.update(d => {
      d.modulos = d.modulos.filter(m => m.id !== id);
      d.posturas = d.posturas.filter(p => p.moduloId !== id);
    });
    return true;
  }

  function asignarAve(aveId, moduloId) {
    State.update(d => {
      const a = d.aves.find(x => x.id === aveId);
      if (!a) return;
      const cap = modulo(moduloId);
      if (!cap) return;
      if (capacidadDisponible(cap) <= 0) { Toast.warn("Modulo lleno (max 100)"); return; }
      a.moduloId = moduloId;
    });
  }

  return {
    ubicaciones, modulos, modulo, avesEnModulo, capacidadDisponible, stats,
    addUbicacion, updateUbicacion, removeUbicacion,
    addModulo, updateModulo, removeModulo, asignarAve,
  };

})();
