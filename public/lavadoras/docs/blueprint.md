# Lavadoras — Blueprint del Producto

> App standalone (Next.js 15 + React 19 + Capacitor 8 + Firebase + Genkit)
> especializada en **alquiler de lavadoras** con logística propia + IA.
> Producto paralelo y complementario a Yapido dentro del ecosistema Misty Mountain.

---

## Identidad

- **Nombre del producto:** Lavadoras
- **Subdominio producción:** `https://lavadoras.yapido.click`
- **APK Android:** `click.yapido.app` (`com.yapido.lavadoras` en Play Store path)
- **Brand:** Cyber-Luxe reutilizado del ecosistema (gradients, glassmorphism, framer-motion)
- **Idioma:** Español (es-CO) por defecto
- **Moneda:** COP (Peso Colombiano)
- **Modelo de negocio:** Alquiler por horas con logística entrega/recogida + flota de repartidores compartida con Yapido.
- **Diferenciador frente a `/washer` dentro de Yapido:** superficie operativa **standalone** optimizada para APK + offline + biometría, sin dependencias del catálogo multi-tienda.

---

## Roles del Sistema

| Rol | Capacidades |
|-----|-------------|
| **Cliente** | Reservar lavadora, elegir tipo/horas/dirección, pagar (Nequi/PSE), seguir mission, chatear con repartidor, calificar. |
| **Admin** | Inventario de lavadoras, flota, ciudades/zonas, plan de negocio, métricas, agentes IA. |
| **Repartidor** | Aceptar misiones washer_pickup/washer_delivery, navegar a pickup/dropoff, escanear QR de entrega, gestionar equipos. |

> **Auth unificada:** misma cuenta Firebase (`auth.yapido.click`) compartida con `yapido.click`, `finanzas.yapido.click`, `nimbus.yapido.click`. El usuario es el mismo en todo el ecosistema; el `role` se reutiliza.

---

## Core Features

### 1. Reserva de Lavadora (`/washer`)
- Catálogo de tipos: `standard`, `premium`, `industrial`.
- Selección de horas (mín. 4h, máx. 24h) → cálculo dinámico de precio (Genkit + agente `precios`).
- Selección de ciudad/zona → geofencing automático (agente `rutas`).
- Dirección con autocomplete Mapbox.
- Cálculo total + desglose (alquiler + logística + servicio).
- Estados: `waiting → assigned → in_transit → delivered → in_use → returned → cancelled`.
- Waiting Room (`/washer/waiting-room/[id]`): pantalla inmersiva mientras se asigna repartidor.

### 2. Inventario (`/admin/washer`)
- CRUD de lavadoras físicas (`washerInventoryId`).
- Estado por equipo: `available`, `in_transit`, `in_use`, `maintenance`, `lost`.
- Historial de uso por unidad.
- Reporte PDF con html2canvas/jspdf.

### 3. Flota Compartida (`/admin/fleet` + `/delivery`)
- Mismos `DriverProfile` y `FleetMission` que Yapido (compartidos en Firestore).
- Misiones específicas: `washer_pickup`, `washer_delivery`.
- Hook `useFleetLiveLocations` ya existente en el código actual.
- Vista mapa en tiempo real (`/admin/fleet`).
- Métricas por conductor: rating, misiones washer, ganancias, cancelaciones.

### 4. Geografía (`/admin/geography`)
- Editor de ciudades y zonas (`City`, `Zone`).
- Geofence (polígono operativo) y `serviceArea` por ciudad.
- Selector dinámico de zonas en flujo de reserva.
- Persistencia en Firestore (ya cubierto por `firestore.rules`).

### 5. Suite IA (Genkit + Gemini 2.5 Flash — 20 agentes)

Reparto de agentes relevantes para lavadoras:

| Agente | Función |
|--------|---------|
| `precios` | Calcula tarifa por horas + logística + servicio. |
| `rutas` | Asigna repartidor óptimo por geofence + carga actual. |
| `inventario` | Sugiere rotación/mantenimiento de lavadoras. |
| `asignador` | Matchea reserva → mission → driver. |
| `repartidor` | Asistente para el driver (ETA, instrucciones, cancelaciones). |
| `soporte` | Chat de atención al cliente sobre reservas. |
| `fraude` | Detecta reservas sospechosas, horarios imposibles, direcciones inválidas. |
| `notificaciones` | Decide push/email/sms según evento y estado. |
| `logistica` | Optimiza pick-up y drop-off agrupando missions. |
| `tiempo-real` | Tracking en vivo de mission + estimaciones dinámicas. |
| `prediccion` | Predice demanda por ciudad/hora. |
| `optimizacion` | Sugiere horarios de mantenimiento preventivo. |
| `cliente` | Recomienda lavadora según perfil/historial. |

