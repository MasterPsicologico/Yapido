/* ============================================
   IA.SERVICE — "AsiBrain"
   Motor de inteligencia local (sin API).
   - Predice produccion de huevos a futuro
   - Detecta mejores / peores gallinas
   - Genera alertas y recomendaciones
   - Estima rentabilidad y proyeccion
   - Aprende de tus datos mientras mas usas la app
   ============================================ */

const IA = (() => {

  // Prediccion lineal con estacionalidad (dia de la semana)
  function predecirProduccion(fecha) {
    const target = new Date(fecha); target.setHours(0, 0, 0, 0);
    const diaSemana = target.getDay();
    const posturas = State.get().posturas;
    if (!posturas.length) return { huevos: 0, confianza: 0, base: "sin datos" };

    // promedio por dia de la semana (ultimas 10 semanas)
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const hace10sem = new Date(hoy); hace10sem.setDate(hace10sem.getDate() - 70);
    const recent = posturas.filter(p => new Date(p.fecha) > hace10sem && new Date(p.fecha) < new Date(target.getTime() + 86400000));
    const porFecha = {};
    recent.forEach(p => { porFecha[p.fecha] = (porFecha[p.fecha] || 0) + p.cantidad; });
    const porDia = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    Object.entries(porFecha).forEach(([f, v]) => { const d = new Date(f).getDay(); porDia[d].push(v); });

    const promDia = porDia[diaSemana].length ? H.avg(porDia[diaSemana]) : 0;
    const promGeneral = H.avg(Object.values(porFecha));
    const factorEstacional = promGeneral ? promDia / promGeneral : 1;

    // tendencia 14 dias
    const hace14 = new Date(target); hace14.setDate(hace14.getDate() - 14);
    const datas14 = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(hace14); d.setDate(d.getDate() + i); const ds = d.toISOString().slice(0, 10);
      datas14.push(porFecha[ds] || 0);
    }
    const ma3 = H.promedioMovil(datas14, 3);
    const pendiente = ma3.length > 1 ? ma3[ma3.length - 1] - ma3[0] : 0;
    const tendencia = pendiente / 14;

    // hembras activas (asume nuevas gallinas quitadas del total reciente)
    const hembrasActivas = AvesService.totalAves().hembras || 1;

    // prediccion base
    let prediccion = Math.max(0, (promGeneral * factorEstacional) + tendencia);
    prediccion = H.round(prediccion, 1);

    // confianza segun cantidad de datos
    const muestras = porDia[diaSemana].length;
    const confianza = H.round(Math.min(95, 30 + muestras * 6), 0);

    return {
      huevos: prediccion,
      confianza,
      base: `Dia ${["dom","lun","mar","mie","jue","vie","sab"][diaSemana]} · ${promDia.toFixed(1)}/d semanal · ${(historico()*100).toFixed(0)} datos/dia`,
      factorEstacional: H.round(factorEstacional, 2),
      tendencia: H.round(tendencia, 2),
      hembrasActivas,
    };
  }

  function historico() {
    const pf = State.get().posturas.length;
    return pf / 200;
  }

  // Ranking de gallinas por productividad
  function rankingGallinas(limit) {
    const r = AvesService.ranking();
    return limit ? r.slice(0, limit) : r;
  }

  // Detecta problem nurses (sin postura >3 dias)
  function alertas() {
    const out = [];
    const hembras = AvesService.activas().filter(a => a.sexo === "hembra");
    hembras.forEach(a => {
      const m = AvesService.metricas(a);
      if (m.diasSinPostura > 7) out.push({ severidad: "alta", tipo: "sin-postura", ave: a, msg: `${a.placa} lleva ${m.diasSinPostura} dias sin postura. Revisar salud.` });
      else if (m.diasSinPostura > 3 && m.tasa > 0) out.push({ severidad: "media", tipo: "baja-postura", ave: a, msg: `${a.placa} en racha baja (3-7 dias sin postura).` });
    });

    // modulos llenos
    GallineroService.modulos().forEach(m => {
      const disp = GallineroService.capacidadDisponible(m);
      if (disp <= 0) out.push({ severidad: "alta", tipo: "modulo-lleno", modulo: m, msg: `"${m.nombre}" lleno (max 100). Separa para evitar enfermedades.` });
      else if (disp <= 10) out.push({ severidad: "media", tipo: "modulo-casi-lleno", modulo: m, msg: `"${m.nombre}" casi lleno (${disp} espacios).` });
    });

    // rentabilidad negativa
    const bal = FinanzasService.balance();
    if (bal.balance < 0) out.push({ severidad: "alta", tipo: "perdida", msg: `Estas en perdida: ${Format.money(bal.balance, State.get().config)}. Reduce gastos o sube precios.` });

    // gallinas a vender (peores)
    const peores = AvesService.peores(3).filter(p => p.m.tasa < 0.3 && p.m.edadDias > 180);
    peores.forEach(p => out.push({ severidad: "baja", tipo: "vender", ave: p.ave, msg: `${p.ave.placa} produce poco (${p.m.tasa}/d). Considera venderla.` }));

    // nidadas pronto a nacer
    IncubadoraService.nidadas().forEach(n => {
      const rest = IncubadoraService.diasRestantes(n);
      if (rest > 0 && rest <= 3) out.push({ severidad: "media", tipo: "nidada-cerca", nidada: n, msg: `Nidada "${n.nombre}" nace en ${rest} dias. Prepara pollito y modulo destino.` });
    });

    return H.sortBy(out, x => x.severidad === "alta" ? 3 : x.severidad === "media" ? 2 : 1, "desc");
  }

  // Recomendaciones de optimizaciones
  function recomendaciones() {
    const out = [];
    const posturas30 = AvesService.posturasUltimosDias(30);
    if (!posturas30.length) {
      out.push({ icon: "🥚", titulo: "Empieza a registrar postura diaria", desc: "Mientras mas datos tengas, mejor predice la IA. Anota los huevos cada dia." });
    }

    const hembras = AvesService.totalAves().hembras;
    const total30 = H.sumBy(posturas30, p => p.cantidad);
    if (hembras > 0 && posturas30.length) {
      const ratio = H.round(total30 / 30 / hembras, 2);
      if (ratio < 0.5) out.push({ icon: "📉", titulo: "Produccion baja", desc: `Promedio ${ratio} huevos/gallina/dia. Una gallina sana pone 0.7-0.9. Revisa alimentacion y salud.` });
      else if (ratio >= 0.7) out.push({ icon: "🚀", titulo: "Excelente produccion", desc: `${ratio} huevos/gallina/dia. Duplica el negocio con mas hembras.` });
    }

    // capacidad de expansion
    const capTotal = H.sumBy(GallineroService.modulos(), m => m.capacidad);
    const ocupadas = AvesService.activas().length;
    if (capTotal - ocupadas > 30) out.push({ icon: "📈", titulo: "Espacio disponible", desc: `Tienes ${capTotal - ocupadas} espacios libres. Llenalos con hembras reproductoras para duplicar produccion.` });

    // rentabilidad
    const bal = FinanzasService.balance();
    if (bal.ingresos > 0) {
      const margen = H.round((bal.balance / bal.ingresos) * 100, 1);
      out.push({ icon: margen > 30 ? "💎" : margen > 0 ? "✅" : "⚠️", titulo: `Margen ${margen}%`, desc: margen > 30 ? "Negocio altamente rentable. Reincierte para expandir." : margen > 0 ? "Negocio rentable pero con margen apretado." : "Margen negativo. Revisa costos de comida vs ingresos." });
    }

    // huevos incubables
    const peores = AvesService.peores(2);
    peores.forEach(p => out.push({ icon: "🔄", titulo: `Vende ${p.ave.placa}`, desc: "Esta gallina esta entre las peores. Vendela para capital y reemplazala con pollitas de tus mejores gallinas." }));

    return out;
  }

  // Proyeccion de crecimiento: si guardo hembras y vendo machos
  function proyeccionCrecimiento(meses = 12) {
    const hembras = AvesService.totalAves().hembras;
    const promHuevo = H.avg(AvesService.posturasUltimosDias(30).reduce((acc, p) => { acc[p.fecha] = (acc[p.fecha] || 0) + p.cantidad; return acc; }, {}) ? Object.values(AvesService.posturasUltimosDias(30).reduce((acc, p) => { acc[p.fecha] = (acc[p.fecha] || 0) + p.cantidad; return acc; }, {})) : [0]) || 0.5;
    let hembrasTotal = hembras;
    const serie = [];
    for (let i = 1; i <= meses; i++) {
      // mes a mes, nacimientos estimados: hembras activas * prom生产的pollitos hembras al mes
      // Asumimos 1 nidada/mes con 10 hembras nacidas
      const nuevasHembras = Math.floor(hembrasTotal * 0.15);
      hembrasTotal += nuevasHembras;
      serie.push({ mes: i, hembras: hembrasTotal, nuevosPollitosHembra: nuevasHembras, produccionMes: Math.round(hembrasTotal * promHuevo * 30) });
    }
    return serie;
  }

  function guardarPrediccion(fecha, prediccion) {
    State.update(d => d.predicciones.push({ id: Storage.newId("pred"), fecha, prediccion, createdAt: new Date().toISOString() }));
  }

  function precisionUltimas(n = 10) {
    const preds = H.sortBy(State.get().predicciones || [], p => p.createdAt, "desc").slice(0, n);
    if (!preds.length) return null;
    let suma = 0;
    let count = 0;
    preds.forEach(p => {
      const real = H.sumBy(AvesService.posturaPorDia(p.fecha), x => x.cantidad);
      if (p.prediccion && real !== undefined) {
        const err = Math.abs(real - p.prediccion.huevos);
        const errPct = p.prediccion.huevos ? err / p.prediccion.huevos : 1;
        suma += Math.max(0, 1 - errPct);
        count++;
      }
    });
    return count ? H.round((suma / count) * 100, 0) : null;
  }

  return {
    predecirProduccion, rankingGallinas, alertas, recomendaciones,
    proyeccionCrecimiento, guardarPrediccion, precisionUltimas,
  };

})();
