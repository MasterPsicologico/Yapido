/**
 * gps.js
 * Utilidad para obtener la ubicación GPS del usuario.
 * Devuelve un punto { latitude, longitude } que se puede compartir
 * con el repartidor y el dueño de la tienda.
 */

const GPS = (function () {

  /**
   * Obtiene la posición actual del dispositivo usando la Geolocation API.
   * @returns {Promise<{latitude: number, longitude: number, accuracy: number}>}
   */
  function getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocalización no soportada por este dispositivo"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        }),
        err => {
          let msg;
          switch (err.code) {
            case 1: msg = "Permiso denegado. No se pudo acceder a tu ubicación."; break;
            case 2: msg = "Ubicación no disponible. Revisa tu GPS."; break;
            case 3: msg = "Tiempo agotado al obtener ubicación."; break;
            default: msg = err.message;
          }
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  /**
   * Inicia el seguimiento continuo de la posición (para repartidores).
   * @param {(pos) => void} callback se llama cada vez que hay una nueva posición
   * @param {string} id identificador del repartidor/pedido (para logging interno)
   * @returns {{ stop: () => void }}
   */
  function watchPosition(callback, id) {
    if (!navigator.geolocation) {
      console.warn("Geolocation no soportada");
      return { stop: () => {} };
    }
    const watchId = navigator.geolocation.watchPosition(
      pos => callback({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        speed: pos.coords.speed,
        heading: pos.coords.heading
      }),
      err => console.error("[GPS watch error]", id, err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    return {
      stop: () => navigator.geolocation.clearWatch(watchId),
      id: watchId
    };
  }

  /**
   * Distancia entre dos puntos (Haversine) en metros.
   * Útil para disparar la notificación de llegada cuando el repartidor está cerca.
   */
  function distancia(p1, p2) {
    const R = 6371000; // metros
    const dLat = (p2.latitude - p1.latitude) * Math.PI / 180;
    const dLng = (p2.longitude - p1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(p1.latitude * Math.PI / 180) * Math.cos(p2.latitude * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Comprueba si el repartidor está cerca del punto de entrega del cliente.
   * @param repartidorPosicion
   * @param clientePosicion
   * @returns {boolean}
   */
  function estaCercaDe(repartidorPosicion, clientePosicion) {
    return distancia(repartidorPosicion, clientePosicion) <= APP_CONFIG.reglas.distanciaNotificacionLlegada;
  }

  /**
   * Convierte un punto a Google Maps URL para abrir como dirección compartible.
   */
  function mapsUrl(punto) {
    return "https://www.google.com/maps?q=" + punto.latitude + "," + punto.longitude;
  }

  return { getCurrentPosition, watchPosition, distancia, estaCercaDe, mapsUrl };
})();

window.GPS = GPS;
