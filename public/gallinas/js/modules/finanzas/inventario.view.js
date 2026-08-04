/* ============================================
   INVENTARIO.VIEW — stock de comida, productos
   y resumen de activos del negocio
   ============================================ */

Views.Inventario = function () {
  const container = UI.el("div", { class: "view" });
  const cfg = State.get().config;
  container.append(UI.el("div", { class: "view-header" },
    UI.el("div", { class: "view-title" }, "Inventario"),
    UI.el("div", { class: "view-sub" }, "Stock de comida y activos del negocio.")
  ));

  const total = AvesService.totalAves();
  const totalAves = AvesService.all();
  const vendidas = totalAves.filter(a => a.vendida).length;
  const muertas = totalAves.filter(a => a.muerta).length;
  const activas = totalAves.filter(a => !a.vendida && !a.muerta);
  const hembras = activas.filter(a => a.sexo === "hembra").length;
  const machos = activas.filter(a => a.sexo === "macho").length;

  container.append(UI.el("div", { class: "grid grid-4 mb-6" },
    UI.statCard({ label: "Gallineros activos", value: GallineroService.modulos().length }),
    UI.statCard({ label: "Capacidad total", value: H.sumBy(GallineroService.modulos(), m => m.capacidad) }),
    UI.statCard({ label: "Aves activas", value: activas.length, sub: `${hembras} H · ${machos} M`, status: "is-good" }),
    UI.statCard({ label: "Bajas (vendidas+muertas)", value: vendidas + muertas, sub: `${vendidas} vendidas · ${muertas} muertas` })
  ));

  // Depositos de comida
  const depCard = UI.el("div", { class: "card mb-6" },
    UI.el("div", { class: "card-header" },
      UI.el("div", { class: "card-title" }, "Depositos de comida / purina"),
      UI.el("button", { class: "btn btn-primary btn-sm", onclick: addDepositoForm }, "+ Agregar stock")
    )
  );
  container.append(depCard);

  const depTb = UI.el("table", { class: "table" });
  depCard.append(depTb);
  renderDepositos();

  function renderDepositos() {
    UI.clear(depTb);
    const deps = FinanzasService.depositos();
    if (!deps.length) {
      depTb.remove();
      depCard.append(UI.el("div", { class: "empty", id: "dep-empty" }, "Sin depositos. Agrega la comida que compres."));
      return;
    }
    depTb.append(UI.el("thead", {}, UI.el("tr", {}, UI.el("th", {}, "Fecha"), UI.el("th", {}, "Tipo/Desc"), UI.el("th", { class: "right" }, "Cantidad"), UI.el("th", {}, "Proveedor"), UI.el("th", { class: "right" }, "Costo"), UI.el("th", { class: "right" }, "Acciones"))));
    depTb.append(UI.el("tbody", {}, ...H.sortBy(deps, d => d.fecha, "desc").map(d => UI.el("tr", {},
      UI.el("td", { class: "mono" }, Format.date(d.fecha)),
      UI.el("td", {}, d.descripcion || d.tipo),
      UI.el("td", { class: "right mono bold" }, `${d.cantidad} ${d.unidad}`),
      UI.el("td", {}, d.proveedor || "—"),
      UI.el("td", { class: "right mono danger" }, "-" + Format.money(d.costo, cfg)),
      UI.el("td", { class: "right" }, UI.el("button", { class: "btn btn-ghost btn-sm", onclick: async () => { if (await UI.confirmDialog("Borrar deposito?")) { FinanzasService.removeDeposito(d.id); renderDepositos(); } } }, "×"))
    ))));
  }

  function addDepositoForm() {
    const body = UI.el("div", {},
      fg(UI.el("div", { class: "form-row" },
        UI.el("div", {}, UI.el("label", {}, "Tipo"), UI.el("select", { id: "d-tipo" }, UI.el("option", { value: "purina" }, "Purina"), UI.el("option", { value: "maiz" }, "Maiz"), UI.el("option", { value: "concentrado" }, "Concentrado"), UI.el("option", { value: "otro" }, "Otro"))),
        UI.el("div", {}, UI.el("label", {}, "Fecha"), UI.el("input", { id: "d-fecha", type: "date", value: Format.todayISO() }))
      )),
      fg(UI.el("div", { class: "form-row" },
        UI.el("div", {}, UI.el("label", {}, "Cantidad"), UI.el("input", { id: "d-cant", type: "number", step: "0.1", value: 0 })),
        UI.el("div", {}, UI.el("label", {}, "Unidad"), UI.el("select", { id: "d-unidad" }, UI.el("option", { value: "kg" }, "kg"), UI.el("option", { value: "qq" }, "quintales"), UI.el("option", { value: "sacos" }, "sacos"), UI.el("option", { value: "lb" }, "libras")))
      )),
      fg(UI.el("div", { class: "form-row" },
        UI.el("div", {}, UI.el("label", {}, "Costo total"), UI.el("input", { id: "d-costo", type: "number", step: "0.01", value: 0 })),
        UI.el("div", {}, UI.el("label", {}, "Proveedor"), UI.el("input", { id: "d-prov" }))
      )),
      fg(UI.el("div", {}, UI.el("label", {}, "Descripcion"), UI.el("input", { id: "d-desc", placeholder: "50kg purina iniciacion" })))
    );
    Modal.open({
      title: "Agregar stock",
      body,
      footer: [
        UI.el("button", { class: "btn btn-ghost", onclick: Modal.close }, "Cancelar"),
        UI.el("button", { class: "btn btn-primary", onclick: () => {
          FinanzasService.addDeposito({
            tipo: document.getElementById("d-tipo").value,
            fecha: document.getElementById("d-fecha").value,
            cantidad: document.getElementById("d-cant").value,
            unidad: document.getElementById("d-unidad").value,
            costo: document.getElementById("d-costo").value,
            proveedor: document.getElementById("d-prov").value,
            descripcion: document.getElementById("d-desc").value
          });
          // tambien registrar como gasto
          FinanzasService.addGasto({
            categoria: document.getElementById("d-tipo").value === "purina" ? "purina" : "comida",
            descripcion: document.getElementById("d-desc").value,
            monto: Number(document.getElementById("d-costo").value) || 0,
            fecha: document.getElementById("d-fecha").value,
            proveedor: document.getElementById("d-prov").value
          });
          Modal.close(); Toast.success("Stock y gasto registrados"); Router.go("inventario");
        } }, "Guardar")
      ]
    });
  }

  function fg(child) { const g = UI.el("div", { class: "form-group" }); g.append(child); return g; }

  // Resumen valor del negocio
  const valor = activas.length * (hembras * (cfg.precioGallinaVenta || 8) + machos * (cfg.precioGalloVenta || 12));
  const cardValor = UI.el("div", { class: "card mb-6" },
    UI.el("div", { class: "card-title" }, "Valor estimado del inventario"),
    UI.el("div", { class: "grid grid-3" },
      UI.el("div", {}, UI.el("div", { class: "dim", style: { fontSize: "var(--fs-xs)" } }, "Hembras"), UI.el("div", { class: "mono bold accent" }, Format.money(hembras * (cfg.precioGallinaVenta || 8), cfg))),
      UI.el("div", {}, UI.el("div", { class: "dim", style: { fontSize: "var(--fs-xs)" } }, "Machos"), UI.el("div", { class: "mono bold" }, Format.money(machos * (cfg.precioGalloVenta || 12), cfg))),
      UI.el("div", {}, UI.el("div", { class: "dim", style: { fontSize: "var(--fs-xs)" } }, "Total aves"), UI.el("div", { class: "mono bold accent", style: { fontSize: "var(--fs-lg)" } }, Format.money(valor, cfg)))
    ),
    UI.el("p", { class: "muted mt-4", style: { fontSize: "var(--fs-xs)" } }, "Estimado segun precios de venta configurados en Ajustes. No incluye huevos en stock.")
  );
  container.append(cardValor);

  return container;
};

window.Views.Inventario = Views.Inventario;
