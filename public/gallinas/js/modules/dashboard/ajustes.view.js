/* ============================================
   AJUSTES.VIEW — configuracion de la granja
   ============================================ */

Views.Ajustes = function () {
  const container = UI.el("div", { class: "view" });
  const cfg = State.get().config;

  container.append(UI.el("div", { class: "view-header" },
    UI.el("div", { class: "view-title" }, "Ajustes"),
    UI.el("div", { class: "view-sub" }, "Parametros del negocio. La IA usa estos precios para calculos.")
  ));

  // Forms
  const card = UI.el("div", { class: "card mb-6" },
    UI.el("div", { class: "card-title" }, "Datos de la granja"),
    fg(UI.el("div", { class: "form-row" },
      UI.el("div", {}, UI.el("label", {}, "Nombre granja"), UI.el("input", { id: "c-nombre", value: cfg.nombreGranja || "" })),
      UI.el("div", {}, UI.el("label", {}, "Moneda"), UI.el("input", { id: "c-mon", value: cfg.moneda || "USD", style: { maxWidth: "120px" } }))
    )),
    fg(UI.el("div", {}, UI.el("label", {}, "Simbolo moneda"), UI.el("input", { id: "c-simb", value: cfg.simboloMoneda || "$", style: { maxWidth: "100px" } })))
  );
  container.append(card);

  const cardPrec = UI.el("div", { class: "card mb-6" },
    UI.el("div", { class: "card-title" }, "Precios de venta"),
    fg(UI.el("div", { class: "form-row" },
      UI.el("div", {}, UI.el("label", {}, "Precio por huevo"), UI.el("input", { id: "c-huevo", type: "number", step: "0.01", value: cfg.precioHuevoVenta || 0 })),
      UI.el("div", {}, UI.el("label", {}, "Precio gallina"), UI.el("input", { id: "c-gallina", type: "number", step: "0.01", value: cfg.precioGallinaVenta || 0 }))
    )),
    fg(UI.el("div", { class: "form-row" },
      UI.el("div", {}, UI.el("label", {}, "Precio gallo"), UI.el("input", { id: "c-gallo", type: "number", step: "0.01", value: cfg.precioGalloVenta || 0 })),
      UI.el("div", {}, UI.el("label", {}, "Precio pollito"), UI.el("input", { id: "c-pollito", type: "number", step: "0.01", value: 0.5 }))
    ))
  );
  container.append(cardPrec);

  const cardCfg = UI.el("div", { class: "card mb-6" },
    UI.el("div", { class: "card-title" }, "Parametros operativos"),
    fg(UI.el("div", { class: "form-row" },
      UI.el("div", {}, UI.el("label", {}, "Capacidad por modulo"), UI.el("input", { id: "c-cap", type: "number", value: cfg.capacidadModulo || 100 })),
      UI.el("div", {}, UI.el("label", {}, "Dias alerta mortalidad"), UI.el("input", { id: "c-alerta", type: "number", value: cfg.diasMortalidadAlerta || 7 }))
    )),
    fg(UI.el("div", { class: "form-row" },
      UI.el("div", {}, UI.el("label", {}, "Dias racha baja produccion"), UI.el("input", { id: "c-baja", type: "number", value: cfg.diasBajaProduccion || 3 })),
      UI.el("div", {}, UI.el("label", {}, "Umbral baja (% del modulo)"), UI.el("input", { id: "c-umbral", type: "number", step: "0.01", value: cfg.umbralBajaProduccion || 0.4 }))
    ))
  );
  container.append(cardCfg);

  container.append(UI.el("div", { class: "list-actions" },
    UI.el("button", { class: "btn btn-primary", onclick: guardar }, "💾 Guardar ajustes"),
    UI.el("button", { class: "btn btn-danger", style: { marginLeft: "auto" }, onclick: async () => {
      if (await UI.confirmDialog("Esto borra todos tus datos. Continuar?")) {
        Storage.reset(); State.reload(); Toast.warn("Datos borrados"); Router.go("dashboard");
      }
    } }, "🗑 Borrar todos los datos")
  ));

  function guardar() {
    State.update(d => {
      d.config.nombreGranja = document.getElementById("c-nombre").value;
      d.config.moneda = document.getElementById("c-mon").value;
      d.config.simboloMoneda = document.getElementById("c-simb").value;
      d.config.precioHuevoVenta = Number(document.getElementById("c-huevo").value) || 0;
      d.config.precioGallinaVenta = Number(document.getElementById("c-gallina").value) || 0;
      d.config.precioGalloVenta = Number(document.getElementById("c-gallo").value) || 0;
      d.config.capacidadModulo = Number(document.getElementById("c-cap").value) || 100;
      d.config.diasMortalidadAlerta = Number(document.getElementById("c-alerta").value) || 7;
      d.config.diasBajaProduccion = Number(document.getElementById("c-baja").value) || 3;
      d.config.umbralBajaProduccion = Number(document.getElementById("c-umbral").value) || 0.4;
    });
    Toast.success("Ajustes guardados");
    Router.go("dashboard");
  }

  function fg(child) { const g = UI.el("div", { class: "form-group" }); g.append(child); return g; }

  return container;
};

window.Views.Ajustes = Views.Ajustes;