Los 7 agentes restantes (`analytics`, `growth`, `legal`, `marketing`, `pagos`, `seguridad`, `supervisor`, `tienda`) mantienen contratos compartidos con el monorepo pero su UI específica de lavadoras vive en este proyecto.

> Ver `src/ai/agents/` (20 carpetas) y `src/ai/flows/` para la implementación.

### 6. Pagos
- Pasarela: Nequi (primario), PSE (secundario), PayU/Stripe (futuro).
- El provider activo se lee de `appConfig.paymentGateway.provider`.
- Flujo: crear `Payment` → status `pending` → confirmar vía webhook → actualizar `WasherRental.status`.

### 7. APK Android (Capacitor 8)

Capacidades (ver `APK_STRUCTURE.md` para estado actual):
- **Auth nativa Google** (`@capacitor-firebase/authentication`).
- **Push FCM** (`@capacitor/push-notifications`).
- **Haptics** (`@capacitor/haptics`).
- **Biometría** (`@capacitor/biometric`).
- **Deep linking** (Universal Links) hacia `lavadoras.yapido.click`.
- **Offline cache** de productos/tiendas/perfil (Workbox-like).
- **Iconos + Splash** nativos (no más capacitor default).

---

## Style Guidelines

- **Estética:** Cyber-Luxe — gradientes, glassmorphism, animaciones fluidas.
- **Color primario:** Verde Yapido `rgb(0 184 113)` (`--brand-600`).
- **Acento lavadora:** Violeta `rgb(124 58 237)` (`--accent-600`) para diferenciar visualmente del e-commerce.
- **Fondo:** Slate oscuro + glass overlays.
- **Tipografía:** `Inter` (sans-serif), modo display con contraste alto para legibilidad outdoor.
- **Iconos:** Lucide React.
- **Animaciones:** Framer Motion (transiciones) + Tailwind animate.
- **Sistema responsive:** ver `docs/responsive-design-spec.md`.

---

## Sistema de Diseño Responsive

3 breakpoints (ver `docs/responsive-design-spec.md`):
- **Móvil (0-767px):** 1 columna, `navbar` 64px, cards `rounded-2xl`, touch targets 48px. Bottom nav fijo.
- **Tablet (768-1279px):** 2 columnas, navbar 72px, touch 56px.
- **Desktop (1280px+):** 3-4 columnas, navbar 80px, sidebar 280px, touch 64px.

---

## Arquitectura del Proyecto (standalone dentro del monorepo)

```
lavadoras/
├── src/
│   ├── app/                       # Rutas Next.js (App Router)
│   │   ├── washer/                # Flujo alquiler (público + cliente)
│   │   │   └── waiting-room/      # Sala de espera mientras se asigna driver
│   │   ├── admin/
│   │   │   ├── washer/            # CRUD inventario
│   │   │   ├── fleet/             # Gestión flota
│   │   │   ├── geography/         # Ciudades/zonas
│   │   │   ├── business-plan/     # Plan de negocio editorial
│   │   │   └── agents/            # Panel de los 20 agentes
│   │   ├── delivery/              # Flujo repartidor
│   │   ├── stores/                # Catálogo tiendas (compartido con Yapido)
│   │   ├── products/              # Catálogo productos (compartido)
│   │   ├── checkout/              # Pago
│   │   ├── profile/               # Perfil usuario
│   │   ├── categories/            # Categorías
│   │   └── about/                 # About
│   │
│   ├── components/                # Componentes UI
│   │   ├── ui/                    # shadcn/ui primitives (botones, dialogs, etc.)
│   │   ├── layout/                # Layouts + navbar + sidebar
│   │   ├── home/                  # Hero + secciones home
│   │   │   └── washer-rental/     # Widget de reserva rápida en home
│   │   ├── visual-design/         # Device* components (responsive helpers)
│   │   ├── washer/                # (futuro — extraer desde home/washer-rental)
│   │   ├── delivery/              # Dashboard repartidor
│   │   ├── agents/                # UI de los 20 agentes
│   │   │   └── logistica/         # Agente logística
│   │   └── ...                    # category, chat, notification, order, product, rating, security, store, system
│   │
│   ├── ai/
│   │   ├── agents/                # 20 agentes Genkit
│   │   ├── flows/                 # Flujos encadenados
│   │   └── dev.ts                 # Entry del dev server genkit
│   │
│   ├── firebase/
│   │   ├── client/                # SDK web (Firestore, Auth, Storage, FCM)
│   │   ├── admin/                 # SDK admin (server-only, gated por 'server-only')
│   │   └── shared/                # Tipos compartidos
│   │
│   ├── lib/
│   │   ├── server/                # ⚠️ server-only: firebase-admin, @google-cloud/*, mapbox secret
│   │   ├── client/                # utils globales (formatters, hooks)
│   │   └── nequi/                 # Wrapper pago Nequi
│   │
│   ├── context/                   # React contexts (auth, theme, city)
│   └── hooks/                     # Custom hooks (useDeviceSize, useFleetLive...)
│
├── public/                        # Assets estáticos
├── android/                       # Proyecto Capacitor Android
├── scripts/                       # Scripts CLI (setup-superadmin, seed)
├── docs/                          # Esta documentación
└── resources/                     # Assets branding
```

