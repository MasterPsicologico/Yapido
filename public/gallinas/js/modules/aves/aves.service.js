/* ============================================
   AVES.SERVICE — CRUD de aves individuales
   + metricas de postura por ave
   ============================================ */

const AvesService = (() => {

  function all() { return State.get().aves; }
  function activas() { return all().filter(a => !a.vendida && !a.muerta); }

  function byId(id) { return all().find(a => a.id === id); }

  function posturasAve(aveId) {
    return State.get().posturas.filter(p => p.aveId === aveId).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  }

  function metricas(ave) {
    const ps = posturasAve(ave.id);
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const last30 = ps.filter(p => new Date(p.fecha) > new Date(hoy.getTime() - 30 * 86400000));
    const last7 = ps.filter(p => new Date(p.fecha) > new Date(hoy.getTime() - 7 * 86400000));
    const totalHuevos = H.sumBy(ps, p => p.cantidad);
    const diasPostura = new Set(ps.map(p => p.fecha)).size;
    const tasa = diasPostura ? (totalHuevos / diasPostura) : 0;
    const diasSinPostura = ps.length ? H.daysBetween(ps[ps.length - 1].fecha, hoy.toISOString()) : 999;
    const edadDias = Format.daysSince(ave.nacimiento);
    return {
      totalHuevos,
      diasPostura,
      tasa: H.round(tasa, 2),
      promedio7: H.round(last7.length ? H.sumBy(last7, p => p.cantidad) / 7 : 0, 2),
      promedio30: H.round(last30.length ? H.sumBy(last30, p => p.cantidad) / 30 : 0, 2),
      diasSinPostura,
      ultimaFecha: ps.length ? ps[ps.length - 1].fecha : null,
      edadDias,
    };
  }

  function ranking() {
    return activas().filter(a => a.sexo === "hembra").map(a => ({ ave: a, m: metricas(a) }))
      .sort((x, y) => y.m.tasa - x.m.tasa);
  }

  function mejores(limit = 5) { return ranking().slice(0, limit); }
  function peores(limit = 5) { return ranking().slice(-limit).reverse(); }

  function add({ placa, sexo, raza, moduloId, nacimiento, peso, notas }) {
    const db = State.get();
    if (db.aves.some(a => a.placa === placa && !a.vendida && !a.muerta)) {
      Toast.warn(`Placa "${placa}" ya existe`); return null;
    }
    const cap = GallineroService.modulo(moduloId);
    if (cap && GallineroService.capacidadDisponible(cap) <= 0) {
      Toast.warn("Modulo lleno (max 100)"); return null;
    }
    const ave = {
      id: Storage.newId("ave"), placa, sexo, raza: raza || "Mixta",
      moduloId, nacimiento: nacimiento || new Date().toISOString(),
      estado: sexo === "hembra" ? "activa" : "activo",
      notas: notas || "", ultimaPostura: null, posturas: [], peso: Number(peso) || 0,
      vendida: false, muerta: false,
    };
    State.update(d => d.aves.push(ave));
    return ave;
  }

  function update(id, patch) {
    State.update(d => { const a = d.aves.find(x => x.id === id); if (a) Object.assign(a, patch); });
  }

  function remove(id) {
    if (awaitConfirm(id)) {}
  }

  async function awaitConfirm(id) {
    if (!(await UI.confirmDialog("Borrar ave permanentemente?"))) return false;
    State.update(d => { d.aves = d.aves.filter(a => a.id !== id); d.posturas = d.posturas.filter(p => p.aveId !== id); });
    Toast.success("Ave borrada");
    return true;
  }

  async function marcarMuerta(id) {
    if (!(await UI.confirmDialog("Marcar como muerta? Se descuenta del inventario."))) return;
    State.update(d => { const a = d.aves.find(x => x.id === id); if (a) { a.muerta = true; a.estado = "muerta"; a.fechaMuerte = new Date().toISOString(); } });
    State.update(d => d.eventos.push({ id: Storage.newId("ev"), tipo: "mortalidad", aveId: id, fecha: new Date().toISOString(), descripcion: "Ave marcada como muerta" }));
    Toast.warn("Ave marcada como muerta");
  }

  function registrarPostura({ moduloId, fecha, cantidad, aveId = null, notas = "" }) {
    State.update(d => {
      d.posturas.push({ id: Storage.newId("post"), moduloId, aveId, fecha, cantidad: Number(cantidad), notas, createdAt: new Date().toISOString() });
      if (aveId) { const a = d.aves.find(x => x.id === aveId); if (a) a.ultimaPostura = fecha; }
    });
  }

  function posturasUltimosDias(dias) {
    const desde = new Date(); desde.setHours(0, 0, 0, 0); desde.setDate(desde.getDate() - dias + 1);
    const desdeStr = desde.toISOString().slice(0, 10);
    return State.get().posturas.filter(p => p.fecha >= desdeStr);
  }

  function posturaPorDia(fecha) {
    return State.get().posturas.filter(p => p.fecha === fecha);
  }

  function totalAves() {
    const a = activas();
    return { total: a.length, hembras: a.filter(x => x.sexo === "hembra").length, machos: a.filter(x => x.sexo === "macho").length };
  }

  function postularHuevosIncubadora({ cant, moduloId, aveId, fecha }) {
    State.update(d => {
      d.posturas.push({ id: Storage.newId("post"), moduloId, aveId, fecha, cantidad: Number(cant), incubable: true, notas: "Huevos para incubadora", createdAt: new Date().toISOString() });
    });
  }

  function promedioPorAve(aveId, dias = 30) {
    const ps = posturasAve(aveId).slice(-dias);
    if (!ps.length) return 0;
    return H.round(H.sumBy(ps, p => p.cantidad) / ps.length, 2);
  }

  return {
    all, activas, byId, posturasAve, metricas, ranking, mejores, peores,
    add, update, remove, marcarMuerta, registrarPostura, posturasUltimosDias,
    posturaPorDia, totalAves, postularHuevosIncubadora, promedioPorAve,
  };

})();
