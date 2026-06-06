# YAPIDO APP - CONOCIMIENTO DEL SISTEMA (APK & WEB)

Este archivo sirve como referencia rápida para la inteligencia artificial sobre la estructura, capacidades y estado actual de la aplicación Yapido.

> **NOTA:** Este monorepo contiene **5 aplicaciones**. Consulta [AGENTS.md](../AGENTS.md) para el mapa completo del ecosistema.

## 🧠 Protocolo de Memoria Evolutiva Continua (MANDATORIO)
**REGLA CERO SIN EXCEPCIONES**:
1. **Consulta Inicial**: Ante cualquier tarea, la IA DEBE consultar este archivo y los otros archivos evolutivos (`docs/blueprint.md`, `docs/responsive-design-spec.md`, `docs/backend.json`, `EvolutionaryReport.tsx`, `MissionTechSpecs.tsx`) si requiere contexto.
2. **Actualización Automática**: Si la IA busca una regla, lógica o diseño y **NO la encuentra** en estos archivos, o si la IA **implementa algo nuevo**, DEBE actualizar estos archivos automáticamente antes de dar la tarea por terminada.
3. **Sincronización Total**: Ningún cambio arquitectónico, visual o de negocio debe existir en el código sin estar reflejado en esta memoria evolutiva.

## 🏗️ Estructura de la Aplicación

La aplicación es un **PWA (Progressive Web App)** construida con:
- **Frontend**: Next.js 15.5.9 (App Router + Turbopack), React 19.2, Tailwind CSS 3.4.
- **Backend/Base de Datos**: Firebase Firestore (NoSQL) + Realtime Database.
- **Autenticación**: Firebase Auth (Google & Email/Password).
- **Mensajería**: Firebase Cloud Messaging (FCM) + Notificaciones Locales.
- **Estado**: Basado en Hooks (`useProfile`, `useCart`, `useCityConfig`, `useFleetLiveLocations`, `useDriverLocation`) y Eventos Personalizados (`CustomEvent`).
- **AI**: Google Genkit 1.28 + Gemini (20 agentes especializados en `src/ai/agents/`).
- **Nativo**: Capacitor 8.3 (Android APK).

## 📱 Capacidades de la APK (Contexto Móvil)

Aunque es una aplicación web, se distribuye como APK mediante un Wrapper (TWA/WebView):
- **Notificaciones**: FCM con listeners nativos y visuales.
- **Auth**: Plugin `@capacitor-firebase/authentication` con selector de cuentas nativo de Android.
- **Interacción**: Diseñada con estética "Cyber-Luxe" (Gradients, Glassmorphism, Animaciones fluidas).
- **Permisos**: Internet, GPS, notificaciones, vibración (haptics), red.
- **Deploy**: Vercel (web) + build nativo Android con Capacitor 8.3.
- **APK**: `Yapido_Universal.apk` (raíz de `public/lavadoras/`).

## ✅ Funcionalidades Implementadas

### 1. Dashboard Multi-Rol
- **Cliente:** Home, Catálogo, Alquiler de Lavadoras, Carrito, Perfil, Chat.
- **Admin/Owner:** Gestión de Pedidos, Inventario, Panel de Agentes AI, Gestión de Flota, Geografía, Plan de Negocio.
- **Repartidor:** Panel de Ruta, Estado de Entregas, Chat de Flota, Economía, Aprobación, Reciclaje.

### 2. E-commerce Multi-Tienda
- Catálogo de tiendas (`/stores`) y productos (`/products/[id]`).
- Categorías (`/categories/[id]`) con sub-categorías.
- Carrito persistente y checkout (`/checkout`).
- Búsqueda y filtros.

### 3. Centro de Mensajería
- Chat en tiempo real vinculado a pedidos.
- Notificaciones visuales (Badges) con diseño "Squircle" (rounded-[5px]).
- Acceso rápido desde el Navbar con redirección inteligente.

### 4. Alquiler de Lavadoras (`/washer`)
- Waiting-room con lista de espera (`/washer/waiting-room/[id]`).
- Selección de tipo y horas con cálculo de precio dinámico.
- Notificación automática a la flota de reparto.
- Auto-save del perfil mientras el usuario escribe.
- Panel admin dedicado (`/admin/washer` + `/admin/washer/[id]`).

### 5. Delivery Multi-Etapa
- Estados: `preparando → listo → en tienda → con driver → en destino → entregado`.
- Dashboard del driver (`/delivery/dashboard`).
- Flujo de aprobación (`/delivery/approved`), registro (`/delivery/register`), reciclaje (`/delivery/recycled`) y release (`/delivery/release-success`).
- Pickup mission view dedicada con notificaciones context-aware.
- Wizard secuencial de solicitud con step indicator de Framer Motion.

### 6. Gestión de Flota
- Panel de verificación de personal (Admin).
- Códigos de vinculación para nuevos conductores.
- Mapa en tiempo real de todos los drivers (FleetMap, `useFleetLiveLocations`).
- Métricas individualizadas por conductor (DriverMetricsSheet).
- Reportes evolutivos con exportación (EvolutionaryReport).
- Panel de economía por conductor y tienda.

### 7. Gestión Geográfica
- Editor de ciudades integrado en panel admin (`/admin/geography`).
- Editor de zonas por ciudad con componentes en `admin/geography/components/`.
- Selector dinámico de zonas en flujo de alquiler.
- Persistencia en Firestore.
- Hook `useCityConfig` para acceder a configuraciones por ciudad.

