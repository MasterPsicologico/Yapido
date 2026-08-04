/* ============================================
   VENTAS.VIEW
   ============================================ */

Views.Ventas = function () {
  const container = UI.el("div", { class: "view" });
  const cfg = State.get().config;
  container.append(UI.el("div", { class: "view-header" },
    UI.el("div", { class: "view-title" }, "Ventas"),
    UI.el("div", { class: "view-sub" }, "Cada venta descuenta automaticamente el inventario. Las hembras menos productoras se venden primero.")
  ));

  const hoy = VentasService.totalHoy();
  const mes = VentasService.totalMes();
  const anyo = VentasService.totalAnyo();
  container.append(UI.el("div", { class: "grid grid-4 mb-6" },
    UI.statCard({ label: "Hoy", value: Format.money(hoy.total, cfg), sub: `${hoy.count} ventas`, status: "is-good" }),
    UI.statCard({ label: "Este mes", value: Format.money(mes.total, cfg), sub: `${mes.count} ventas` }),
    UI.statCard({ label: "Este ano", value: Format.money(anyo.total, cfg), sub: `${anyo.count} ventas` }),
    UI.statCard({ label: "Total historico", value: Format.money(H.sumBy(VentasService.ventas(), v => v.total), cfg) })
  ));

  container.append(UI.el("div", { class: "list-actions" },
    UI.el("input", { class: "search-input", type: "search", placeholder: "Buscar cliente...", oninput: e => render(e.target.value) }),
    UI.el("button", { class: "btn btn-primary", onclick: nuevaVenta }, "💵 + Nueva venta")
  ));

  const detalle = UI.el("div");
  container.append(detalle);

  function render(filter = "") {
    UI.clear(detalle);
    let vs = H.sortBy(VentasService.ventas(), v => v.fecha, "desc");
    if (filter) { const f = filter.toLowerCase(); vs = vs.filter(v => (v.cliente || "").toLowerCase().includes(f)); }
    if (!vs.length) { detalle.append(UI.emptyState({ icon: "💵", title: "Sin ventas", sub: "Registra tu primera venta", action: UI.el("button", { class: "btn btn-primary", onclick: nuevaVenta }, "+ Nueva venta") })); return; }
    detalle.append(UI.el("div", { class: "card" },
      UI.el("table", { class: "table" },
        UI.el("thead", {}, UI.el("tr", {}, UI.el("th", {}, "Fecha"), UI.el("th", {}, "Tipo"), UI.el("th", {}, "Cliente"), UI.el("th", { class: "right" }, "Cant"), UI.el("th", { class: "right" }, "Total"), UI.el("th", { class: "right" }, "Acciones"))),
        UI.el("tbody", {}, ...H.lastN(vs, 100).map(v => UI.el("tr", {},
          UI.el("td", { class: "mono" }, Format.date(v.fecha)),
          UI.el("td", {}, VentasService.TIPOS[v.tipo] || v.tipo),
          UI.el("td", {}, v.cliente || "—"),
          UI.el("td", { class: "right mono" }, String(v.cantidad)),
          UI.el("td", { class: "right mono bold accent" }, Format.money(v.total, cfg)),
          UI.el("td", { class: "right" },
            UI.el("button", { class: "btn btn-ghost btn-sm", onclick: async () => { if (await UI.confirmDialog("Revertir venta y devolver inventario?")) { VentasService.remove(v.id); Toast.success("Revertida"); render(); } } }, "↺")
          )
        )))
      )
    ));
  }

  function nuevaVenta() {
    const cfg = State.get().config;
    const avesActivas = AvesService.activas();
    const body = UI.el("div", {},
      fg(UI.el("div", { class: "form-row" },
        UI.el("div", {}, UI.el("label", {}, "Tipo"), UI.el("select", { id: "v-tipo", onchange: onChangeTipo },
          Object.entries(VentasService.TIPOS).map(([k, v]) => UI.el("option", { value: k }, v))
        )),
        UI.el("div", {}, UI.el("label", {}, "Fecha"), UI.el("input", { id: "v-fecha", type: "date", value: Format.todayISO() }))
      )),
      fg(UI.el("div", { class: "form-row" },
        UI.el("div", {}, UI.el("label", {}, "Cantidad"), UI.el("input", { id: "v-cant", type: "number", min: 1, value: 1, oninput: recalcular })),
        UI.el("div", {}, UI.el("label", {}, "Precio unitario"), UI.el("input", { id: "v-precio", type: "number", step: "0.01", oninput: recalcular }))
      )),
      fg(UI.el("div", {}, UI.el("label", {}, "Cliente"), UI.el("input", { id: "v-cliente", placeholder: "Nombre o tienda" }))),
      fg(UI.el("div", { id: "v-ave-wrap" })),
      fg(UI.el("div", {}, UI.el("label", {}, "Notas"), UI.el("textarea", { id: "v-notas", rows: 2 }))),
      UI.el("div", { class: "card", style: { background: "var(--color-bg-elev-2)", padding: "12px 16px" } },
        UI.el("div", { class: "flex-between" },
          UI.el("span", { class: "muted" }, "Total venta"),
          UI.el("span", { id: "v-total", class: "mono bold accent", style: { fontSize: "var(--fs-lg)" } }, Format.money(0, cfg))
        )
      )
    );
    Modal.open({
      title: "Nueva venta",
      body,
      footer: [
        UI.el("button", { class: "btn btn-ghost", onclick: Modal.close }, "Cancelar"),
        UI.el("button", { class: "btn btn-primary", onclick: () => {
          const tipo = document.getElementById("v-tipo").value;
          const cant = Number(document.getElementById("v-cant").value);
          const precio = Number(document.getElementById("v-precio").value);
          const aveIdEl = document.getElementById("v-ave");
          VentasService.vender({
            tipo, cantidad: cant, precioUnitario: precio,
            cliente: document.getElementById("v-cliente").value,
            fecha: document.getElementById("v-fecha").value,
            aveId: aveIdEl ? aveIdEl.value : null,
            notas: document.getElementById("v-notas").value
          });
          Modal.close(); render();
        } }, "Registrar venta")
      ]
    });
    function onChangeTipo() {
      const tipo = document.getElementById("v-tipo").value;
      // sugerir precio
      const precios = { huevos: cfg.precioHuevoVenta, gallina: cfg.precioGallinaVenta, gallo: cfg.precioGalloVenta, pollito: 0.5, otro: 0 };
      document.getElementById("v-precio").value = precios[tipo] || 0;
      const wrap = document.getElementById("v-ave-wrap");
      UI.clear(wrap);
      if (tipo === "gallina" || tipo === "gallo" || tipo === "pollito") {
        const filtro = tipo === "gallina" ? "hembra" : tipo === "gallo" ? "macho" : null;
        const lista = filtro ? avesActivas.filter(a => a.sexo === filtro) : avesActivas;
        if (lista.length) {
          wrap.append(UI.el("label", {}, "Ave especifica (opcional — sino auto-selecciona)"));
          wrap.append(UI.el("select", { id: "v-ave", style: { marginTop: "6px" } },
            UI.el("option", { value: "" }, "— Automatico (peor productora primero) —"),
            ...lista.map(a => UI.el("option", { value: a.id }, `${a.placa} · ${a.raza} · ${Format.ageString(a.nacimiento)}`))
          ));
        }
      }
      recalcular();
    }
    setTimeout(onChangeTipo, 10);
    function recalcular() {
      const c = Number(document.getElementById("v-cant").value);
      const p = Number(document.getElementById("v-precio").value);
      document.getElementById("v-total").textContent = Format.money(c * p, cfg);
    }
  }

  function fg(child) { const g = UI.el("div", { class: "form-group" }); g.append(child); return g; }

  render();
  return container;
};

window.Views.Ventas = Views.Ventas;
