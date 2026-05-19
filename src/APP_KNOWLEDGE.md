# YAPIDO APP - CONOCIMIENTO DEL SISTEMA (APK & WEB)

Este archivo sirve como referencia rápida para la inteligencia artificial sobre la estructura, capacidades y estado actual de la aplicación Yapido.

## 🧠 Protocolo de Memoria Evolutiva Continua (MANDATORIO)
**REGLA CERO SIN EXCEPCIONES**:
1. **Consulta Inicial**: Ante cualquier tarea, la IA DEBE consultar este archivo y los otros 4 archivos evolutivos (`blueprint.md`, `responsive-design-spec.md`, `EvolutionaryReport.tsx`, `MissionTechSpecs.tsx`) si requiere contexto.
2. **Actualización Automática**: Si la IA busca una regla, lógica o diseño y **NO la encuentra** en estos 5 archivos, o si la IA **implementa algo nuevo**, DEBE actualizar estos archivos automáticamente antes de dar la tarea por terminada.
3. **Sincronización Total**: Ningún cambio arquitectónico, visual o de negocio debe existir en el código sin estar reflejado en esta memoria evolutiva.
## 🏗️ Estructura de la Aplicación

La aplicación es un **PWA (Progressive Web App)** construida con:
- **Frontend**: Next.js (App Router + Turbopack), React 19, Tailwind CSS 3.4.
- **Backend/Base de Datos**: Firebase Firestore (NoSQL).
- **Autenticación**: Firebase Auth (Google & Email/Password).
- **Mensajería**: Firebase Cloud Messaging (FCM) + Notificaciones Locales.
- **Estado**: Basado en Hooks (useProfile, useCart) y Eventos Personalizados (`CustomEvent`).
- **AI**: Google Genkit + Gemini 1.28 (20 agentes especializados).

## 📱 Capacidades de la APK (Contexto Móvil)

Aunque es una aplicación web, se distribuye como APK mediante un Wrapper (TWA/WebView):
- **Notificaciones**: Utiliza FCM con listeners nativos y visuales.
- **Interacción**: Diseñada con estética "Cyber-Luxe" (Gradients, Glassmorphism, Animaciones fluidas).
- **Permisos**: Requiere acceso a internet y gestión de alertas del sistema.
- **Deploy**: Configurada para Vercel (web) y build nativo Android con Capacitor 8.3.

## ✅ Funcionalidades Implementadas (MAYO 2026)

1.  **Dashboard Multi-Rol**:
    - `Cliente`: Home, Catálogo, Alquiler de Lavadoras, Carrito, Perfil.
    - `Admin/Owner`: Gestión de Pedidos, Inventario, Panel de Agentes AI, Gestión de Flota, Geografía.
    - `Repartidor`: Panel de Ruta, Estado de Entregas, Chat de Flota, Economía.
2.  **Centro de Mensajería**:
    - Chat en tiempo real vinculado a pedidos.
    - Notificaciones visuales (Badges) con diseño de "Squircle" (rounded-[5px]).
    - Acceso rápido desde el Navbar con redirección inteligente.
3.  **Flujo de Alquiler**:
    - Sistema de solicitud de lavadoras con selección de horas y cálculo de precio dinámico.
    - Notificación automática a la flota de reparto.
    - Auto-save del perfil mientras el usuario escribe.
4.  **Gestión de Flota** (MAY-2026):
    - Panel de verificación de personal (Admin).
    - Códigos de vinculación para nuevos conductores.
    - Mapa en tiempo real de todos los drivers (FleetMap).
    - Métricas individualizadas por conductor (DriverMetricsSheet).
    - Reportes evolutivos con exportación (EvolutionaryReport).
    - Panel de economía por conductor y tienda.
5.  **Gestión Geográfica y Operativa** (MAY-2026):
    - Editor de ciudades integrado en panel admin.
    - Editor de zonas por ciudad.
    - Selector dinámico de zonas en flujo de alquiler.
    - Persistencia en Firestore.
    - Hook `useCityConfig` para acceder a configuraciones por ciudad.
