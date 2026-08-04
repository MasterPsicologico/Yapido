/* ============================================
   AVES.VIEW — listado y ficha individual de aves
   ============================================ */

Views.Aves = function () {
  const container = UI.el("div", { class: "view" });
  container.append(UI.el("div", { class: "view-header" },
    UI.el("div", { class: "view-title" }, "Aves"),
    UI.el("div", { class: "view-sub" }, "Inventario individual de hembras y machos. Cada gallina tiene su historial y productividad.")
  ));

  const total = AvesService.totalAves();
  const statsRow = UI.el("div", { class: "grid grid-4 mb-6" },
    UI.statCard({ label: "Total activas", value: total.total }),
    UI.statCard({ label: "Hembras", value: total.hembras, status: "is-good" }),
    UI.statCard({ label: "Machos", value: total.machos, status: "is-warn" }),
    UI.statCard({ label: "Vendidas / muertas", value: AvesService.all().filter(a => a.vendida || a.muerta).length })
  );
  container.append(statsRow);

  const listActions = UI.el("div", { class: "list-actions" },
    UI.el("input", { class: "search-input", type: "search", placeholder: "Buscar por placa o raza...", oninput: e => render(e.target.value, filtroSexo.value) }),
    UI.el("select", { id: "filtroSexo", style: { maxWidth: "160px" }, onchange: e => render(buscarInput.value, e.target.value) },
      UI.el("option", { value: "" }, "Todos"), UI.el("option", { value: "hembra" }, "Hembras"), UI.el("option", { value: "macho" }, "Machos")
    ),
    UI.el("button", { class: "btn btn-primary", onclick: addForm }, "+ Nueva ave")
  );
  const buscarInput = listActions.querySelector("input");
  const filtroSexo = listActions.querySelector("select");
  container.append(listActions);

  const grid = UI.el("div", { class: "grid grid-auto" });
  container.append(grid);

  function render(filter = "", sexo = "") {
    UI.clear(grid);
    let aves = AvesService.activas();
    if (sexo) aves = aves.filter(a => a.sexo === sexo);
    if (filter) { const f = filter.toLowerCase(); aves = aves.filter(a => a.placa.toLowerCase().includes(f) || (a.raza || "").toLowerCase().includes(f)); }
    if (!aves.length) { grid.append(UI.emptyState({ icon: "🐤", title: "Sin aves", sub: "Registra tu primera gallina o gallo", action: UI.el("button", { class: "btn btn-primary", onclick: addForm }, "+ Nueva ave") })); return; }

    aves.forEach(a => {
      const mod = GallineroService.modulo(a.moduloId);
      const m = a.sexo === "hembra" ? AvesService.metricas(a) : null;
      const card = UI.el("div", { class: "card", style: { cursor: "pointer" }, onclick: () => ficha(a) },
        UI.el("div", { class: "flex-between" },
          UI.el("div", {}, UI.el("div", { class: "mono bold", style: { fontSize: "var(--fs-md)" } }, a.placa),
            UI.el("div", { class: "dim", style: { fontSize: "var(--fs-xs)" } }, `${a.raza} · ${Format.ageString(a.nacimiento)}`)),
          a.sexo === "hembra" ? UI.badge("H", "accent") : UI.badge("M", "info")
        ),
        m ? UI.el("div", { class: "mt-4" },
          UI.el("div", { class: "flex-between", style: { fontSize: "var(--fs-xs)", color: "var(--color-text-muted)" } },
            UI.el("span", {}, "Tasa / dia"), UI.el("span", { class: "mono bold" }, String(m.tasa))
          ),
          UI.el("div", { class: "flex-between mt-2", style: { fontSize: "var(--fs-xs)", color: "var(--color-text-muted)" } },
            UI.el("span", {}, "Sin postura"), UI.el("span", { class: m.diasSinPostura > 3 ? "warn bold" : "dim" }, `${m.diasSinPostura} dias`)
          )
        ) : UI.el("div", { class: "mt-4 dim", style: { fontSize: "var(--fs-xs)" } }, "Macho · engorde/reproductor"),
        UI.el("div", { class: "mt-4 dim", style: { fontSize: "var(--fs-xs)" } }, mod ? "🏠 " + mod.nombre : "Sin modulo")
      );
      grid.append(card);
    });
  }

  function addForm() {
    const mods = GallineroService.modulos();
    if (!mods.length) { Toast.warn("Crea primero un modulo"); return Router.go("gallinero"); }
    const body = UI.el("div", {},
      form(UI.el("div", { class: "form-row" },
        UI.el("div", {}, UI.el("label", {}, "Placa *"), UI.el("input", { id: "n-placa", placeholder: "G-001" })),
        UI.el("div", {}, UI.el("label", {}, "Sexo *"), UI.el("select", { id: "n-sexo" }, UI.el("option", { value: "hembra" }, "Hembra"), UI.el("option", { value: "macho" }, "Macho")))
      )),
      form(UI.el("div", { class: "form-row" },
        UI.el("div", {}, UI.el("label", {}, "Raza"), UI.el("input", { id: "n-raza", placeholder: "Leghorn, Rhode Island..." })),
        UI.el("div", {}, UI.el("label", {}, "Nacimiento"), UI.el("input", { id: "n-nac", type: "date", value: Format.todayISO() }))
      )),
      form(UI.el("div", { class: "form-row" },
        UI.el("div", {}, UI.el("label", {}, "Modulo *"), UI.el("select", { id: "n-mod" }, ...mods.map(m => UI.el("option", { value: m.id }, m.nombre)))),
        UI.el("div", {}, UI.el("label", {}, "Peso (kg)"), UI.el("input", { id: "n-peso", type: "number", step: "0.1", value: "1.8" }))
      )),
      form(UI.el("div", {}, UI.el("label", {}, "Notas"), UI.el("textarea", { id: "n-notas", rows: 2 })))
    );
    Modal.open({
      title: "Nueva ave",
      body,
      footer: [
        UI.el("button", { class: "btn btn-ghost", onclick: Modal.close }, "Cancelar"),
        UI.el("button", { class: "btn btn-primary", onclick: () => {
          const placa = document.getElementById("n-placa").value.trim();
          if (!placa) return Toast.warn("Pon una placa");
          const r = AvesService.add({
            placa, sexo: document.getElementById("n-sexo").value,
            raza: document.getElementById("n-raza").value, moduloId: document.getElementById("n-mod").value,
            nacimiento: document.getElementById("n-nac").value ? new Date(document.getElementById("n-nac").value).toISOString() : null,
            peso: document.getElementById("n-peso").value, notas: document.getElementById("n-notas").value
          });
          if (r) { Modal.close(); Toast.success("Ave registrada"); render(); }
        } }, "Registrar")
      ]
    });
  }

  function ficha(a) {
    const m = AvesService.metricas(a);
    const posturas = AvesService.posturasAve(a.id);
    const mod = GallineroService.modulo(a.moduloId);
    const isHembra = a.sexo === "hembra";

    const body = UI.el("div", {},
      UI.el("div", { class: "flex-between mb-6" },
        UI.el("div", {}, UI.el("div", { class: "view-title", style: { fontSize: "var(--fs-xl)" } }, a.placa),
          UI.el("div", { class: "dim" }, `${a.raza} · ${a.sexo === "hembra" ? "Hembra" : "Macho"} · ${Format.ageString(a.nacimiento)}`)),
        UI.el("div", { class: "flex gap-2" },
          UI.el("button", { class: "btn btn-ghost btn-sm", onclick: () => addPostura(a) }, "🥚 + Postura"),
          UI.el("button", { class: "btn btn-ghost btn-sm", onclick: () => editarAve(a) }, "Editar"),
          UI.el("button", { class: "btn btn-danger btn-sm", onclick: async () => {
            if (await UI.confirmDialog("Marcar como muerta?")) { awaitAveMuerta(a.id, a.placa); }
          } }, "Muerta"),
          UI.el("button", { class: "btn btn-danger btn-sm", onclick: async () => {
            if (await AvesService.awaitConfirm(a.id)) { Modal.close(); render(); }
          } }, "Borrar")
        )
      ),
      UI.el("div", { class: "grid grid-4 mb-6" },
        UI.statCard({ label: "Huevos total", value: m.totalHuevos, status: "is-good" }),
        UI.statCard({ label: "Tasa / dia", value: m.tasa }),
        UI.statCard({ label: "Promedio 7d", value: m.promedio7 }),
        UI.statCard({ label: "Sin postura", value: m.diasSinPostura === 999 ? "nunca" : m.diasSinPostura + " d", status: m.diasSinPostura > 3 ? "is-bad" : "is-good" })
      ),
      UI.el("div", { class: "card mb-4" },
        UI.el("div", { class: "card-title" }, "Historial de postura"),
        posturas.length ? UI.el("table", { class: "table" },
          UI.el("thead", {}, UI.el("tr", {}, UI.el("th", {}, "Fecha"), UI.el("th", {}, "Modulo"), UI.el("th", { class: "right" }, "Huevos"), UI.el("th", {}, "Notas"))),
          UI.el("tbody", {}, ...H.lastN(posturas, 20).reverse().map(p => UI.el("tr", {},
            UI.el("td", { class: "mono" }, Format.date(p.fecha)),
            UI.el("td", {}, p.moduloId ? (GallineroService.modulo(p.moduloId) || {}).nombre || "—" : "—"),
            UI.el("td", { class: "right mono bold" }, String(p.cantidad)),
            UI.el("td", {}, p.notas || "—")
          )))
        ) : UI.el("div", { class: "empty" }, "Sin posturas registradas")
      ),
      isHembra ? UI.el("div", { class: "card" },
        UI.el("div", { class: "card-title" }, "Mini grafica (ultimas " + Math.min(30, posturas.length) + " posturas)"),
        (() => { const w = UI.el("div"); setTimeout(() => Chart.line(w, [{ data: H.lastN(posturas, 30).map(p => p.cantidad), color: "#f2b705" }], { labels: H.lastN(posturas, 30).map(p => Format.date(p.fecha).slice(0, 5)), points: true })); return w; })()
      ) : null,
      UI.el("div", { class: "card mt-4" },
        UI.el("div", { class: "card-title" }, "Datos"),
        UI.el("div", { class: "grid grid-3" },
          UI.el("div", {}, UI.el("div", { class: "dim", style: { fontSize: "var(--fs-xs)" } }, "Modulo"), UI.el("div", {}, mod ? mod.nombre : "—")),
          UI.el("div", {}, UI.el("div", { class: "dim", style: { fontSize: "var(--fs-xs)" } }, "Peso"), UI.el("div", {}, (a.peso || 0) + " kg")),
          UI.el("div", {}, UI.el("div", { class: "dim", style: { fontSize: "var(--fs-xs)" } }, "Estado"), UI.el("div", {}, a.estado))
        ),
        a.notas ? UI.el("p", { class: "mt-4 muted" }, a.notas) : null
      )
    );

    Modal.open({ title: `Ficha · ${a.placa}`, body, size: "lg" });
  }

  async function awaitAveMuerta(id, placa) {
    State.update(d => { const a = d.aves.find(x => x.id === id); if (a) { a.muerta = true; a.estado = "muerta"; a.fechaMuerte = new Date().toISOString(); } });
    State.update(d => d.eventos.push({ id: Storage.newId("ev"), tipo: "mortalidad", aveId: id, fecha: new Date().toISOString(), descripcion: `Ave ${placa} marcada como muerta` }));
    Modal.close(); Toast.warn("Ave marcada como muerta"); render();
  }

  function addPostura(a) {
    const body = UI.el("div", {},
      form(UI.el("div", { class: "form-row" },
        UI.el("div", {}, UI.el("label", {}, "Fecha"), UI.el("input", { id: "p-fecha", type: "date", value: Format.todayISO() })),
        UI.el("div", {}, UI.el("label", {}, "Cantidad huevos"), UI.el("input", { id: "p-cant", type: "number", min: 0, value: 1 }))
      )),
      form(UI.el("div", {}, UI.el("label", {}, "Notas"), UI.el("textarea", { id: "p-notas", rows: 2 })))
    );
    Modal.open({
      title: `Registrar postura · ${a.placa}`,
      body,
      footer: [
        UI.el("button", { class: "btn btn-ghost", onclick: Modal.close }, "Cancelar"),
        UI.el("button", { class: "btn btn-primary", onclick: () => {
          AvesService.registrarPostura({ moduloId: a.moduloId, fecha: document.getElementById("p-fecha").value, cantidad: document.getElementById("p-cant").value, aveId: a.id, notas: document.getElementById("p-notas").value });
          Modal.close(); Toast.success("Postura registrada"); ficha(AvesService.byId(a.id));
        } }, "Registrar")
      ]
    });
  }

  function editarAve(a) {
    const mods = GallineroService.modulos();
    const body = UI.el("div", {},
      form(UI.el("div", { class: "form-row" },
        UI.el("div", {}, UI.el("label", {}, "Placa"), UI.el("input", { id: "e-placa", value: a.placa })),
        UI.el("div", {}, UI.el("label", {}, "Sexo"), UI.el("select", { id: "e-sexo" }, UI.el("option", { value: "hembra", selected: a.sexo === "hembra" }, "Hembra"), UI.el("option", { value: "macho", selected: a.sexo === "macho" }, "Macho")))
      )),
      form(UI.el("div", { class: "form-row" },
        UI.el("div", {}, UI.el("label", {}, "Raza"), UI.el("input", { id: "e-raza", value: a.raza || "" })),
        UI.el("div", {}, UI.el("label", {}, "Nacimiento"), UI.el("input", { id: "e-nac", type: "date", value: a.nacimiento ? a.nacimiento.slice(0, 10) : "" }))
      )),
      form(UI.el("div", { class: "form-row" },
        UI.el("div", {}, UI.el("label", {}, "Modulo"), UI.el("select", { id: "e-mod" }, ...mods.map(m => UI.el("option", { value: m.id, selected: m.id === a.moduloId }, m.nombre)))),
        UI.el("div", {}, UI.el("label", {}, "Peso (kg)"), UI.el("input", { id: "e-peso", type: "number", step: "0.1", value: a.peso || 0 }))
      )),
      form(UI.el("div", {}, UI.el("label", {}, "Notas"), UI.el("textarea", { id: "e-notas", rows: 2 }, a.notas || "")))
    );
    Modal.open({
      title: "Editar ave",
      body,
      footer: [
        UI.el("button", { class: "btn btn-ghost", onclick: Modal.close }, "Cancelar"),
        UI.el("button", { class: "btn btn-primary", onclick: () => {
          AvesService.update(a.id, {
            placa: document.getElementById("e-placa").value.trim(),
            sexo: document.getElementById("e-sexo").value,
            raza: document.getElementById("e-raza").value,
            moduloId: document.getElementById("e-mod").value,
            nacimiento: document.getElementById("e-nac").value ? new Date(document.getElementById("e-nac").value).toISOString() : a.nacimiento,
            peso: Number(document.getElementById("e-peso").value),
            notas: document.getElementById("e-notas").value
          });
          Modal.close(); Toast.success("Actualizado"); ficha(AvesService.byId(a.id));
        } }, "Guardar")
      ]
    });
  }

  function form(child) { const g = UI.el("div", { class: "form-group" }); g.append(child); return g; }

  render();
  return container;
};

window.Views = window.Views || {}; window.Views.Aves = Views.Aves;
