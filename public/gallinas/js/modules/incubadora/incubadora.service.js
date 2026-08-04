/* ============================================
   INCUBADORA.SERVICE — nidadas de 20-40 huevos
   ============================================ */

const IncubadoraService = (() => {

  const DIAS_INCUBACION = 21;

  function nidadas() { return State.get().nidadas; }
  function byId(id) { return nidadas().find(n => n.id === id); }

  function huevosIncubados(nidadaId) {
    return State.get().huevosIncubados.filter(h => h.nidadaId === nidadaId);
  }

  function crear({ nombre, moduloOrigen, cantidadHuevos, fechaInicio, temperatura, humedad, notas }) {
    const cant = Math.min(Math.max(Number(cantidadHuevos) || 0, 0), 40);
    if (cant < 1) { Toast.warn("Minimo 1 huevo"); return null; }
    if (cant > 40) { Toast.warn("Maximo 40 huevos por nidada"); return null; }
    const nid = { id: Storage.newId("nid"), nombre, moduloOrigen: moduloOrigen || null, cantidadHuevos: cant, fechaInicio, temperatura: temperatura || 37.7, humedad: humedad || 60, notas: notas || "", estado: "incubando", createdAt: new Date().toISOString() };
    State.update(d => {
      d.nidadas.push(nid);
      for (let i = 0; i < cant; i++) {
        d.huevosIncubados.push({ id: Storage.newId("huev"), nidadaId: nid.id, estado: "en incubacion", fertilidad: null, fechaNacimiento: null, sexo: null, destinoModuloId: null });
      }
    });
    return nid;
  }

  function diaActual(nidada) {
    return H.daysBetween(nidada.fechaInicio, new Date().toISOString()) + 1;
  }

  function diasRestantes(nidada) {
    return Math.max(0, DIAS_INCUBACION - diaActual(nidada));
  }

  function fase(nidada) {
    const d = diaActual(nidada);
    if (d < 7) return { nombre: "Iniciacion", "color": "#60a5fa", dia: d };
    if (d < 18) return { nombre: "Desarrollo", color: "#fbbf24", dia: d };
    if (d <= 21) return { nombre: "Nacimiento", color: "#4ade80", dia: d };
    return { nombre: "Finalizada", color: "#9aa8a0", dia: d };
  }

  function registrarNacimientos(nidadaId, nacidos, { machos = 0, hembras = 0, destinoModulo = null }) {
    State.update(d => {
      const huevs = d.huevosIncubados.filter(h => h.nidadaId === nidadaId && h.estado === "en incubacion");
      let machosRest = Number(machos) || 0;
      let hembrasRest = Number(hembras) || 0;
      const totalNacidos = Number(nacidos) || 0;
      let contador = 0;
      for (const h of huevs) {
        if (contador >= totalNacidos) break;
        h.estado = "nacido"; h.fechaNacimiento = new Date().toISOString();
        if (hembrasRest > 0) { h.sexo = "hembra"; hembrasRest--; } else { h.sexo = "macho"; machosRest--; }
        h.destinoModuloId = destinoModulo || null;
        contador++;
      }
      const nid = d.nidadas.find(n => n.id === nidadaId);
      if (nid) {
        nid.nacidos = contador;
        nid.estado = contador > 0 ? "con nacimientos" : "fallida";
        nid.fechaFin = new Date().toISOString();
      }
      // Auto-crear pollitos
      const sexoPorHuevo = huevs.slice(0, totalNacidos).map(h => h.sexo);
      sexoPorHuevo.forEach(sex => {
        const placa = `P-${Date.now().toString(36).slice(-4).toUpperCase()}${Math.floor(Math.random() * 9)}`;
        d.aves.push({
          id: Storage.newId("ave"), placa, sexo: sex, raza: "Pollito", moduloId: destinoModulo || null,
          nacimiento: new Date().toISOString(), estado: "activa", notas: `Nacido de nidada ${nid ? nid.nombre : ""}`,
          ultimaPostura: null, posturas: [], peso: 0.04, vendida: false, muerta: false
        });
      });
      d.eventos.push({ id: Storage.newId("ev"), tipo: "nacimiento", nidadaId, fecha: new Date().toISOString(), descripcion: `Nacieron ${contador} pollitos` });
    });
    Toast.success(`${nacidos} pollitos registrados y agregados al inventario`);
  }

  function marcarInfertiles(nidadaId, cantidad) {
    State.update(d => {
      const huevs = d.huevosIncubados.filter(h => h.nidadaId === nidadaId && h.estado === "en incubacion");
      let cont = 0;
      for (const h of huevs) { if (cont >= cantidad) break; h.estado = "infertil"; cont++; }
    });
  }

  function removeNidada(id) {
    State.update(d => { d.nidadas = d.nidadas.filter(n => n.id !== id); d.huevosIncubados = d.huevosIncubados.filter(h => h.nidadaId !== id); });
  }

  function actualizar(id, patch) {
    State.update(d => { const n = d.nidadas.find(x => x.id === id); if (n) Object.assign(n, patch); });
  }

  function stats() {
    const ns = nidadas();
    return {
      total: ns.length,
      incubando: ns.filter(n => n.estado === "incubando").length,
      nacidosTotal: H.sumBy(ns, n => n.nacidos || 0),
      huevosIncubados: State.get().huevosIncubados.filter(h => h.estado === "en incubacion").length,
    };
  }

  return { DIAS_INCUBACION, nidadas, byId, huevosIncubados, crear, diaActual, diasRestantes, fase, registrarNacimientos, marcarInfertiles, removeNidada, actualizar, stats };

})();
