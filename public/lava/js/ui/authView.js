/**
 * authView.js
 * Pantalla de login — soporta Google, teléfono y anónimo.
 */

const AuthView = (function () {

  async function render() {
    Notificaciones.pedirPermisoNotificaciones();

    const card = UI.el("div.card.login-card", {}, []);
    card.appendChild(UI.el("h1.app-title", {}, ["🫧 LavaGo"]));
    card.appendChild(UI.el("p.subtitle", {}, ["Alquiler de lavadoras a domicilio en Colombia"]));
    card.appendChild(UI.el("p.tagline", {}, ["Inicia sesión para continuar"]));

    const btnGoogle = UI.el("button.btn.btn-google", { onclick: async () => {
      try {
        UI.toast("Conectando con Google...");
        await Auth.signInWithGoogle();
        UI.toast("Sesión iniciada");
      } catch (e) { UI.toast(e.message, "error"); }
    } }, ["Continuar con Google"]);

    const btnPhone = UI.el("button.btn.btn-phone", { onclick: async () => {
      const phone = prompt("Ingresa tu número de WhatsApp:\n(ej: 300 123 4567)");
      if (!phone) return;
      try {
        await Auth.signInWithPhone(phone);
      } catch (e) { UI.toast(e.message, "error"); }
    } }, ["Ingresar con WhatsApp / teléfono"]);

    const btnAnonimo = UI.el("button.btn.btn-anonimo", { onclick: async () => {
      try { await Auth.signInAnonymously(); } catch (e) { UI.toast(e.message, "error"); }
    } }, ["Continuar como invitado"]);

    card.appendChild(btnGoogle);
    card.appendChild(btnPhone);
    card.appendChild(btnAnonimo);

    UI.setVista(card, "login");
  }

  return { render };
})();

window.AuthView = AuthView;
