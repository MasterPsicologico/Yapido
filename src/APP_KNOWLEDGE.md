# YAPIDO APP - CONOCIMIENTO DEL SISTEMA (APK & WEB)

Este archivo sirve como referencia rápida para la inteligencia artificial sobre la estructura, capacidades y estado actual de la aplicación Yapido.

## 🏗️ Estructura de la Aplicación

La aplicación es un **PWA (Progressive Web App)** construida con:
- **Frontend**: Next.js (App Router), React 18, Tailwind CSS.
- **Backend/Base de Datos**: Firebase Firestore (NoSQL).
- **Autenticación**: Firebase Auth (Google & Email/Password).
- **Mensajería**: Firebase Cloud Messaging (FCM) + Notificaciones Locales.
- **Estado**: Basado en Hooks (useProfile, useCart) y Eventos Personalizados (`CustomEvent`).

## 📱 Capacidades de la APK (Contexto Móvil)

Aunque es una aplicación web, se distribuye como APK mediante un Wrapper (TWA/WebView):
- **Notificaciones**: Utiliza FCM. Actualmente se están refinando las alertas directas en la app.
- **Interacción**: Diseñada con estética "Cyber-Luxe" (Gradients, Glassmorphism, Animaciones fluidas).
- **Permisos**: Requiere acceso a internet y, próximamente, gestión de alertas del sistema para mayor control.

## ✅ Funcionalidades Implementadas

1.  **Dashboard Multi-Rol**:
    - `Customer`: Home, Alquiler de Lavadoras, Carrito, Perfil.
    - `Admin/Owner`: Gestión de Pedidos, Inventario, Panel de Agentes AI.
    - `Repartidor`: Panel de Ruta, Estado de Entregas, Chat de Flota.
2.  **Centro de Mensajería**:
    - Chat en tiempo real vinculado a pedidos.
    - Notificaciones visuales (Badges) con diseño de "Squircle" (rounded-[5px]).
    - Acceso rápido desde el Navbar con redirección inteligente.
3.  **Flujo de Alquiler**:
    - Sistema de solicitud de lavadoras con selección de horas y cálculo de precio dinámico.
    - Notificación automática a la flota de reparto.
4.  **Gestión de Flota**:
    - Panel de verificación de personal (Admin).
    - Códigos de vinculación para nuevos conductores.
5.  **Gestión Geográfica y Operativa**:
    - Configuración dinámica de precios y parámetros (horas mínimas, recargos por escalera) por Ciudad y por Zonas (Barrios).
    - Selector dinámico de zonas integrado en el flujo de solicitud de alquiler, con persistencia en el perfil de usuario y metadatos de órdenes.
    - Panel de Administración para gestión granular (ciudades y zonas).

## 🚀 Lo que le falta / Mejoras Pendientes

- [ ] **Alertas de Sistema en APK**: Implementar lógica para que la app maneje alertas a nivel de sistema operativo (fuera de las básicas de la app).
- [ ] **Sincronización Total de Notificaciones**: Asegurar que los contadores se limpien globalmente al leer mensajes.
- [ ] **Refinamiento de UX en Móvil**: Continuar ajustando tamaños de letra para evitar desbordamientos en pantallas pequeñas.
- [ ] **Pruebas de Notificaciones Push**: Verificar la recepción de tokens en dispositivos reales (Android).
- [ ] **Población de Zonas Geográficas**: Llenar la base de datos a través del panel de admin con la información real de los sectores de operaciones (ej. Aranjuez, Manrique en Medellín).
- [ ] **Geofencing Automático**: Futura validación de dirección ingresada versus zona seleccionada mediante coordenadas.

## 💡 Ideas Innovadoras

1.  **Asistente AI de Soporte**: Integrar un agente de AI que responda dudas frecuentes de los clientes directamente en el chat de pedidos.
2.  **Mapa de Flota en Tiempo Real**: Visualización en vivo de los repartidores para los administradores y clientes.
3.  **Gamificación para Repartidores**: Sistema de puntos o insignias por entregas exitosas y velocidad.
4.  **Recomendaciones Inteligentes**: IA que sugiera productos o servicios basados en el historial de alquiler del usuario.
5.  **Control de Calidad IoT**: (Futuro) Sensores en las lavadoras para reportar estado de funcionamiento automáticamente.

---
*Ultima actualización: 28 de Abril, 2026*