6.  **Sistema de Rating** (MAY-2026):
    - Rating automático al completar misión.
    - Actualización de promedio en tiempo real.
    - Visualización de estrellas en pedidos.
7.  **Panel de Logística** (MAY-2026):
    - Timeline horizontal de pedidos.
    - Clasificación de pedidos por tipo.
    - Estadísticas en vivo.
    - Feed de pedidos con filtros.
8.  **UI Improvements** (MAY-2026):
    - AestheticWrapper para wrapper visual avanzado.
    - StoreCard redesign completo.
    - Menú administrativo sutil (no intrusivo).

## 🔒 Correcciones de Seguridad Implementadas (MAYO 2026)

- [x] **Firestore Rules**: Reglas seguras con validación de usuarios y roles.
- [x] **Superadmin desde Firestore**: Los UIDs de superadmin se leen de `appConfig/superAdmins`, no hardcodeados.
- [x] **API Keys ocultas**: Variables de entorno en `.env.local` (ignorado por git), `.env.example` como plantilla.
- [x] **PaymentGateway**: Sistema de pagos stub integrable con MercadoPago, PayU, Nequi, Stripe.
- [x] **Validación GPS**: Validación de coordenadas, velocidad, y timestamp en `use-driver-location.ts`.
- [x] **Storage Rules**: Habilitado con validaciones de tipo de archivo y tamaño.
- [x] **Middleware de Seguridad**: Headers de seguridad (X-Frame-Options, X-Content-Type-Options, etc.).
- [x] **Endpoints Debug Protegidos**: Validación mediante token de Firebase o secret key.

## 🚀 Lo que le falta / Mejoras Pendientes

- [ ] **Integrar pasarela de pago real**: Configurar `PAYMENT_GATEWAY_ENABLED=true` y credenciales en `.env.local`
- [ ] **Geofencing Automático**: Validación de dirección ingresada versus zona seleccionada mediante coordenadas.
- [ ] **Sincronización Total de Notificaciones**: Asegurar que los contadores se limpien globalmente al leer mensajes.
- [ ] **Refinamiento de UX en Móvil**: Continuar ajustando tamaños de letra para evitar desbordamientos.
- [ ] **Pruebas de Notificaciones Push**: Verificar la recepción de tokens en dispositivos reales.
- [ ] **Población de Zonas Geográficas**: Llenar la base de datos con sectores reales (Aranjuez, Manrique en Medellín).

## ⚠️ Requisitos para Producción

Para hacer deploy a producción, necesitas:

1. **Completar `.env.local`**:
   - Agrega tu `FIREBASE_PRIVATE_KEY` (del JSON de credenciales)
   - Las otras variables ya están configuradas

2. **Configurar Superadmin**:
   ```bash
   # Obtén tu UID de Firebase Auth (inicia sesión y revisa Firestore > users)
   npx tsx scripts/setup-superadmin.ts TU_UID_AQUI
   ```

3. **Opcional - Habilitar pagos reales**:
   - Configurar `PAYMENT_GATEWAY_ENABLED=true` cuando tengas credenciales de pasarela
   - Configurar `DEBUG_SECRET` y `CRON_SECRET` con valores aleatorios seguros

## 💡 Ideas Innovadoras

1.  **Asistente AI de Soporte**: Integrar un agente de AI que responda dudas frecuentes de los clientes directamente en el chat.
2.  **Gamificación para Repartidores**: Sistema de puntos o insignias por entregas exitosas y velocidad.
3.  **Recomendaciones Inteligentes**: IA que sugiera productos o servicios basados en el historial de alquiler del usuario.
4.  **Control de Calidad IoT**: (Futuro) Sensores en las lavadoras para reportar estado de funcionamiento automáticamente.

---
*Ultima actualización: 3 de Mayo, 2026*
