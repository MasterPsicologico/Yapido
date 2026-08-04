/* ============================================
   PREDICCION.VIEW — prediccion a futuro
   ============================================ */

Views.Prediccion = function () {
  const container = UI.el("div", { class: "view" });
  const cfg = State.get().config;
  container.append(UI.el("div", { class: "view-header" },
    UI.el("div", { class: "view-title" }, "Prediccion"),
    UI.el("div", { class: "view-sub" }, "Selecciona un dia y AsiBrain te dira cuantos huevos esperar.")
  ));

  const selector = UI.el("div", { class: "card mb-6" },
    UI.el("div", { class: "card-header" },
      UI.el("div", { class: "card-title" }, "Selecciona fecha"),
      UI.el("input", { id: "pred-fecha", type: "date", value: Format.todayISO(), onchange: e => renderPred(e.target.value) })
    )
  );
  container.append(selector);

  const cont = UI.el("div", { id: "pred-out" });
  container.append(cont);

  // proyeccion proximos 14 dias
  const pred14Host = UI.el("div", { id: "pred-14" });
  const card14 = UI.el("div", { class: "card mt-6" },
    UI.el("div", { class: "card-title" }, 'Proximos 14 dias'),
    pred14Host
  );
  container.append(card14);
  render14();

  function render14() {
    const cont14 = pred14Host; UI.clear(cont14);
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const datas = [];
    const labels = [];
    const confs = [];
    let totalEstimado = 0;
    for (let i = 0; i < 14; i++) {
      const d = new Date(hoy); d.setDate(d.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const p = IA.predecirProduccion(iso);
      datas.push(p.huevos);
      labels.push(iso.slice(5));
      confs.push(p.confianza);
      totalEstimado += p.huevos;
    }
    Chart.line(cont14, [{ data: datas, color: "#f2b705" }], { labels, points: true });
    cont14.append(UI.el("p", { class: "muted mt-4" }, `Total estimado: ${Format.number(totalEstimado, 0)} huevos en 14 dias · Valor: ${Format.money(totalEstimado * cfg.precioHuevoVenta, cfg)}`));
  }

  renderPred(Format.todayISO());

  function renderPred(fecha) {
    UI.clear(cont);
    const p = IA.predecirProduccion(fecha);
    IA.guardarPrediccion(fecha, p);
    const d = new Date(fecha);
    const dia = ["Domingo","Lunes","Martes","Miercoles","Jueves","Viernes","Sabado"][d.getDay()];
    const ingresos = p.huevos * cfg.precioHuevoVenta;
    cont.append(UI.el("div", { class: "ai-insight" },
      UI.el("div", { class: "ai-insight-icon", style: { fontSize: "2.5rem" } }, "🔮"),
      UI.el("div", { class: "ai-insight-text" },
        UI.el("div", { class: "ai-insight-title" }, `Prediccion para ${dia}, ${Format.date(fecha)}`),
        UI.el("div", { class: "ai-insight-body", style: { fontSize: "var(--fs-md)" } },
          `${Format.number(p.huevos, 1)} huevos esperados · Confianza ${p.confianza}%`
        )
      )
    ));
    cont.append(UI.el("div", { class: "grid grid-4 mt-6" },
      UI.statCard({ label: "Huevos esperados", value: Format.number(p.huevos, 1), status: "is-good" }),
      UI.statCard({ label: "Confianza", value: p.confianza + "%", sub: p.confianza > 70 ? "alta" : p.confianza > 40 ? "media" : "baja (necesita mas datos)" }),
      UI.statCard({ label: "Ingreso estimado", value: Format.money(ingresos, cfg), sub: `@ ${Format.money(cfg.precioHuevoVenta, cfg)}/huevo` }),
      UI.statCard({ label: "Hembras activas", value: p.hembrasActivas })
    ));
    if (p.factorEstacional) {
      cont.append(UI.el("div", { class: "card mt-6" },
        UI.el("div", { class: "card-title" }, "Analisis"),
        UI.el("div", { class: "grid grid-3" },
          UI.el("div", {}, UI.el("div", { class: "dim", style: { fontSize: "var(--fs-xs)" } }, "Factor estacional del dia"), UI.el("div", { class: "mono bold" }, String(p.factorEstacional)), UI.el("div", { class: "dim", style: { fontSize: "var(--fs-xs)" } }, p.factorEstacional > 1 ? "mejor que el promedio" : p.factorEstacional < 1 ? "por debajo del promedio" : "promedio")),
          UI.el("div", {}, UI.el("div", { class: "dim", style: { fontSize: "var(--fs-xs)" } }, "Tendencia diaria"), UI.el("div", { class: `mono bold ${p.tendencia >= 0 ? "success" : "danger"}` }, (p.tendencia >= 0 ? "+" : "") + p.tendencia + " huev/dia"), UI.el("div", { class: "dim", style: { fontSize: "var(--fs-xs)" } }, "ultimas 2 semanas")),
          UI.el("div", {}, UI.el("div", { class: "dim", style: { fontSize: "var(--fs-xs)" } }, "Datos usados"), UI.el("div", { class: "mono bold" }, String(State.get().posturas.length) + " registros"))
        )
      ));
    }
  }

  return container;
};

window.Views.Prediccion = Views.Prediccion;
