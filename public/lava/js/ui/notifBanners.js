/**
 * notifBanners.js
 * Capa UI para mostrar banners de notificacion persistentes:
 * - Banners que solo se descartan tocando un boton manualmente (ej. "llegada del repartidor")
 * - Libre para notificaciones normales: toast automatico
 */

const NotifBanners = (function () {

  let _bannerContainer = null;

  function _ensureContainer() {
    if (_bannerContainer) return _bannerContainer;
    _bannerContainer = document.createElement("div");
    _bannerContainer.id = "banners-container";
    _bannerContainer.className = "banners-container";
    document.body.appendChild(_bannerContainer);
    return _bannerContainer;
  }

  function render() {
    Notificaciones.on(evt => {
      if (evt.tipo === "persistent_update") {
        _renderLista(evt.lista || []);
      } else if (evt.persistente) {
        _renderBanner(evt);
      } else {
        // Toast comun ya lo gestiona UI.toast via Notificaciones.simple
        // Aqui no hacemos nada -- los toasts ya aparecen sin necesidad de mas logica
      }
    });
  }

  function _renderLista(lista) {
    const c = _ensureContainer();
    c.innerHTML = "";
    lista.forEach(b => _renderBanner(b));
  }

  function _renderBanner(b) {
    const c = _ensureContainer();
    // Evita duplicados
    if (c.querySelector("[data-id='" + b.id + "']")) return;
    const div = document.createElement("div");
    div.className = "notif-banner " + (b.tipo || "");
    div.dataset.id = b.id;
    div.innerHTML = `
      <div class="notif-icon">${b.icon || ""}</div>
      <div class="notif-msg">${b.mensaje || ""}</div>
      <button class="notif-dismiss">Entendido</button>
    `;
    div.querySelector(".notif-dismiss").onclick = () => {
      Notificaciones.descartarPersistente(b.id);
      div.remove();
    };
    c.appendChild(div);
    // Animacion: vibrar
    if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
  }

  return { render };
})();

window.NotifBanners = NotifBanners;
