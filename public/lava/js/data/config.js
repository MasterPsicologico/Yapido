/**
 * config.js
 * Configuración central de la aplicación LavaGo.
 */

const APP_CONFIG = {
  // Firebase (placeholder - reemplazar con credenciales reales)
  firebase: {
    apiKey: "AIzaSy placeholder",
    authDomain: "lava-go-colombia.firebaseapp.com",
    projectId: "lava-go-colombia",
    storageBucket: "lava-go-colombia.appspot.com",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:0000000000000000000000"
  },

  // Nequi
  nequi: {
    // Nequi usa pago por QR / link de pago
    // El número de Nequi del negocio
    nequiNumero: "3000000000",
    // API de producción Nequi (placeholder)
    apiKey: "",
    // El modo sandbox permite pruebas
    sandbox: true,
    // URL para generar link de pago Nequi
   _pagoUrl: "https://osp.nequi.com/payments/v1/services"
  },

  // Reglas de negocio
  reglas: {
    // Tiempo máximo de espera para que una tienda acepte un pedido (5 min)
    tiempoEsperaAceptacion: 5 * 60 * 1000, // ms
    // Tiempo de tolerancia para la confirmación manual de envío (15 min)
    tiempoConfirmacionEnvio: 15 * 60 * 1000, // ms
    // Distancia para notificar llegada del repartidor al usuario (metros)
    distanciaNotificacionLlegada: 200,
    // Porcentaje por defecto del repartidor
    porcentajeRepartidorDefecto: 30,
    // Precio base de alquiler por hora (COP)
    precioHoraBase: 10000,
    // Precio mínimo del servicio
    precioMinimo: 30000
  },

  // Roles de usuario
  roles: {
    CLIENTE: "cliente",
    REPARTIDOR: "repartidor",
    DUENO_TIENDA: "dueno_tienda",
    ADMIN_PRINCIPAL: "admin_principal"
  },

  // Estado de pedidos
  estadoPedido: {
    PENDIENTE: "pendiente",
    ASIGNADO: "asignado",
    ACEPTADO: "aceptado",
    CONFIRMADO: "confirmado",
    EN_CAMINO: "en_camino",
    LLEGADA: "llegada",
    ENTREGADO: "entregado",
    COMPLETADO: "completado",
    CANCELADO: "cancelado"
  },

  // Estado de tiendas/prioridad
  estadoTienda: {
    ACTIVA: "activa",
    INACTIVA: "inactiva",
    PAUSADA: "pausada"
  },

  // Modo autoaceptación
  autoAceptacion: {
    ACTIVADA: true,
    DESACTIVADA: false
  },

  // Tipos de autenticación soportados
  authProviders: {
    GOOGLE: "google",
    TELEFONO: "telefono",
    ANONIMO: "anonimo"
  },

  // App name
  appName: "LavaGo",
  version: "1.0.0"
};

window.APP_CONFIG = APP_CONFIG;
