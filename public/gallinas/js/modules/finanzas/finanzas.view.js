/* ============================================
   FINANZAS.VIEW — flujo de caja y balances
   ============================================ */

Views.Finanzas = function () {
  const container = UI.el("div", { class: "view" });
  const cfg = State.get().config;

  container.append(UI.el("div", { class: "view-header" },
    UI.el("div", { class: "view-title" }, "Finanzas"),
    UI.el("div", { class: "view-sub" }, "Cuanto entra, cuanto sale, y que tan productivo es tu negocio.")
  ));

  const bal = FinanzasService.balance();
  container.append(UI.el("div", { class: "grid grid-4 mb-6" },
    UI.statCard({ label: "Ingresos", value: Format.money(bal.ingresos, cfg), status: "is-good" }),
    UI.statCard({ label: "Gastos", value: Format.money(bal.gastos, cfg), status: "is-bad" }),
    UI.statCard({ label: "Balance", value: Format.money(bal.balance, cfg), status: bal.balance >= 0 ? "is-good" : "is-bad" }),
    UI.statCard({ label: "Margen / huevo", value: FinanzasService.margenHuevo() + "%", sub: `${Format.money(FinanzasService.costoPorHuevo(), cfg)} costo` })
  ));

  container.append(UI.el("div", { class: "list-actions" },
    UI.el("button", { class: "btn btn-primary", onclick: addGastoForm }, "💸 + Registrar gasto")
  ));

  // Flujo 30 dias
  const flujo30 = FinanzasService.flujoUltimosDias(30);
  const chartBox = UI.el("div", { class: "card mb-6" },
    UI.el("div", { class: "card-title" }, "Flujo de caja (30 dias)"),
    UI.el("div", { id: "fin-flujo" })
  );
  container.append(chartBox);
  setTimeout(() => {
    Chart.line(document.getElementById("fin-flujo"), [
      { data: flujo30.map(f => f.ingresos), color: "#4ade80" },
      { data: flujo30.map(f => f.gastos), color: "#f87171" },
      { data: flujo30.map(f => f.neto), color: "#f2b705" }
    ], { labels: flujo30.map(f => f.fecha.slice(5)), points: false });
  }, 30);

  // Donut por categoria
  const catsBox = UI.el("div", { class: "card mb-6" },
    UI.el("div", { class: "card-title" }, "Gastos por categoria"),
    UI.el("div", { class: "flex", style: { gap: "var(--sp-6)", flexWrap: "wrap", alignItems: "center" } },
      UI.el("div", { id: "fin-donut", style: { minWidth: "240px" } }),
      (() => {
        const cats = FinanzasService.gastosPorCategoria();
        const colors = ["#f2b705", "#60a5fa", "#4ade80", "#f87171", "#fbbf24", "#a78bfa", "#34d399", "#f472b6"];
        if (!cats.length) return UI.el("div", { class: "dim" }, "Aun sin gastos.");
        const list = UI.el("div", {}, ...cats.map((c, i) => UI.el("div", { class: "flex-between", style: { borderBottom: "1px solid var(--color-border)", padding: "6px 0", gap: "var(--sp-4)" } },
          UI.el("div", { class: "flex gap-2", style: { alignItems: "center" } },
            UI.el("span", { style: { width: "10px", height: "10px", borderRadius: "2px", background: colors[i % colors.length] } }),
            UI.el("span", {}, FinanzasService.CAT_GASTO[c[0]] || c[0])
          ),
          UI.el("span", { class: "mono bold" }, Format.money(c[1], cfg))
        )));
        setTimeout(() => Chart.donut(document.getElementById("fin-donut"), cats.map((c, i) => ({ value: c[1], color: colors[i % colors.length] })), { centerText: Format.money(FinanzasService.totalGastos(), cfg).slice(0, 6), centerLabel: "gastos totales" }));
        return list;
      })()
    )
  );
  container.append(catsBox);

  // Listado de gastos
  const detalle = UI.el("div", { class: "card" });
  container.append(detalle);
  renderDetalle();

  function renderDetalle() {
    UI.clear(detalle);
    detalle.append(UI.el("div", { class: "card-header" }, UI.el("div", { class: "card-title" }, "Historial de gastos")));
    const gs = H.sortBy(FinanzasService.gastos(), g => g.fecha, "desc");
    if (!gs.length) { detalle.append(UI.emptyState({ icon: "💸", title: "Sin gastos", sub: "Registra el costo de la comida, etc." })); return; }
    detalle.append(UI.el("table", { class: "table" },
      UI.el("thead", {}, UI.el("tr", {}, UI.el("th", {}, "Fecha"), UI.el("th", {}, "Categoria"), UI.el("th", {}, "Descripcion"), UI.el("th", {}, "Proveedor"), UI.el("th", { class: "right" }, "Monto"), UI.el("th", { class: "right" }, ""))),
      UI.el("tbody", {}, ...H.lastN(gs, 100).map(g => UI.el("tr", {},
        UI.el("td", { class: "mono" }, Format.date(g.fecha)),
        UI.el("td", {}, UI.badge(FinanzasService.CAT_GASTO[g.categoria] || g.categoria, "info")),
        UI.el("td", {}, g.descripcion || "—"),
        UI.el("td", {}, g.proveedor || "—"),
        UI.el("td", { class: "right mono bold danger" }, "-" + Format.money(g.monto, cfg)),
        UI.el("td", { class: "right" }, UI.el("button", { class: "btn btn-ghost btn-sm", onclick: async () => { if (await UI.confirmDialog("Borrar gasto?")) { FinanzasService.removeGasto(g.id); renderDetalle(); } } }, "×"))
      )))
    ));
  }

  function addGastoForm() {
    const body = UI.el("div", {},
      fg(UI.el("div", { class: "form-row" },
        UI.el("div", {}, UI.el("label", {}, "Categoria"), UI.el("select", { id: "g-cat" }, ...Object.entries(FinanzasService.CAT_GASTO).map(([k, v]) => UI.el("option", { value: k }, v)))),
        UI.el("div", {}, UI.el("label", {}, "Fecha"), UI.el("input", { id: "g-fecha", type: "date", value: Format.todayISO() }))
      )),
      fg(UI.el("div", { class: "form-row" },
        UI.el("div", {}, UI.el("label", {}, "Monto"), UI.el("input", { id: "g-monto", type: "number", step: "0.01", value: 0 })),
        UI.el("div", {}, UI.el("label", {}, "Proveedor"), UI.el("input", { id: "g-prov", placeholder: "Tienda / marca" }))
      )),
      fg(UI.el("div", {}, UI.el("label", {}, "Descripcion"), UI.el("input", { id: "g-desc", placeholder: "50kg purina iniciacion" }))),
      fg(UI.el("div", {}, UI.el("label", {}, "Notas"), UI.el("textarea", { id: "g-notas", rows: 2 })))
    );
    Modal.open({
      title: "Nuevo gasto",
      body,
      footer: [
        UI.el("button", { class: "btn btn-ghost", onclick: Modal.close }, "Cancelar"),
        UI.el("button", { class: "btn btn-primary", onclick: () => {
          const mont = Number(document.getElementById("g-monto").value);
          if (!mont || mont <= 0) return Toast.warn("Pon monto");
          FinanzasService.addGasto({
            categoria: document.getElementById("g-cat").value,
            descripcion: document.getElementById("g-desc").value,
            monto: mont, fecha: document.getElementById("g-fecha").value,
            proveedor: document.getElementById("g-prov").value, notas: document.getElementById("g-notas").value
          });
          Modal.close(); Router.go("finanzas");
        } }, "Registrar")
      ]
    });
  }

  function fg(child) { const g = UI.el("div", { class: "form-group" }); g.append(child); return g; }

  return container;
};

window.Views.Finanzas = Views.Finanzas;
