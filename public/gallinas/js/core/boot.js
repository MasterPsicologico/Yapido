/* ============================================
   BOOT — arranca la aplicacion
   ============================================ */

(function boot() {
  // Fecha en header
  const fecha = new Date();
  document.getElementById("headerDate").textContent = fecha.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // Sidebar toggle mobile
  document.getElementById("sidebarToggle").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
    document.getElementById("scrim").classList.toggle("show");
  });
  document.getElementById("scrim").addEventListener("click", () => {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("scrim").classList.remove("show");
  });

  // Export / Import globales
  document.getElementById("exportData").addEventListener("click", () => {
    Storage.exportJSON();
    Toast.success("Exportado correctamente");
  });
  const importInput = document.getElementById("importFile");
  document.getElementById("importData").addEventListener("click", () => importInput.click());
  importInput.addEventListener("change", async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      await Storage.importJSON(f);
      State.reload();
      Router.go("dashboard");
      Toast.success("Datos importados");
    } catch (err) {
      Toast.error("Archivo invalido");
    }
    importInput.value = "";
  });

  // Registrar todas las rutas
  Router.register("dashboard",   Views.Dashboard,      { title: "Dashboard", sub: "Resumen general del sistema" });
  Router.register("gallinero",    Views.Gallinero,      { title: "Gallineros", sub: "Modulos de max 100 aves por ubicacion" });
  Router.register("aves",         Views.Aves,           { title: "Aves", sub: "Inventario individual hembras y machos" });
  Router.register("postura",     Views.Postura,        { title: "Postura diaria", sub: "Registro de huevos por dia" });
  Router.register("incubadora",   Views.Incubadora,    { title: "Incubadora", sub: "Nidadas de 20-40 huevos" });
  Router.register("ventas",       Views.Ventas,        { title: "Ventas", sub: "Transacciones, descuento automatico de inventario" });
  Router.register("finanzas",     Views.Finanzas,      { title: "Finanzas", sub: "Flujo de caja, ingresos y gastos" });
  Router.register("inventario",   Views.Inventario,    { title: "Inventario", sub: "Stock de comida y productos" });
  Router.register("ia",           Views.IA,            { title: "IA AsiBrain", sub: "Inteligencia que vigila tu sistema" });
  Router.register("prediccion",   Views.Prediccion,    { title: "Prediccion", sub: "Pronostico de produccion a futuro" });
  Router.register("ajustes",      Views.Ajustes,       { title: "Ajustes", sub: "Configuracion de la granja" });

  Router.init();
  Toast.info("AsiBrain activo — listo para registrar tu granja 🐔");

  // Exponer singletons en window para acceso dev/debug y console
  Object.assign(window, {
    Storage, State, UI, Modal, Toast, Router, Format, H, Chart, Seed,
    GallineroService, AvesService, IncubadoraService, VentasService,
    FinanzasService, IA, Views
  });
})();
