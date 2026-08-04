/**
 * notificaciones.js
 * Sistema de notificaciones que abarca los 3 actores:
 * - Cliente: estado del pedido, llegada del repartidor (vibración + sonido, despachable manualmente)
 * - Repartidor: nuevo pedido, timeout de aceptación
 * - Dueño: nuevo pedido, pedidos completados, ganancias
 *
 * Las notificaciones "urgentes" (llegada del repartidor) solo se descartan tocando el botón manualmente.
 */

const Notificaciones = (function () {
  const _listeners = [];

  let _vibrationEnabled = true;
  let _soundEnabled = true;

  // Las notificaciones "persistentes" no se cierran solas
  let _persistentBanners = []; // { id, tipo, mensaje, timestamp }

  /**
   * Suscripción a nuevas notificaciones.
   */
  function on(cb) {
    _listeners.push(cb);
    return () => {
      const i = _listeners.indexOf(cb);
      if (i !== -1) _listeners.splice(i, 1);
    };
  }

  function _emit(notif) {
    const final = { ...notif, id: Date.now() + Math.random(), timestamp: Date.now() };
    _listeners.forEach(cb => cb(final));

    // Si es persistente, aguardalo hasta que el usuario lo descarte
    if (notif.persistente) {
      _persistentBanners.push(final);
      _listeners.forEach(cb => cb({ ...final, tipo: "persistent_update", lista: _persistentBanners }));
    }

    // Animaciones físicas: vibración + sonido
    if (_vibrationEnabled && navigator.vibrate) {
      const patron = notif.patron || [200, 100, 200];
      navigator.vibrate(patron);
    }
    if (_soundEnabled && typeof _playSound === "function") {
      _playSound(notif.sound || "default");
    }

    // También muestra una notificación web si tiene permiso
    if (typeof Notification !== "undefined") {
      if (Notification.permission === "granted") {
        try {
          new Notification("LavaGo", { body: notif.mensaje, icon: notif.icon });
        } catch {}
      }
    }

    return final;
  }

  /**
   * Reproduce un sonido sintetizado (sin archivos externos).
   */
  function _playSound(type) {
    try {
      if (!window.AudioContext && !window.webkitAudioContext) return;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "llegada") {
        // Sonido agudo repetido para llegada
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
        // Repite
        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          osc2.frequency.value = 1200;
          osc2.connect(gain);
          osc2.start();
          osc2.stop(ctx.currentTime + 0.7);
        }, 300);
      } else if (type === "nuevo_pedido") {
        osc.type = "sine";
        osc.frequency.value = 660;
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      } else {
        osc.frequency.value = 528;
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) { /* ignore */ }
  }

  // === Tipos de notificaciones específicas ===

  function pedidoAsignadoCliente(pedido) {
    _emit({
      tipo: "pedido_asignado_cliente",
      mensaje: "¡Tu pedido ha sido asignado a una tienda! Te confirmaremos la entrega en breve.",
      rol: APP_CONFIG.roles.CLIENTE,
      pedidoId: pedido.id,
      icon: "📦",
      sound: "default",
      patron: [100, 50, 100]
    });
  }

  function nuevoPedidoTienda(pedido, tienda) {
    _emit({
      tipo: "nuevo_pedido_tienda",
      mensaje: "Nuevo pedido disponible en " + pedido.ciudad + ". Acepta antes de 5 minutos.",
      rol: APP_CONFIG.roles.DUENO_TIENDA,
      tiendaId: tienda.id,
      pedidoId: pedido.id,
      icon: "🔔",
      sound: "nuevo_pedido",
      patron: [300, 100, 300, 100, 300]
    });
  }

  function nuevoPedidoRepartidor(pedido, tienda) {
    _emit({
      tipo: "nuevo_pedido_repartidor",
      mensaje: "¡Nueva entrega! Lleva la lavadora a " + (pedido.direccion || "ubicación del cliente"),
      rol: APP_CONFIG.roles.REPARTIDOR,
      tiendaId: tienda.id,
      pedidoId: pedido.id,
      icon: "🚚",
      sound: "nuevo_pedido",
      patron: [300, 100, 300]
    });
  }

  function pedidoConfirmadoCliente(pedido) {
    _emit({
      tipo: "pedido_confirmado_cliente",
      mensaje: "✅ ¡El repartidor confirmó! Tu lavadora va en camino.",
      rol: APP_CONFIG.roles.CLIENTE,
      pedidoId: pedido.id,
      icon: "✅"
    });
  }

  function repartidorEnCaminoCliente(pedido) {
    _emit({
      tipo: "repartidor_en_camino",
      mensaje: "🚚 Tu lavadora está en camino. El repartidor se acerca a tu ubicación.",
      rol: APP_CONFIG.roles.CLIENTE,
      pedidoId: pedido.id,
      icon: "🚚"
    });
  }

  function repartidorLlegoCliente(pedido) {
    // Esta es la que vibra y suena hasta que el usuario presione el botón
    _emit({
      tipo: "repartidor_llegada",
      mensaje: "🔔 ¡Tu lavadora ha llegado! Sal a recibirla.",
      rol: APP_CONFIG.roles.CLIENTE,
      pedidoId: pedido.id,
      icon: "🔔",
      sound: "llegada",
      patron: [500, 200, 500, 200, 500, 200, 500, 200, 500],
      persistente: true
    });
  }

  function pedidoTimeoutTienda(pedido) {
    _emit({
      tipo: "pedido_timeout_tienda",
      mensaje: "El pedido #" + pedido.id.slice(-6).toUpperCase() + " pasó a la siguiente tienda por no aceptación.",
      rol: APP_CONFIG.roles.DUENO_TIENDA,
      pedidoId: pedido.id,
      icon: "⏰"
    });
  }

  function pedidoCompletadoTienda(pedido) {
    _emit({
      tipo: "pedido_completado_tienda",
      mensaje: "Servicio completado. Ganancia: $" + (pedido.precioFinal || 0).toLocaleString(),
      rol: APP_CONFIG.roles.DUENO_TIENDA,
      pedidoId: pedido.id,
      icon: "💰"
    });
  }

  function pedidoCompletadoRepartidor(pedido, ganancia) {
    _emit({
      tipo: "pedido_completado_repartidor",
      mensaje: "✅ Servicio completado. Tu ganancia: $" + ganancia.toLocaleString(),
      rol: APP_CONFIG.roles.REPARTIDOR,
      pedidoId: pedido.id,
      icon: "💰"
    });
  }

  function pagoExitoso(pedido) {
    _emit({
      tipo: "pago_exitoso",
      mensaje: "Pago de $" + (pedido.precioFinal || 0).toLocaleString() + " confirmado por Nequi.",
      rol: APP_CONFIG.roles.CLIENTE,
      pedidoId: pedido.id,
      icon: "💸"
    });
  }

  function simple(mensaje, tipo = "info", icon = "ℹ️") {
    _emit({ tipo, mensaje, icon });
  }

  /**
   * Descarta un banner persistente (sólo con acción manual del usuario).
   */
  function descartarPersistente(id) {
    _persistentBanners = _persistentBanners.filter(b => b.id !== id);
    _listeners.forEach(cb => cb({ tipo: "persistent_update", lista: _persistentBanners, descartado: id }));
  }

  function getPersistentes() {
    return _persistentBanners;
  }

  function pedirPermisoNotificaciones() {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }

  function setVibration(enabled) { _vibrationEnabled = enabled; }
  function setSound(enabled) { _soundEnabled = enabled; }

  return {
    on,
    pedidoAsignadoCliente,
    nuevoPedidoTienda,
    nuevoPedidoRepartidor,
    pedidoConfirmadoCliente,
    repartidorEnCaminoCliente,
    repartidorLlegoCliente,
    pedidoTimeoutTienda,
    pedidoCompletadoTienda,
    pedidoCompletadoRepartidor,
    pagoExitoso,
    simple,
    descartarPersistente,
    getPersistentes,
    pedirPermisoNotificaciones,
    setVibration,
    setSound
  };
})();

window.Notificaciones = Notificaciones;
