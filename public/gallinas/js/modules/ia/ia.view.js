/* ============================================
   IA.VIEW — panel de inteligencia AsiBrain
   ============================================ */

Views.IA = function () {
  const container = UI.el("div", { class: "view" });
  const cfg = State.get().config;
  container.append(UI.el("div", { class: "view-header" },
    UI.el("div", { class: "view-title" }, "IA AsiBrain"),
    UI.el("div", { class: "view-sub" }, "Tu cerebro que vigila el sistema y aprende mientras mas lo usas.")
  ));

  // Precision
  const precision = IA.precisionUltimas(10);
  container.append(UI.el("div", { class: "grid grid-4 mb-6" },
    UI.statCard({ label: "Posts registrados", value: State.get().posturas.length, sub: "mas datos = mejor IA" }),
    UI.statCard({ label: "Precision prediccion", value: precision !== null ? precision + "%" : "—", status: precision > 70 ? "is-good" : "is-warn" }),
    UI.statCard({ label: "Hembras activas", value: AvesService.totalAves().hembras }),
    UI.statCard({ label: "Promedio / gallina / dia", value: (() => { const p30 = AvesService.posturasUltimosDias(30); const h = AvesService.totalAves().hembras || 1; const total = H.sumBy(p30, p => p.cantidad); return H.round(total / 30 / h, 2); })() })
  ));

  // Recomendaciones
  const recoms = IA.recomendaciones();
  if (recoms.length) {
    container.append(UI.el("div", { class: "mb-6" },
      ...recoms.map(r => UI.el("div", { class: "ai-insight" },
        UI.el("div", { class: "ai-insight-icon" }, r.icon),
        UI.el("div", { class: "ai-insight-text" },
          UI.el("div", { class: "ai-insight-title" }, r.titulo),
          UI.el("div", { class: "ai-insight-body" }, r.desc)
        )
      ))
    ));
  }

  // Alertas
  const alertas = IA.alertas();
  const cardAlertas = UI.el("div", { class: "card mb-6" },
    UI.el("div", { class: "card-title" }, `Alertas (${alertas.length})`)
  );
  container.append(cardAlertas);
  if (!alertas.length) {
    cardAlertas.append(UI.el("div", { class: "empty" }, "✅ Todo bajo control. Sin alertas."));
  } else {
    const tipo = { alta: "danger", media: "warn", baja: "info" };
    cardAlertas.append(UI.el("div", {}, ...alertas.map(a => UI.el("div", { class: "flex-between", style: { borderBottom: "1px solid var(--color-border)", padding: "10px 0" } },
      UI.el("div", { class: "flex gap-2", style: { alignItems: "center" } },
        UI.el("span", { class: `badge badge-${tipo[a.severidad]}` }, a.severidad),
        UI.el("span", {}, a.msg)
      ),
      a.ave ? UI.el("button", { class: "btn btn-ghost btn-sm", onclick: () => Router.go("aves") }, "Ver") :
      a.modulo ? UI.el("button", { class: "btn btn-ghost btn-sm", onclick: () => Router.go("gallinero") }, "Ver") :
      a.nidada ? UI.el("button", { class: "btn btn-ghost btn-sm", onclick: () => Router.go("incubadora") }, "Ver") : null
    ))));
  }

  // Ranking de gallinas
  const ranking = IA.rankingGallinas();
  const rankingHost = UI.el("div", { id: "ranking-tb" });
  const cardRanking = UI.el("div", { class: "card mb-6" },
    UI.el("div", { class: "card-header" },
      UI.el("div", { class: "card-title" }, "Ranking de gallinas"),
      UI.el("div", { class: "flex gap-2" },
        UI.el("button", { class: "btn btn-ghost btn-sm", onclick: () => verRanking("mejores") }, "Mejores top 5"),
        UI.el("button", { class: "btn btn-ghost btn-sm", onclick: () => verRanking("peores") }, "Peores bottom 5")
      )
    ),
    rankingHost
  );
  container.append(cardRanking);
  verRanking("mejores");

  function verRanking(tipo) {
    const cont = rankingHost; UI.clear(cont);
    const lista = tipo === "mejores" ? ranking.slice(0, 10) : ranking.slice(-10).reverse();
    if (!lista.length) { cont.append(UI.emptyState({ icon: "Sin hembras", title: "Sin hembras", sub: "Registra gallinas con postura para el ranking" })); return; }
    const thead = UI.el("thead", {});
    thead.append(UI.el("tr", {}));
    ["#", "Placa", "Raza", "Tasa", "Total huev", "Sin postura"].forEach((h, i) => {
      thead.firstChild.append(UI.el("th", { class: i >= 3 ? "right" : "" }, h));
    });
    const tbody = UI.el("tbody", {});
    lista.forEach((r, i) => {
      const tr = UI.el("tr", {},
        UI.el("td", { class: "mono dim" }, String(i + 1)),
        UI.el("td", { class: "mono bold" }, r.ave.placa),
        UI.el("td", {}, r.ave.raza || "—"),
        UI.el("td", { class: `right mono bold ${r.m.tasa > 0.7 ? "success" : r.m.tasa > 0.4 ? "warn" : "danger"}` }, String(r.m.tasa)),
        UI.el("td", { class: "right mono" }, String(r.m.totalHuevos)),
        UI.el("td", { class: "right mono" }, r.m.diasSinPostura === 999 ? "—" : r.m.diasSinPostura + "d")
      );
      tbody.append(tr);
    });
    cont.append(UI.el("table", { class: "table" }, thead, tbody));
  }

  // Proyeccion crecimiento
  const proy = IA.proyeccionCrecimiento(12);
  const proyHost = UI.el("div", { id: "proy-chart" });
  const cardProy = UI.el("div", { class: "card" },
    UI.el("div", { class: "card-title" }, 'Proyeccion de crecimiento (12 meses, guardando hembras)'),
    proyHost
  );
  container.append(cardProy);
  setTimeout(() => {
    Chart.line(proyHost, [
      { data: proy.map(p => p.hembras), color: "#f2b705" },
      { data: proy.map(p => p.produccionMes), color: "#4ade80" }
    ], { labels: proy.map(p => "M" + p.mes) });
  }, 50);

  return container;
};

window.Views.IA = Views.IA;
