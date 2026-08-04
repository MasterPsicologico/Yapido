/* ============================================
   VENTAS.SERVICE — ticket de venta + descuento
   automatico de inventario + movimiento financiero
   ============================================ */

const VentasService = (() => {

  const TIPOS = {
    huevos: "Huevos",
    gallina: "Gallina",
    gallo: "Gallo",
    pollito: "Pollito",
    otro: "Otro",
  };

  function ventas() { return State.get().ventas; }

  function vender({ tipo, cantidad, precioUnitario, cliente, fecha, aveId = null, notas }) {
    const cant = Number(cantidad) || 1;
    const total = cant * (Number(precioUnitario) || 0);
    State.update(d => {
      const v = { id: Storage.newId("ven"), tipo, cantidad: cant, precioUnitario: Number(precioUnitario) || 0, total, cliente: cliente || "", fecha: fecha || Format.todayISO(), aveId, notas: notas || "", createdAt: new Date().toISOString() };
      d.ventas.push(v);

      // Descuento automatico de inventario
      if ((tipo === "gallina" || tipo === "gallo" || tipo === "pollito") && cant > 0) {
        // si se especifica aveId exacto, marcar esa; sino las primeras activas del sexo correspondiente
        if (aveId) {
          const a = d.aves.find(x => x.id === aveId);
          if (a) { a.vendida = true; a.estado = "vendida"; a.fechaVenta = v.fecha; a.precioVenta = Number(precioUnitario) || 0; }
        } else {
          const sexoMap = { gallina: "hembra", gallo: "macho", pollito: null };
          const activas = d.aves.filter(a => !a.vendida && !a.muerta && a.sexo === (sexoMap[tipo] || a.sexo));
          const sexo = sexoMap[tipo];
          const lista = sexo ? d.aves.filter(a => !a.vendida && !a.muerta && a.sexo === sexo) : d.aves.filter(a => !a.vendida && !a.muerta);
          let cont = 0;
          // priorizar peores productoras si hembra
          let pool = lista;
          if (tipo === "gallina") {
            pool = lista.map(a => ({ a, m: metricasFor(d, a) })).sort((x, y) => x.m.tasa - y.m.tasa).map(x => x.a);
          }
          for (const a of pool) {
            if (cont >= cant) break;
            a.vendida = true; a.estado = "vendida"; a.fechaVenta = v.fecha; a.precioVenta = Number(precioUnitario) || 0;
            cont++;
          }
        }
      }

      // Incremento de huevos vendidos: postura - se marca como vendidos (no descuenta ave)
      if (tipo === "huevos") {
        d.eventos = d.eventos || [];
        d.eventos.push({ id: Storage.newId("ev"), tipo: "venta-huevos", fecha: v.fecha, descripcion: `Venta ${cant} huevos a ${cliente || "—"}`, monto: total });
      }

      d.eventos.push({ id: Storage.newId("ev"), tipo: "venta", ventaId: v.id, fecha: new Date().toISOString(), descripcion: `Venta de ${cant} ${TIPOS[tipo]} a ${cliente || "—"} por ${total}` });
    });
    Toast.success(`Venta registrada: ${Format.money(total, State.get().config)}`);
  }

  function metricasFor(d, a) {
    const ps = d.posturas.filter(p => p.aveId === a.id);
    const total = H.sumBy(ps, p => p.cantidad);
    const dias = new Set(ps.map(p => p.fecha)).size;
    return { total, tasa: dias ? total / dias : 0 };
  }

  function remove(id) {
    State.update(d => {
      const v = d.ventas.find(x => x.id === id);
      if (v && v.aveId) {
        const a = d.aves.find(x => x.id === v.aveId);
        if (a) { a.vendida = false; a.estado = "activa"; delete a.fechaVenta; delete a.precioVenta; }
      }
      d.ventas = d.ventas.filter(x => x.id !== id);
    });
  }

  function totalHoy() {
    const ps = ventas().filter(v => v.fecha === Format.todayISO());
    return { total: H.sumBy(ps, v => v.total), count: ps.length };
  }

  function totalMes() {
    const hoy = new Date(); const f = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
    const ps = ventas().filter(v => v.fecha.startsWith(f));
    return { total: H.sumBy(ps, v => v.total), count: ps.length };
  }

  function totalAnyo() {
    const y = new Date().getFullYear();
    const ps = ventas().filter(v => v.fecha.startsWith(String(y)));
    return { total: H.sumBy(ps, v => v.total), count: ps.length };
  }

  function porTipo() {
    return H.groupBy(ventas(), v => v.tipo);
  }

  return { TIPOS, ventas, vender, remove, totalHoy, totalMes, totalAnyo, porTipo };

})();
