/* ============================================
   INCUBADORA.VIEW — gestor de nidadas
   ============================================ */

Views.Incubadora = function () {
  const container = UI.el("div", { class: "view" });
  container.append(UI.el("div", { class: "view-header" },
    UI.el("div", { class: "view-title" }, "Incubadora"),
    UI.el("div", { class: "view-sub" }, "Nidadas de 20-40 huevos. La IA predice nacimientos y aprende tu tasa de fertilidad.")
  ));

  const st = IncubadoraService.stats();
  container.append(UI.el("div", { class: "grid grid-4 mb-6" },
    UI.statCard({ label: "Nidadas", value: st.total }),
    UI.statCard({ label: "Incubando", value: st.incubando, status: "is-warn" }),
    UI.statCard({ label: "Huevos en incubadora", value: st.huevosIncubados }),
    UI.statCard({ label: "Pollitos nacidos", value: st.nacidosTotal, status: "is-good" })
  ));

  container.append(UI.el("div", { class: "list-actions" },
    UI.el("button", { class: "btn btn-primary", onclick: nuevaNidada }, "🐣 + Nueva nidada")
  ));

  const grid = UI.el("div", { class: "grid grid-2" });
  container.append(grid);
  render();

  function render() {
    UI.clear(grid);
    const nids = H.sortBy(IncubadoraService.nidadas(), n => n.fechaInicio, "desc");
    if (!nids.length) { grid.append(UI.emptyState({ icon: "🐣", title: "Sin nidadas", sub: "Crea tu primera tanda (20-40 huevos)", action: UI.el("button", { class: "btn btn-primary", onclick: nuevaNidada }, "Nueva nidada") })); return; }
    nids.forEach(n => grid.append(cardNidada(n)));
  }

  function cardNidada(n) {
    const dia = IncubadoraService.diaActual(n);
    const rest = IncubadoraService.diasRestantes(n);
    const fase = IncubadoraService.fase(n);
    const pct = Math.min(100, (dia / IncubadoraService.DIAS_INCUBACION) * 100);
    const huevs = IncubadoraService.huevosIncubados(n.id);
    const incubando = huevs.filter(h => h.estado === "en incubacion").length;
    const nacidos = huevs.filter(h => h.estado === "nacido").length;
    const infertiles = huevs.filter(h => h.estado === "infertil").length;

    return UI.el("div", { class: "card", style: { cursor: "pointer" }, onclick: () => detalle(n) },
      UI.el("div", { class: "flex-between" },
        UI.el("div", {}, UI.el("div", { class: "bold", style: { fontSize: "var(--fs-md)" } }, n.nombre),
          UI.el("div", { class: "dim", style: { fontSize: "var(--fs-xs)" } }, `Inicio ${Format.date(n.fechaInicio)}`)),
        UI.badge(fase.nombre, fase.nombre === "Finalizada" ? "info" : "warn")
      ),
      UI.el("div", { class: "grid grid-3 mt-4" },
        UI.el("div", {}, UI.el("div", { class: "dim", style: { fontSize: "var(--fs-xs)" } }, "Huevos"), UI.el("div", { class: "mono bold" }, String(n.cantidadHuevos))),
        UI.el("div", {}, UI.el("div", { class: "dim", style: { fontSize: "var(--fs-xs)" } }, "Dia"), UI.el("div", { class: "mono bold" }, `${dia}/21`)),
        UI.el("div", {}, UI.el("div", { class: "dim", style: { fontSize: "var(--fs-xs)" } }, "Quedan"), UI.el("div", { class: "mono bold" }, `${rest}d`))
      ),
      UI.el("div", { class: "progress mt-4" }, UI.el("div", { class: `progress-bar ${fase.nombre === "Finalizada" ? "" : "is-warn"}`, style: { width: pct + "%" } })),
      nacidos > 0 ? UI.el("div", { class: "mt-4", style: { fontSize: "var(--fs-xs)" } },
        UI.el("span", { class: "success bold" }, `${nacidos} nacidos`),
        " · ",
        UI.el("span", { class: "warn" }, `${incubando} incubando`),
        " · ",
        UI.el("span", { class: "dim" }, `${infertiles} infertiles`)
      ) : null
    );
  }

  function nuevaNidada() {
    const mods = GallineroService.modulos();
    const body = UI.el("div", {},
      fg(UI.el("div", {}, UI.el("label", {}, "Nombre *"), UI.el("input", { id: "nin-nombre", placeholder: "Tanda 1 - Julio" }))),
      fg(UI.el("div", { class: "form-row" },
        UI.el("div", {}, UI.el("label", {}, "Cantidad huevos (1-40)"), UI.el("input", { id: "nin-cant", type: "number", min: 1, max: 40, value: 30 })),
        UI.el("div", {}, UI.el("label", {}, "Fecha inicio"), UI.el("input", { id: "nin-fecha", type: "date", value: Format.todayISO() }))
      )),
      fg(UI.el("div", { class: "form-row" },
        UI.el("div", {}, UI.el("label", {}, "Temperatura (C)"), UI.el("input", { id: "nin-temp", type: "number", step: "0.1", value: 37.7 })),
        UI.el("div", {}, UI.el("label", {}, "Humedad (%)"), UI.el("input", { id: "nin-hum", type: "number", value: 60 }))
      )),
      fg(UI.el("div", {}, UI.el("label", {}, "Modulo de origen (opcional)"), UI.el("select", { id: "nin-mod" }, UI.el("option", { value: "" }, "—"), ...mods.map(m => UI.el("option", { value: m.id }, m.nombre))))),
      fg(UI.el("div", {}, UI.el("label", {}, "Notas"), UI.el("textarea", { id: "nin-notas", rows: 2 })))
    );
    Modal.open({
      title: "Nueva nidada",
      body,
      footer: [
        UI.el("button", { class: "btn btn-ghost", onclick: Modal.close }, "Cancelar"),
        UI.el("button", { class: "btn btn-primary", onclick: () => {
          const nombre = document.getElementById("nin-nombre").value.trim();
          if (!nombre) return Toast.warn("Pon nombre");
          const r = IncubadoraService.crear({
            nombre, moduloOrigen: document.getElementById("nin-mod").value || null,
            cantidadHuevos: document.getElementById("nin-cant").value,
            fechaInicio: document.getElementById("nin-fecha").value,
            temperatura: document.getElementById("nin-temp").value,
            humedad: document.getElementById("nin-hum").value,
            notas: document.getElementById("nin-notas").value
          });
          if (r) { Modal.close(); Toast.success("Nidada creada"); render(); }
        } }, "Crear")
      ]
    });
  }

  function detalle(n) {
    const dia = IncubadoraService.diaActual(n);
    const fase = IncubadoraService.fase(n);
    const huevs = IncubadoraService.huevosIncubados(n.id);
    const incubando = huevs.filter(h => h.estado === "en incubacion").length;
    const nacidos = huevs.filter(h => h.estado === "nacido").length;
    const mods = GallineroService.modulos();

    const body = UI.el("div", {},
      UI.el("div", { class: "flex-between mb-6" },
        UI.el("div", {}, UI.el("div", { class: "view-title", style: { fontSize: "var(--fs-xl)" } }, n.nombre),
          UI.el("div", { class: "dim" }, `Dia ${dia}/21 · ${fase.nombre} · ${n.temperatura}C · ${n.humedad}%`)),
        UI.el("div", { class: "flex gap-2" },
          dia >= 18 ? UI.el("button", { class: "btn btn-primary btn-sm", onclick: () => registrarNacimientos(n) }, "🐥 Registrar nacimientos") : null,
          UI.el("button", { class: "btn btn-ghost btn-sm", onclick: () => marcarInfertilesForm(n) }, "Marcar infertiles"),
          UI.el("button", { class: "btn btn-danger btn-sm", onclick: async () => { if (await UI.confirmDialog(`Borrar nidada "${n.nombre}"?`)) { IncubadoraService.removeNidada(n.id); Modal.close(); render(); } } }, "Borrar")
        )
      ),
      UI.el("div", { class: "grid grid-4 mb-6" },
        UI.statCard({ label: "Total huevos", value: n.cantidadHuevos }),
        UI.statCard({ label: "Incubando", value: incubando, status: "is-warn" }),
        UI.statCard({ label: "Nacidos", value: nacidos, status: "is-good" }),
        UI.statCard({ label: "Dias restantes", value: IncubadoraService.diasRestantes(n) })
      ),
      UI.el("div", { class: "card" },
        UI.el("div", { class: "card-title" }, "Detalle de huevos"),
        UI.el("div", { class: "flex gap-2", style: { flexWrap: "wrap" } },
          ...huevs.map((h, i) => UI.el("div", { title: h.estado, style: {
            width: "28px", height: "28px", borderRadius: "50%",
            display: "grid", placeItems: "center", fontSize: "var(--fs-xs)",
            background: h.estado === "nacido" ? "var(--color-success-soft)" : h.estado === "infertil" ? "var(--color-danger-soft)" : "var(--color-warn-soft)",
            color: h.estado === "nacido" ? "var(--color-success)" : h.estado === "infertil" ? "var(--color-danger)" : "var(--color-warn)",
            border: "1px solid currentColor"
          } }, h.estado === "nacido" ? "🐥" : h.estado === "infertil" ? "✕" : "🥚"))
        )
      )
    );
    Modal.open({ title: "Detalle nidada", body, size: "lg" });
  }

  function marcarInfertilesForm(n) {
    const huevs = IncubadoraService.huevosIncubados(n.id).filter(h => h.estado === "en incubacion");
    const body = UI.el("div", {},
      UI.el("p", { class: "muted" }, `Quedan ${huevs.length} huevos incubando. Marca cuantos son infertiles (candling).`),
      fg(UI.el("div", {}, UI.el("label", {}, "Cantidad infertiles"), UI.el("input", { id: "inf-cant", type: "number", min: 0, max: huevs.length, value: 0 })))
    );
    Modal.open({
      title: "Marcar infertiles",
      body,
      footer: [
        UI.el("button", { class: "btn btn-ghost", onclick: Modal.close }, "Cancelar"),
        UI.el("button", { class: "btn btn-primary", onclick: () => {
          IncubadoraService.marcarInfertiles(n.id, Number(document.getElementById("inf-cant").value));
          Modal.close(); Toast.success("Actualizado"); detalle(IncubadoraService.byId(n.id));
        } }, "Guardar")
      ]
    });
  }

  function registrarNacimientos(n) {
    const huevs = IncubadoraService.huevosIncubados(n.id).filter(h => h.estado === "en incubacion");
    const mods = GallineroService.modulos();
    const body = UI.el("div", {},
      UI.el("p", { class: "muted" }, `${huevs.length} huevos incubando. Cuantos nacieron?`),
      fg(UI.el("div", { class: "form-row" },
        UI.el("div", {}, UI.el("label", {}, "Nacieron"), UI.el("input", { id: "nac-cant", type: "number", min: 0, max: huevs.length, value: huevs.length })),
        UI.el("div", {}, UI.el("label", {}, "Hembras (se quedan)"), UI.el("input", { id: "nac-hembras", type: "number", min: 0, value: Math.floor(huevs.length / 2) }))
      )),
      fg(UI.el("div", {}, UI.el("label", {}, "Machos (a vender)"), UI.el("input", { id: "nac-machos", type: "number", min: 0, value: Math.ceil(huevs.length / 2) }))),
      fg(UI.el("div", {}, UI.el("label", {}, "Modulo destino (opcional)"), UI.el("select", { id: "nac-mod" }, UI.el("option", { value: "" }, "— Sin asignar —"), ...mods.map(m => UI.el("option", { value: m.id }, m.nombre)))))
    );
    Modal.open({
      title: "Registrar nacimientos",
      body,
      footer: [
        UI.el("button", { class: "btn btn-ghost", onclick: Modal.close }, "Cancelar"),
        UI.el("button", { class: "btn btn-primary", onclick: () => {
          const cant = Number(document.getElementById("nac-cant").value);
          const hembras = Number(document.getElementById("nac-hembras").value);
          const machos = Number(document.getElementById("nac-machos").value);
          if (hembras + machos !== cant) return Toast.warn("Hembras + machos debe igualar total nacidos");
          IncubadoraService.registrarNacimientos(n.id, cant, { hembras, machos, destinoModulo: document.getElementById("nac-mod").value || null });
          Modal.close(); render();
        } }, "Registrar")
      ]
    });
  }

  function fg(child) { const g = UI.el("div", { class: "form-group" }); g.append(child); return g; }

  return container;
};

window.Views.Incubadora = Views.Incubadora;
