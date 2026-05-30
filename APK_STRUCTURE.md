# 📱 Estructura y Capacidades de la APK (Yapido)

Este documento sirve como fuente de verdad sobre el estado actual de la aplicación móvil (APK), sus capacidades integradas y la hoja de ruta para mejoras e innovación.

## 🏗️ Arquitectura Técnica Actual
*   **Core**: Next.js 15 + React 19.
*   **Contenedor Nativo**: Capacitor 8.
*   **Backend & Auth**: Firebase (JS SDK + Plugins Nativos).
*   **Despliegue**: Vercel (Producción) + Build de Gradle para Android.

---

## ✅ Capacidades Implementadas (Lo que TIENE)

### 1. Autenticación Híbrida (Google Native)
*   **Funcionamiento**: Usa el plugin `@capacitor-firebase/authentication` para abrir el selector de cuentas oficial de Android.
*   **Puente JS**: El `idToken` nativo se pasa al SDK de Firebase Web para mantener la sesión sincronizada sin recargar la página ni usar popups de navegador externo.
*   **Seguridad**: Registrado con huella SHA-1 de desarrollo.

### 2. Notificaciones Push Nativas (FCM)
*   **Plugin**: `@capacitor/push-notifications`.
*   **Sincronización**: Al abrir la app, registra el dispositivo en Firebase Cloud Messaging y guarda el `fcmToken` automáticamente en el perfil del usuario en Firestore (`users/{uid}`).
*   **Alertas en Vivo**: Capacidad de mostrar Toasts cuando la app está abierta y notificaciones de sistema cuando está cerrada.

### 3. Puente de Datos (Capacitor Bridge)
*   Acceso a APIs nativas del dispositivo (Cámara, Geolocalización, Estado de Red) listo para ser invocado desde los componentes de React.

---

## 🛠️ Pendientes / Mejoras (Lo que FALTA)

### 1. Identidad Visual Nativa
*   [ ] **Icono de App**: Actualmente tiene el icono por defecto de Capacitor. Necesita un set de iconos profesionales (`res/mipmap`).
*   [ ] **Splash Screen**: Pantalla de carga animada al abrir la app para ocultar el tiempo de carga del WebView.

### 2. Experiencia de Usuario (UX)
*   [ ] **Deep Linking**: Que al hacer clic en un enlace de "pideya.click" en WhatsApp, se abra automáticamente la app y no el navegador.
*   [ ] **Biometría**: Implementar inicio de sesión con Huella Dactilar / FaceID una vez que el usuario ya se ha logueado una vez.

### 3. Rendimiento
*   [ ] **Offline Mode**: Cachear datos críticos (productos, tiendas favoritas) para que la app sea funcional sin internet.

---

## 💡 Ideas Innovadoras (Hoja de Ruta)

### 1. Seguimiento en Tiempo Real (Geofencing)
*   Implementar alertas basadas en la ubicación. Si el usuario pasa cerca de una tienda con oferta, el celular vibra con una notificación personalizada.

### 2. Comandos de Voz Nativos
*   Integrar con el asistente de Android para permitir acciones como "Hey Google, pide lo de siempre en Yapido".

### 3. Notificaciones Enriquecidas con IA
*   Usar agentes de IA para enviar notificaciones personalizadas (no spam), prediciendo cuándo el usuario necesita un producto basado en su historial.

### 4. Modo Kiosko / Conductor
*   Una interfaz optimizada dentro de la misma APK que detecte cuando el usuario es un repartidor y cambie todo el layout a "Modo Mapa" con una sola mano.

---

> **Última actualización**: 26 de Abril, 2026
> **Estado de la APK**: Estable con Login y Notificaciones funcionales.
