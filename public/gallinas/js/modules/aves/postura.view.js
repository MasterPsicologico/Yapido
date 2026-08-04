/* ============================================
   POSTURA.VIEW — registro diario de huevos
   Por modulo / por ave / por fecha
   ============================================ */

Views.Postura = function () {
  const container = UI.el("div", { class: "view" });
  container.append(UI.el("div", { class: "view-header" },
    UI.el("div", { class: "view-title" }, "Postura diaria"),
    UI.el("div", { class: "view-sub" }, "Cuantos huevos recoges cada dia. La IA usa esto para predecir la produccion.")
  ));

  const stats = UI.el("div", { class: "grid grid-4 mb-6" });
  container.append(stats);

  const ultimos7 = AvesService.posturasUltimosDias(7);
  const ultimos30 = AvesService.posturasUltimosDias(30);
  const total7 = H.sumBy(ultimos7, p => p.cantidad);
  const total30 = H.sumBy(ultimos30, p => p.cantidad);
  stats.append(
    UI.statCard({ label: "Huevos hoy", value: H.sumBy(AvesService.posturaPorDia(Format.todayISO()), p => p.cantidad), status: "is-good" }),
    UI.statCard({ label: "Ultimos 7 dias", value: total7, sub: H.round(total7 / 7, 1) + " prom/dia" }),
    UI.statCard({ label: "Ultimos 30 dias", value: total30, sub: H.round(total30 / 30, 1) + " prom/dia" }),
    UI.statCard({ label: "Hembras activas", value: AvesService.totalAves().hembras })
  );

  // Acciones
  const actions = UI.el("div", { class: "list-actions" },
    UI.el("button", { class: "btn btn-primary", onclick: registroRapido }, "🥚 + Registro rapido"),
    UI.el("button", { class: "btn btn-ghost", onclick: registroPorModulo }, "📍 Por modulo"),
    UI.el("button", { class: "btn btn-ghost", onclick: registroPorAve }, "🐤 Por ave")
  );
  container.append(actions);

  // Grafica ultimos 30 dias
  const chartCard = UI.el("div", { class: "card mb-6" },
    UI.el("div", { class: "card-title" }, "Produccion ultimos 30 dias"),
    UI.el("div", { id: "post-chart" })
  );
  container.append(chartCard);
  setTimeout(() => {
    const porFecha = H.groupBy(ultimos30, p => p.fecha);
    const datas = ultimos30.length ? Object.entries(porFecha).sort().map(([f, ps]) => H.sumBy(ps, p => p.cantidad)) : [];
    const labels = ultimos30.length ? Object.keys(porFecha).sort().map(f => f.slice(5)) : H.range(0, 29).map(i => `${i}`);
    Chart.line(document.getElementById("post-chart"), [{ data: datas, color: "#f2b705" }], { labels, points: true });
  }, 30);

  // Detalle por dia
  const detalle = UI.el("div", { class: "card" },
    UI.el("div", { class: "card-header" },
      UI.el("div", { class: "card-title" }, "Detalle por dia"),
      UI.el("input", { id: "post-date", type: "date", value: Format.todayISO(), onchange: e => renderDetalle(e.target.value) })
    ),
    UI.el("div", { id: "post-detalle" })
  );
  container.append(detalle);
  setTimeout(() => renderDetalle(Format.todayISO()), 30);

  function renderDetalle(fecha) {
    const cont = document.getElementById("post-detalle");
    if (!cont) return;
    UI.clear(cont);
    const ps = AvesService.posturaPorDia(fecha).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (!ps.length) { cont.append(UI.emptyState({ icon: "🥚", title: "Sin posturas esta fecha", sub: "Usa el boton + Registro rapido" })); return; }
    cont.append(UI.el("table", { class: "table" },
      UI.el("thead", {}, UI.el("tr", {}, UI.el("th", {}, "Modulo"), UI.el("th", {}, "Ave"), UI.el("th", { class: "right" }, "Huevos"), UI.el("th", {}, "Notas"))),
      UI.el("tbody", {}, ...ps.map(p => UI.el("tr", {},
        UI.el("td", {}, p.moduloId ? ((GallineroService.modulo(p.moduloId) || {}).nombre) || "—" : "—"),
        UI.el("td", { class: "mono" }, p.aveId ? ((AvesService.byId(p.aveId) || {}).placa) || "—" : "—"),
        UI.el("td", { class: "right mono bold" }, String(p.cantidad)),
        UI.el("td", {}, p.notas || "—")
      )))
    ));
  }

  function registroRapido() {
    const mods = GallineroService.modulos();
    if (!mods.length) { Toast.warn("Crea un modulo"); return; }
    const body = UI.el("div", {},
      fg(UI.el("div", { class: "form-row" },
        UI.el("div", {}, UI.el("label", {}, "Fecha"), UI.el("input", { id: "r-fecha", type: "date", value: Format.todayISO() })),
        UI.el("div", {}, UI.el("label", {}, "Huevos"), UI.el("input", { id: "r-cant", type: "number", min: 0, value: 0 }))
      )),
      fg(UI.el("div", {}, UI.el("label", {}, "Modulo"), UI.el("select", { id: "r-mod" }, UI.el("option", { value: "" }, "— Distribuido —"), ...mods.map(m => UI.el("option", { value: m.id }, m.nombre))))),
      fg(UI.el("div", {}, UI.el("label", {}, "Notas"), UI.el("textarea", { id: "r-notas", rows: 2 })))
    );
    Modal.open({
      title: "Registro rapido de postura",
      body,
      footer: [
        UI.el("button", { class: "btn btn-ghost", onclick: Modal.close }, "Cancelar"),
        UI.el("button", { class: "btn btn-primary", onclick: () => {
          const cant = Number(document.getElementById("r-cant").value);
          if (cant <= 0) return Toast.warn("Pon al menos 1 huevo");
          AvesService.registrarPostura({
            fecha: document.getElementById("r-fecha").value, cantidad: cant,
            moduloId: document.getElementById("r-mod").value || null,
            aveId: null, notas: document.getElementById("r-notas").value
          });
          Modal.close(); Toast.success("Postura registrada");
          Router.go("postura");
        } }, "Registrar")
      ]
    });
  }

  function registroPorModulo() {
    const mods = GallineroService.modulos();
    if (!mods.length) { Toast.warn("Crea un modulo"); return; }
    const body = UI.el("div", {},
      fg(UI.el("div", { class: "form-row" },
        UI.el("div", {}, UI.el("label", {}, "Fecha"), UI.el("input", { id: "rm-fecha", type: "date", value: Format.todayISO() })),
        UI.el("div", {}, UI.el("label", {}, "Modulo"), UI.el("select", { id: "rm-mod" }, ...mods.map(m => UI.el("option", { value: m.id }, m.nombre))))
      )),
      UI.el("div", { id: "rm-aves" })
    );
    Modal.open({
      title: "Postura por modulo",
      body,
      footer: [
        UI.el("button", { class: "btn btn-ghost", onclick: Modal.close }, "Cancelar"),
        UI.el("button", { class: "btn btn-primary", onclick: () => {
          const fecha = document.getElementById("rm-fecha").value;
          const modId = document.getElementById("rm-mod").value;
          const inputs = document.querySelectorAll("[data-ave-input]");
          let total = 0;
          inputs.forEach(inp => {
            const n = Number(inp.value);
            if (n > 0) { AvesService.registrarPostura({ fecha, cantidad: n, moduloId: modId, aveId: inp.dataset.aveInput, notas: "Por modulo" }); total += n; }
          });
          // restantes distribuidos
          const totalGral = Number(document.getElementById("rm-gral").value) || 0;
          if (totalGral > 0) { AvesService.registrarPostura({ fecha, cantidad: totalGral, moduloId: modId, aveId: null, notas: "Generales del modulo" }); total += totalGral; }
          Modal.close(); Toast.success(`Registrados ${total} huevos`); Router.go("postura");
        } }, "Registrar todas")
      ]
    });
    document.getElementById("rm-mod").addEventListener("change", rellenarAvesMod);
    document.getElementById("rm-fecha").addEventListener("change", rellenarAvesMod);
    body.append(fg(UI.el("div", {}, UI.el("label", {}, "Huevos generales (sin ave asignada)"), UI.el("input", { id: "rm-gral", type: "number", min: 0, value: 0 }))));
    rellenarAvesMod();
    function rellenarAvesMod() {
      const cont = document.getElementById("rm-aves"); if (!cont) return; UI.clear(cont);
      const modId = document.getElementById("rm-mod").value;
      const aves = AvesService.activas().filter(a => a.moduloId === modId && a.sexo === "hembra");
      if (!aves.length) { cont.append(UI.el("p", { class: "dim" }, "No hay hembras en este modulo")); return; }
      aves.forEach(a => cont.append(fg(UI.el("div", { class: "form-row" },
        UI.el("div", { class: "mono" }, a.placa),
        UI.el("input", { type: "number", min: 0, value: 0, dataset: { aveInput: a.id } })
      ))));
    }
  }

  function registroPorAve() {
    const aves = AvesService.activas().filter(a => a.sexo === "hembra");
    if (!aves.length) { Toast.warn("Registra hembras primero"); return; }
    const body = UI.el("div", {},
      fg(UI.el("div", {}, UI.el("label", {}, "Fecha"), UI.el("input", { id: "ra-fecha", type: "date", value: Format.todayISO() }))),
      UI.el("div", { id: "ra-lista" })
    );
    Modal.open({
      title: "Postura por ave",
      body,
      footer: [
        UI.el("button", { class: "btn btn-ghost", onclick: Modal.close }, "Cancelar"),
        UI.el("button", { class: "btn btn-primary", onclick: () => {
          const fecha = document.getElementById("ra-fecha").value;
          const inputs = document.querySelectorAll("[data-ave-op]");
          let total = 0;
          inputs.forEach(tr => { const n = Number(tr.querySelector("input").value); if (n > 0) { AvesService.registrarPostura({ fecha, cantidad: n, moduloId: tr.dataset.mod, aveId: tr.dataset.aveOp, notas: "Por ave" }); total += n; } });
          Modal.close(); Toast.success(`Registrados ${total} huevos`); Router.go("postura");
        } }, "Registrar")
      ]
    });
    const cont = document.getElementById("ra-lista");
    aves.forEach(a => cont.append(UI.el("div", { class: "flex-between", "data-ave-op": a.id, "data-mod": a.moduloId, style: { padding: "8px 0", borderBottom: "1px solid var(--color-border)" } },
      UI.el("div", {}, UI.el("div", { class: "mono bold" }, a.placa), UI.el("div", { class: "dim", style: { fontSize: "var(--fs-xs)" } }, a.raza)),
      UI.el("input", { type: "number", min: 0, value: 0, style: { maxWidth: "90px" } })
    )));
  }

  function fg(child) { const g = UI.el("div", { class: "form-group" }); g.append(child); return g; }

  return container;
};

window.Views.Postura = Views.Postura;
