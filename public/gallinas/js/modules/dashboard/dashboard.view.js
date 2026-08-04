/* ============================================
   DASHBOARD.VIEW — resumen general
   ============================================ */

Views.Dashboard = function () {
  const container = UI.el("div", { class: "view" });
  const cfg = State.get().config;

  container.append(UI.el("div", { class: "view-header" },
    UI.el("div", { class: "view-title" }, `Hola, ${cfg.nombreGranja || "granja"} 🐔`),
    UI.el("div", { class: "view-sub" }, "Resumen de tu operacion avicola. La IA ya esta vigilando.")
  ));

  const t = AvesService.totalAves();
  const modulos = GallineroService.modulos();
  const capTotal = H.sumBy(modulos, m => m.capacidad);
  const bal = FinanzasService.balance();
  const postHoy = H.sumBy(AvesService.posturaPorDia(Format.todayISO()), p => p.cantidad);
  const predHoy = IA.predecirProduccion(Format.todayISO());

  // Cards principales
  container.append(UI.el("div", { class: "grid grid-4 mb-6" },
    UI.statCard({ label: "Aves activas", value: t.total, sub: `${t.hembras} H · ${t.machos} M`, status: "is-good" }),
    UI.statCard({ label: "Huevos hoy", value: postHoy, sub: `prediccion: ${Format.number(predHoy.huevos, 1)}` }),
    UI.statCard({ label: "Balance", value: Format.money(bal.balance, cfg), status: bal.balance >= 0 ? "is-good" : "is-bad", sub: `${Format.money(bal.ingresos, cfg)} in · ${Format.money(bal.gastos, cfg)} gas` }),
    UI.statCard({ label: "Capacidad", value: `${t.total}/${capTotal}`, sub: `${capTotal - t.total} libres`, status: t.total < capTotal ? "is-good" : "is-warn" })
  ));

  // Card alerta alta
  const alertas = IA.alertas();
  const alertasAltas = alertas.filter(a => a.severidad === "alta");
  if (alertasAltas.length) {
    container.append(UI.el("div", { class: "ai-insight mb-6", style: { borderColor: "var(--color-danger)", background: "var(--color-danger-soft)" } },
      UI.el("div", { class: "ai-insight-icon" }, "🚨"),
      UI.el("div", { class: "ai-insight-text" },
        UI.el("div", { class: "ai-insight-title", style: { color: "var(--color-danger)" } }, `${alertasAltas.length} alerta(s) críticas`),
        UI.el("div", { class: "ai-insight-body" }, alertasAltas.map(a => "• " + a.msg).join("\n"))
      )
    ));
  }

  // Charts: produccion ultimos 12 dias + mejores gallinas
  const chartBox = UI.el("div", { class: "charts-row mb-6" });
  container.append(chartBox);
  const chart1 = UI.el("div", { class: "card" },
    UI.el("div", { class: "card-title" }, "Produccion ultimos 12 dias")
  );
  const chart2 = UI.el("div", { class: "card" },
    UI.el("div", { class: "card-title" }, "Mejores gallinas (tasa)")
  );
  chartBox.append(chart1, chart2);

  const cProdu = UI.el("div"); chart1.append(cProdu);
  const cRank = UI.el("div"); chart2.append(cRank);

  setTimeout(() => {
    const ult12 = AvesService.posturasUltimosDias(12);
    const grouped = {};
    ult12.forEach(p => { grouped[p.fecha] = (grouped[p.fecha] || 0) + p.cantidad; });
    const datas = Object.entries(grouped).sort().map(([f, v]) => v);
    const labels = Object.keys(grouped).sort().map(f => f.slice(5));
    Chart.line(cProdu, [{ data: datas, color: "#f2b705" }], { labels, points: true });

    const mejores = AvesService.mejores(5);
    Chart.bars(cRank, mejores.map(m => ({ value: m.m.tasa, label: m.ave.placa, color: "#4ade80" })));
  }, 30);

  // Accesos rapidos
  const acciones = UI.el("div", { class: "grid grid-4 mb-6" },
    quickCard("🥚", "Registrar postura", "postura"),
    quickCard("💵", "Venta", "ventas"),
    quickCard("💸", "Gasto", "finanzas"),
    quickCard("🐣", "Incubadora", "incubadora")
  );
  container.append(acciones);

  // Modulos
  const modCard = UI.el("div", { class: "card" },
    UI.el("div", { class: "card-header" },
      UI.el("div", { class: "card-title" }, "Gallineros"),
      UI.el("button", { class: "btn btn-ghost btn-sm", onclick: () => Router.go("gallinero") }, "Ver todos →")
    ),
    UI.el("div", { class: "grid grid-auto" })
  );
  container.append(modCard);
  const modGrid = modCard.querySelector(".grid");
  modulos.slice(0, 4).forEach(m => {
    const aves = GallineroService.avesEnModulo(m.id);
    const disp = GallineroService.capacidadDisponible(m);
    modGrid.append(UI.el("div", { class: "card", style: { padding: "12px", cursor: "pointer" }, onclick: () => Router.go("gallinero") },
      UI.el("div", { class: "flex-between" },
        UI.el("div", { class: "bold" }, m.nombre),
        UI.badge(`${aves.length}/${m.capacidad}`, disp > 0 ? "info" : "danger")
      ),
      UI.el("div", { class: "dim mt-2", style: { fontSize: "var(--fs-xs)" } }, `${disp} espacios libres`)
    ));
  });

  // Eventos
  const evCard = UI.el("div", { class: "card mt-6" },
    UI.el("div", { class: "card-title" }, "Eventos recientes")
  );
  container.append(evCard);
  const eventos = H.sortBy(State.get().eventos || [], e => e.fecha, "desc").slice(0, 8);
  if (!eventos.length) {
    evCard.append(UI.el("div", { class: "empty" }, "Sin actividad registrada aun."));
  } else {
    evCard.append(UI.el("div", {}, ...eventos.map(e => UI.el("div", { class: "flex-between", style: { padding: "6px 0", borderBottom: "1px solid var(--color-border)" } },
      UI.el("div", { class: "flex gap-2", style: { alignItems: "center" } },
        UI.el("span", { class: "dim", style: { fontSize: "var(--fs-xs)" } }, "•"),
        UI.el("span", { style: { fontSize: "var(--fs-sm)" } }, e.descripcion)
      ),
      UI.el("span", { class: "dim mono", style: { fontSize: "var(--fs-xs)" } }, Format.date(e.fecha))
    ))));
  }

  return container;

  function quickCard(icon, label, route) {
    return UI.el("div", { class: "card", style: { cursor: "pointer", textAlign: "center", padding: "var(--sp-5)" }, onclick: () => Router.go(route) },
      UI.el("div", { style: { fontSize: "1.8rem" } }, icon),
      UI.el("div", { class: "mt-2 bold" }, label)
    );
  }
};

window.Views.Dashboard = Views.Dashboard;
