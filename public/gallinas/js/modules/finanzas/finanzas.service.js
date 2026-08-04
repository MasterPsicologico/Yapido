/* ============================================
   FINANZAS.SERVICE — gastos, flujo de caja
   ============================================ */

const FinanzasService = (() => {

  const CAT_GASTO = {
    comida: "Comida / Purina",
    purina: "Purina",
    veterinary: "Veterinario / Medicina",
    vacunas: "Vacunas",
    combustible: "Combustible",
    equipos: "Equipos",
    incubadora: "Incubadora / Mantenimiento",
    servicios: "Servicios",
    manoObra: "Mano de obra",
    mantenimiento: "Mantenimiento",
    transporte: "Transporte",
    impuestos: "Impuestos",
    otro: "Otro",
  };

  function gastos() { return State.get().gastos; }
  function ventas() { return State.get().ventas; }

  function addGasto({ categoria, descripcion, monto, fecha, proveedor, notas }) {
    State.update(d => {
      d.gastos.push({
        id: Storage.newId("gas"), categoria, descripcion: descripcion || "",
        monto: Number(monto) || 0, fecha: fecha || Format.todayISO(),
        proveedor: proveedor || "", notas: notas || "",
        createdAt: new Date().toISOString()
      });
    });
    Toast.success("Gasto registrado");
  }

  function removeGasto(id) {
    State.update(d => { d.gastos = d.gastos.filter(g => g.id !== id); });
  }

  function totalGastos(rango = {}) {
    const gs = H.filterByRange(gastos(), rango.from, rango.to, "fecha");
    return H.sumBy(gs, g => g.monto);
  }

  function totalIngresos(rango = {}) {
    const vs = H.filterByRange(ventas(), rango.from, rango.to, "fecha");
    return H.sumBy(vs, v => v.total);
  }

  function balance(rango = {}) {
    const ingresos = totalIngresos(rango);
    const gastos = totalGastos(rango);
    return { ingresos, gastos, balance: ingresos - gastos };
  }

  function flujoUltimosDias(dias) {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const fechas = H.range(0, dias - 1).map(i => {
      const d = new Date(hoy); d.setDate(d.getDate() - dias + 1 + i); return d.toISOString().slice(0, 10);
    });
    return fechas.map(f => {
      const ing = H.sumBy(H.filterByRange(ventas(), f, f, "fecha"), v => v.total);
      const gas = H.sumBy(H.filterByRange(gastos(), f, f, "fecha"), g => g.monto);
      return { fecha: f, ingresos: ing, gastos: gas, neto: ing - gas };
    });
  }

  function gastosPorCategoria(rango = {}) {
    const gs = H.filterByRange(gastos(), rango.from, rango.to, "fecha");
    const grouped = H.groupBy(gs, g => g.categoria);
    const cats = Object.keys(grouped);
    const out = {};
    cats.forEach(c => out[c] = H.sumBy(grouped[c], g => g.monto));
    return Object.entries(out).sort((a, b) => b[1] - a[1]);
  }

  // Costo de produccion por huevo
  function costoPorHuevo(rango = {}) {
    const gastosComida = H.sumBy(H.filterByRange(gastos(), rango.from, rango.to, "fecha").filter(g => g.categoria === "comida" || g.categoria === "purina"), g => g.monto);
    const totalHuevos = H.sumBy(H.filterByRange(State.get().posturas, rango.from, rango.to, "fecha"), p => p.cantidad);
    if (!totalHuevos) return 0;
    return H.round(gastosComida / totalHuevos, 3);
  }

  function margenHuevo(rango = {}) {
    const cfg = State.get().config;
    const costo = costoPorHuevo(rango);
    const precio = cfg.precioHuevoVenta;
    return H.round(precio > 0 ? ((precio - costo) / precio) * 100 : 0, 1);
  }

  function depositos() { return State.get().depositosComida; }
  function addDeposito({ tipo, descripcion, cantidad, unidad, costo, fecha, proveedor }) {
    State.update(d => {
      d.depositosComida.push({
        id: Storage.newId("dep"), tipo, descripcion: descripcion || "",
        cantidad: Number(cantidad) || 0, unidad: unidad || "kg",
        costo: Number(costo) || 0, fecha: fecha || Format.todayISO(),
        proveedor: proveedor || "", createdAt: new Date().toISOString()
      });
    });
  }
  function removeDeposito(id) { State.update(d => { d.depositosComida = d.depositosComida.filter(x => x.id !== id); }); }

  return {
    CAT_GASTO, gastos, ventas, addGasto, removeGasto,
    totalGastos, totalIngresos, balance, flujoUltimosDias, gastosPorCategoria,
    costoPorHuevo, margenHuevo,
    depositos, addDeposito, removeDeposito,
  };

})();
