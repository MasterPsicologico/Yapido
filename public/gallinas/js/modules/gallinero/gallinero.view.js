/* ============================================
   GALLINERO.VIEW — vistas de gallineros
   ============================================ */

const Views = window.Views || {};

Views.Gallinero = function () {
  const container = UI.el("div", { class: "view" });

  container.append(UI.el("div", { class: "view-header" },
    UI.el("div", { class: "view-title" }, "Gallineros"),
    UI.el("div", { class: "view-sub" }, "Modulos de max 100 aves. Separados para evitar propagacion de enfermedades.")
  ));

  const listActions = UI.el("div", { class: "list-actions" },
    UI.el("input", { class: "search-input", type: "search", placeholder: "Buscar modulo...", oninput: (e) => renderCards(e.target.value) }),
    UI.el("button", { class: "btn btn-ghost", onclick: addUbicacionForm }, "+ Ubicacion"),
    UI.el("button", { class: "btn btn-primary", onclick: addModuloForm }, "+ Nuevo modulo")
  );
  container.append(listActions);

  const grid = UI.el("div", { class: "grid grid-auto" });
  container.append(grid);

  function renderCards(filter = "") {
    UI.clear(grid);
    const mods = GallineroService.modulos();
    const f = filter.toLowerCase();
    const filtered = mods.filter(m => m.nombre.toLowerCase().includes(f));
    if (!filtered.length) { grid.append(UI.emptyState({ icon: "🏠", title: "Sin modulos", sub: "Crea tu primer modulo de gallinas", action: UI.el("button", { class: "btn btn-primary", onclick: addModuloForm }, "+ Nuevo modulo") })); return; }

    filtered.forEach(m => {
      const ubic = GallineroService.ubicaciones().find(u => u.id === m.ubicacionId);
      const aves = GallineroService.avesEnModulo(m.id);
      const st = GallineroService.stats(m.id);
      const disp = GallineroService.capacidadDisponible(m);
      const pctOcup = Math.min(100, (aves.length / m.capacidad) * 100);
      const statusCls = disp > 20 ? "is-good" : disp > 0 ? "is-warn" : "is-bad";

      const card = UI.el("div", { class: "card", style: { cursor: "pointer" }, onclick: () => vistaModulo(m) },
        UI.el("div", { class: "flex-between" },
          UI.el("div", {},
            UI.el("div", { class: "bold", style: { fontSize: "var(--fs-md)" } }, m.nombre),
            UI.el("div", { class: "dim", style: { fontSize: "var(--fs-xs)" } }, ubic ? ubic.nombre : "Sin ubicacion")
          ),
          UI.badge(`${aves.length}/${m.capacidad}`, disp > 0 ? "info" : "danger")
        ),
        UI.el("div", { class: "grid grid-3 mt-4" },
          UI.el("div", {}, UI.el("div", { class: "dim", style: { fontSize: "var(--fs-xs)" } }, "Hembras"), UI.el("div", { class: "mono bold" }, String(st.hembras))),
          UI.el("div", {}, UI.el("div", { class: "dim", style: { fontSize: "var(--fs-xs)" } }, "Machos"), UI.el("div", { class: "mono bold" }, String(st.machos))),
          UI.el("div", {}, UI.el("div", { class: "dim", style: { fontSize: "var(--fs-xs)" } }, "Disponibles"), UI.el("div", { class: `mono bold ${disp > 0 ? "success" : "danger"}` }, String(disp)))
        ),
        UI.el("div", { class: "progress mt-4" }, UI.el("div", { class: `progress-bar ${statusCls}`, style: { width: pctOcup + "%" } }))
      );
      grid.append(card);
    });
  }

  function addUbicacionForm() {
    const body = UI.el("div", {},
      formGroup(UI.el("div", {}, UI.el("label", {}, "Nombre"), UI.el("input", { id: "ubi-nombre", placeholder: "Finca norte" }))),
      formGroup(UI.el("div", {}, UI.el("label", {}, "Direccion (opcional)"), UI.el("input", { id: "ubi-dir" }))),
      formGroup(UI.el("div", {}, UI.el("label", {}, "Notas"), UI.el("textarea", { id: "ubi-notas", rows: 2 })))
    );
    Modal.open({
      title: "Nueva ubicacion",
      body,
      footer: [
        UI.el("button", { class: "btn btn-ghost", onclick: Modal.close }, "Cancelar"),
        UI.el("button", { class: "btn btn-primary", onclick: () => {
          const nombre = document.getElementById("ubi-nombre").value.trim();
          if (!nombre) return Toast.warn("Pon un nombre");
          GallineroService.addUbicacion({ nombre, direccion: document.getElementById("ubi-dir").value, notas: document.getElementById("ubi-notas").value });
          Modal.close(); Toast.success("Ubicacion creada"); renderCards();
        } }, "Crear")
      ]
    });
  }

  function addModuloForm() {
    const cfg = State.get().config;
    const ubis = GallineroService.ubicaciones();
    if (!ubis.length) { Toast.warn("Crea primero una ubicacion"); return addUbicacionForm(); }
    const body = UI.el("div", {},
      formGroup(UI.el("div", {}, UI.el("label", {}, "Nombre"), UI.el("input", { id: "mod-nombre", placeholder: "Modulo A" }))),
      formGroup(UI.el("div", {}, UI.el("label", {}, "Ubicacion"),
        UI.el("select", { id: "mod-ubi" }, ...ubis.map(u => UI.el("option", { value: u.id }, u.nombre)))
      )),
      formGroup(UI.el("div", {}, UI.el("label", {}, `Capacidad (max ${cfg.capacidadModulo})`), UI.el("input", { id: "mod-cap", type: "number", value: cfg.capacidadModulo, max: cfg.capacidadModulo }))),
      formGroup(UI.el("div", {}, UI.el("label", {}, "Notas"), UI.el("textarea", { id: "mod-notas", rows: 2 })))
    );
    Modal.open({
      title: "Nuevo modulo",
      body,
      footer: [
        UI.el("button", { class: "btn btn-ghost", onclick: Modal.close }, "Cancelar"),
        UI.el("button", { class: "btn btn-primary", onclick: () => {
          const nombre = document.getElementById("mod-nombre").value.trim();
          if (!nombre) return Toast.warn("Pon un nombre");
          GallineroService.addModulo({
            nombre,
            ubicacionId: document.getElementById("mod-ubi").value,
            capacidad: document.getElementById("mod-cap").value,
            notas: document.getElementById("mod-notas").value
          });
          Modal.close(); Toast.success("Modulo creado"); renderCards();
        } }, "Crear")
      ]
    });
  }

  function vistaModulo(m) {
    const aves = GallineroService.avesEnModulo(m.id);
    container.querySelectorAll(".open").forEach(x => x.classList.remove("open"));
    const body = UI.el("div", {},
      UI.el("div", { class: "card mb-4" },
        UI.el("div", { class: "flex-between" },
          UI.el("div", {}, UI.el("div", { class: "bold", style: { fontSize: "var(--fs-lg)" } }, m.nombre),
            UI.el("div", { class: "dim" }, m.notas || "Sin notas")),
          UI.el("div", { class: "flex gap-2" },
            UI.el("button", { class: "btn btn-ghost btn-sm", onclick: () => editarModulo(m) }, "Editar"),
            UI.el("button", { class: "btn btn-danger btn-sm", onclick: async () => {
              if (await UI.confirmDialog(`Borrar modulo "${m.nombre}"?`)) {
                if (GallineroService.removeModulo(m.id)) { Modal.close(); renderCards(); Toast.success("Modulo borrado"); }
              }
            } }, "Borrar")
          )
        )
      ),
      UI.el("div", { class: "card" },
        UI.el("div", { class: "card-header" }, UI.el("div", { class: "card-title" }, `Aves activas (${aves.length})`)),
        aves.length ? renderTablaAves(aves, m) : UI.el("div", { class: "empty" }, "No hay aves en este modulo")
      )
    );
    Modal.open({ title: "Detalle modulo", body, size: "lg" });
  }

  function editarModulo(m) {
    const ubis = GallineroService.ubicaciones();
    const body = UI.el("div", {},
      formGroup(UI.el("div", {}, UI.el("label", {}, "Nombre"), UI.el("input", { id: "em-nombre", value: m.nombre }))),
      formGroup(UI.el("div", {}, UI.el("label", {}, "Ubicacion"), UI.el("select", { id: "em-ubi" }, ...ubis.map(u => UI.el("option", { value: u.id, selected: u.id === m.ubicacionId }, u.nombre))))),
      formGroup(UI.el("div", {}, UI.el("label", {}, "Capacidad"), UI.el("input", { id: "em-cap", type: "number", value: m.capacidad }))),
      formGroup(UI.el("div", {}, UI.el("label", {}, "Notas"), UI.el("textarea", { id: "em-notas", rows: 2 }, m.notas || "")))
    );
    Modal.open({
      title: "Editar modulo",
      body,
      footer: [
        UI.el("button", { class: "btn btn-ghost", onclick: Modal.close }, "Cancelar"),
        UI.el("button", { class: "btn btn-primary", onclick: () => {
          GallineroService.updateModulo(m.id, {
            nombre: document.getElementById("em-nombre").value.trim() || m.nombre,
            ubicacionId: document.getElementById("em-ubi").value,
            capacidad: Number(document.getElementById("em-cap").value) || m.capacidad,
            notas: document.getElementById("em-notas").value
          });
          Modal.close(); Toast.success("Actualizado"); renderCards();
        } }, "Guardar")
      ]
    });
  }

  function renderTablaAves(aves, mod) {
    return UI.el("table", { class: "table" },
      UI.el("thead", {}, UI.el("tr", {},
        UI.el("th", {}, "Placa"), UI.el("th", {}, "Sexo"), UI.el("th", {}, "Raza"),
        UI.el("th", {}, "Edad"), UI.el("th", {}, "Estado"), UI.el("th", { class: "right" }, "Acciones")
      )),
      UI.el("tbody", {}, ...aves.map(a => UI.el("tr", {},
        UI.el("td", { class: "mono bold" }, a.placa),
        UI.el("td", {}, a.sexo === "hembra" ? "🐤 H" : "♂ M"),
        UI.el("td", {}, a.raza || "—"),
        UI.el("td", {}, Format.ageString(a.nacimiento)),
        UI.el("td", {}, a.estado === "activa" ? UI.badge("Activa", "success") : UI.badge(a.estado || "—", "warn")),
        UI.el("td", { class: "right" },
          UI.el("button", { class: "btn btn-ghost btn-sm", onclick: () => Router.go("aves") }, "Ver")
        )
      )))
    );
  }

  function formGroup(child) { const g = UI.el("div", { class: "form-group" }); g.append(child); return g; }

  renderCards();
  return container;
};

window.Views = Views;
