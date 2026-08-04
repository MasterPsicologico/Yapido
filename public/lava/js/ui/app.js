/**
 * app.js
 * Coordinator principal de la aplicacion LavaGo.
 *  - Inicializa router de pedidos y banners de notificaciones
 *  - Suscribe a cambios de autenticacion para enrutar la vista correcta
 *  - Implementa navegacion entre vistas (cliente, dueno, repartidor, admin, perfil)
 *  - Maneja el header con logo y botones de accion segun el rol
 */

const App = (function () {

  let currentRole = null;

  async function init() {
    // Inicializa el router de pedidos (notifica a cada actor segun eventos)
    PedidoRouter.init();
    NotifBanners.render();
    Notificaciones.pedirPermisoNotificaciones();

    // Suscripcion a cambios de sesion
    Auth.onChanged(async (user) => { await _navigateByAuth(user); });

    // Si ya hay sesion, navega de inmediato
    const user = Auth.currentUser();
    await _navigateByAuth(user);
  }

  async function _navigateByAuth(user) {
    _renderHeader(user);
    if (!user) {
      AuthView.render();
      return;
    }
    // Por rol principal - perfil por defecto y boton claro a otros roles
    currentRole = user.role || APP_CONFIG.roles.CLIENTE;
    switch (currentRole) {
      case APP_CONFIG.roles.REPARTIDOR:
        await RepartidorView.render();
        break;
      case APP_CONFIG.roles.DUENO_TIENDA:
        await DuenoView.render();
        break;
      case APP_CONFIG.roles.ADMIN_PRINCIPAL:
        await AdminView.render();
        break;
      default:
        await ClienteView.render();
    }
  }

  function _renderHeader(user) {
    let header = document.getElementById("app-header");
    if (!header) {
      header = document.createElement("header");
      header.id = "app-header";
      document.body.insertBefore(header, document.body.firstChild);
    }
    header.innerHTML = "";

    const logo = document.createElement("div");
    logo.className = "logo";
    logo.innerHTML = "LavaGo";
    logo.onclick = async () => { if (user) await ClienteView.render(); };
    header.appendChild(logo);

    if (user) {
      const nav = document.createElement("nav");
      nav.className = "main-nav";

      const btnCliente = document.createElement("button");
      btnCliente.className = "nav-btn";
      btnCliente.textContent = "Inicio";
      btnCliente.onclick = async () => await ClienteView.render();
      nav.appendChild(btnCliente);

      // Boton al panel de admin (dueno, repartidor o admin principal)
      if (user.role === APP_CONFIG.roles.REPARTIDOR) {
        const btn = document.createElement("button");
        btn.className = "nav-btn";
        btn.textContent = "Mi panel repartidor";
        btn.onclick = async () => await RepartidorView.render();
        nav.appendChild(btn);
      } else if (user.role === APP_CONFIG.roles.DUENO_TIENDA) {
        const btn = document.createElement("button");
        btn.className = "nav-btn";
        btn.textContent = "Mi tienda";
        btn.onclick = async () => await DuenoView.render();
        nav.appendChild(btn);
      }
      if (user.isAdmin) {
        const btn = document.createElement("button");
        btn.className = "nav-btn nav-admin";
        btn.textContent = "Admin principal";
        btn.onclick = async () => await AdminView.render();
        nav.appendChild(btn);
      }

      header.appendChild(nav);

      const perfilBtn = document.createElement("button");
      perfilBtn.className = "nav-btn perfil-btn";
      perfilBtn.textContent = (user.displayName || "Perfil").slice(0, 16);
      perfilBtn.onclick = async () => await PerfilView.render();
      header.appendChild(perfilBtn);
    }
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => { App.init(); });