### 8. Sistema de Rating
- Rating automático al completar misión (`useAutoRating`).
- Actualización de promedio en tiempo real.
- Visualización de estrellas en pedidos.

### 9. Panel de Logística
- Timeline horizontal de pedidos.
- Clasificación de pedidos por tipo.
- Estadísticas en vivo.
- Feed de pedidos con filtros.

### 10. UI Improvements
- AestheticWrapper para wrapper visual avanzado.
- StoreCard redesign completo (luxury cinematic con hero image overlay, status pills, premium CTAs).
- Menú administrativo sutil (no intrusivo).

### 11. 20 Agentes AI
- Genkit + Gemini en `src/ai/agents/`.
- Panel de administración dedicado (`/admin/agents` + `/admin/agents/[id]`).
- Agentes en `src/ai/agents/`: `category`, `chat`, `delivery`, `home`, `layout`, `notification`, `order`, `product`, `rating`, `security`, `store`, `ui`, `visual-design`.
- Flujos en `src/ai/flows/`.

## 🔒 Correcciones de Seguridad Implementadas

- [x] **Firestore Rules**: Reglas seguras con validación de usuarios y roles.
- [x] **Superadmin desde Firestore**: Los UIDs de superadmin se leen de `appConfig/superAdmins`, no hardcodeados.
- [x] **API Keys ocultas**: Variables de entorno en `.env.local` (ignorado por git), `.env.example` como plantilla.
- [x] **PaymentGateway**: Sistema de pagos stub integrable con MercadoPago, PayU, Nequi, Stripe.
- [x] **Validación GPS**: Validación de coordenadas, velocidad y timestamp en `use-driver-location.ts`.
- [x] **Storage Rules**: Habilitado con validaciones de tipo de archivo y tamaño.
- [x] **Middleware de Seguridad**: Headers de seguridad (X-Frame-Options, X-Content-Type-Options, X-Robots-Tag, Referrer-Policy).
- [x] **Endpoints Debug Protegidos**: Validación mediante token de Firebase o secret key.
- [x] **CineStream blindado**: `/p` y `/p/:path*` sirven con `noindex`, `X-Frame-Options: DENY`, `nosniff`, `no-referrer`.

## 🚀 Lo que le falta / Mejoras Pendientes

- [ ] **Integrar pasarela de pago real**: Configurar `PAYMENT_GATEWAY_ENABLED=true` y credenciales en `.env.local`.
- [ ] **Geofencing Automático**: Validación de dirección ingresada versus zona seleccionada mediante coordenadas.
- [ ] **Sincronización Total de Notificaciones**: Asegurar que los contadores se limpien globalmente al leer mensajes.
- [ ] **Refinamiento de UX en Móvil**: Continuar ajustando tamaños de letra para evitar desbordamientos.
- [ ] **Pruebas de Notificaciones Push**: Verificar la recepción de tokens en dispositivos reales.
- [ ] **Población de Zonas Geográficas**: Llenar la base de datos con sectores reales (Aranjuez, Manrique en Medellín).
- [ ] **Iconos/splash nativos en APK**: Reemplazar los placeholders de Capacitor (ver `APK_STRUCTURE.md`).
- [ ] **Tests E2E con Playwright**.

## ⚠️ Requisitos para Producción

Para hacer deploy a producción, necesitas:

1. **Completar `.env.local`**:
   - Agrega tu `FIREBASE_PRIVATE_KEY` (del JSON de credenciales).
   - Las otras variables ya están configuradas.

2. **Configurar Superadmin**:
   ```bash
   npx tsx scripts/setup-superadmin.ts TU_UID_AQUI
   ```

3. **Opcional - Habilitar pagos reales**:
   - `PAYMENT_GATEWAY_ENABLED=true` cuando tengas credenciales de pasarela.
   - `DEBUG_SECRET` y `CRON_SECRET` con valores aleatorios seguros.

## 🧠 Proyectos Hermanos en el Monorepo

Este proyecto (Yapido) convive con otras **4 aplicaciones** en el mismo repositorio:

1. **Finanzas Inteligentes** (`/finanzas`) — Gestión financiera personal con IA (Genkit + Gemini).
2. **NimbusChat** (`/nimbus`) — Plataforma AI multi-herramienta (chat, sueños, cómics, cursos, IA vs IA, fallback Groq).
3. **Yapido Movilidad / Conductor** (`/conductor`) — App de ride-sharing (moto/auto) en Aguachica, CO. Proyecto Firebase independiente `yapido-movilidad`. **Tiene su propia `MEMORY.md` (≥1044 líneas) — leer antes de tocar.**
4. **CineStream** (`/p`) — Streaming de películas (vanilla JS + Firebase).

**Integración:** Multi-zone routing via Next.js rewrites (dev) y Vercel rewrites (prod) para finanzas y nimbus. Conductor corre independiente. CineStream se sirve estático desde Yapido.
**Middleware:** Excluye `/finanzas` y `/nimbus` del procesamiento de seguridad.

## 💡 Ideas Innovadoras

1. **Asistente AI de Soporte**: Integrar un agente de AI que responda dudas frecuentes de los clientes directamente en el chat.
2. **Gamificación para Repartidores**: Sistema de puntos o insignias por entregas exitosas y velocidad.
3. **Recomendaciones Inteligentes**: IA que sugiera productos o servicios basados en el historial de alquiler del usuario.
4. **Control de Calidad IoT**: (Futuro) Sensores en las lavadoras para reportar estado de funcionamiento automáticamente.

---

*Última actualización: 5 de Junio, 2026*