### Convenciones

1. **Una sola app Next.js**, un solo `package.json`, un solo deploy.
2. **Server-only code en `src/lib/server/`** con `import 'server-only'` al inicio.
3. **Admin SDK (`firebase-admin`, `@google-cloud/*`) jamás debe aparecer en imports cliente.** Uso exclusivo en Route Handlers `app/api/*` o Server Actions.
4. **20 agentes IA en `src/ai/agents/`** — organización por dominio de negocio, no por tecnología.
5. **No duplicar** el módulo `/washer` de Yapido. Este proyecto **es** la fuente de verdad de lavadoras; el módulo Yapido redirige o se depreca (ver `AGENTS.md` raíz del proyecto).
6. **Auth unificada vía `auth.yapido.click`** — nunca crear proyecto Firebase propio.
7. **Commits prefijados:** `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.

---

## Stack Técnico

- **Frontend:** Next.js 15.5.9 (App Router + Turbopack), React 19.2, Tailwind CSS 3.4.
- **UI:** Radix UI primitives + shadcn/ui, Lucide React, Framer Motion, Embla Carousel.
- **Backend:** Firebase 11.9 (Firestore + Auth + Storage + FCM), firebase-admin 13.8 (server-only).
- **AI:** Genkit 1.28 + `@genkit-ai/google-genai` (Gemini 2.5 Flash).
- **Mapas:** Mapbox GL JS (cliente) + `@googlemaps/js-api-loader` (solo si se requiere reverse geocoding).
- **Nativo:** Capacitor 8 (Android APK), `@capacitor-firebase/authentication`, `@capacitor/push-notifications`, `@capacitor/biometric`, `@capacitor/haptics`, `@capacitor/app` (deep link).
- **Forms:** react-hook-form + zod.
- **Reportes:** html2canvas + jspdf.
- **Charts:** recharts.
- **TypeScript:** ^5 (strict), `ignoreBuildErrors` solo como red de seguridad.

---

## Seguridad

- Superadmin leído de `appConfig/superAdmins` (no hardcodeado).
- Reglas Firestore validadas por rol + tipos (ver `firestore.rules`).
- Headers de seguridad en `next.config.ts` para rutas sensibles.
- `cronSecret` y `debugSecret` en variables de entorno.
- API keys en `.env.local` (ignorado por git, ver `.env.example`).
- Validación GPS (coordenadas, velocidad, timestamp) en cliente + server.

---

## Métricas y Operación

- Cron mantenimiento: `purge-trash` diario 02:00 (en `vercel.json` cuando aplique).
- Reportes PDF desde `admin/washer` y `admin/business-plan`.
- Tracking de eventos custom vía Firestore `analytics/`.
- Logs en `/api/debug` (protegido por `debugSecret`).

---

## Roadmap de Alto Nivel

### ✅ Hecho
- APK base con login Google nativo + FCM.
- Flujo `/washer` funcional (reserva + waiting-room).
- 20 agentes IA documentados.
- Catálogo visual shadcn/Radix completo.
- Plan de negocio editorial (`/admin/business-plan`).

### 🔧 En progreso (esta iteración)
- [ ] Docs propios del proyecto (blueprint, backend, design-spec, AGENTS).
- [ ] Aislar server-only code en `src/lib/server/` con guardia.
- [ ] Iconos + splash nativos + deep linking + biometría.
- [ ] Decidir deprecation del `/washer` en Yapido raíz.
- [ ] Auditoría de reglas Firestore + runbook de claves.

### 🚧 Pendiente
- Pagos reales en producción (Nequi/PSE live).
- PWA offline completo (cache de productos/tiendas/perfil).
- Geofencing automático en dirección de reserva.
- IoT en lavadoras (sensores de estado en tiempo real).
- Onboarding presencial de conductores en Aguachica.

---

*Última actualización: 18 de Julio, 2026*
*Mantenido por: equipo lavadoras*
