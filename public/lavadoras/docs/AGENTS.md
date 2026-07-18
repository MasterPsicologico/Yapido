# Cerebro Central — Lavadoras (standalone Next.js)

> Memoria evolutiva para IA sobre el proyecto **Lavadoras**.
> Consulta obligatoria antes de cualquier modificación dentro de `public/lavadoras/`.

---

## Identidad

- **Producto:** Lavadoras — alquiler + logística + IA + APK.
- **Stack:** Next.js 15.5.9 + React 19.2 + Firebase (Firestore/Auth/Storage/FCM/RTDB) + Genkit 1.28 (Gemini 2.5 Flash) + Capacitor 8 (Android).
- **Firebase project:** `studio-4796645076-6f375` (compartido con el resto del ecosistema).
- **Auth domain:** `auth.yapido.click` (cuenta única a través de todos los subdominios).
- **Puerto dev:** 9002 (corre en paralelo con Yapido padre).
- **Producción:** `https://lavadoras.yapido.click` + APK `click.yapido.app`.

---

## Estructura del proyecto

```
public/lavadoras/
├── AGENTS.md                     # Este archivo
├── README.md                     # Onboarding rápido
├── MANIFEST.md                   # Mapa de documentos
├── APK_STRUCTURE.md              # Estado de la APK Capacitor
├── docs/
│   ├── AGENTS.md                 # (back-compat) alias de este archivo
│   ├── blueprint.md              # Diseño del producto
│   ├── backend.json              # Esquema Firestore específico
│   └── responsive-design-spec.md # Sistema visual responsive
├── src/
│   ├── app/                      # Rutas Next.js (App Router)
│   │   ├── washer/               # Flujo de reserva (cliente)
│   │   ├── admin/                # Panel admin (washer, fleet, geography, agents, business-plan)
│   │   ├── delivery/             # Flujo repartidor
│   │   ├── stores/               # Catálogo tiendas (compat Yapido)
│   │   ├── products/             # Catálogo productos
│   │   ├── checkout/             # Checkout compartido
│   │   ├── profile/              # Perfil usuario
│   │   ├── categories/
│   │   ├── api/                  # Route Handlers (server-only)
│   │   └── about/
│   ├── ai/
│   │   ├── agents/               # 20 agentes Genkit
│   │   ├── flows/                # Cadenas multi-agente
│   │   └── dev.ts                # Entrada dev server genkit
│   ├── components/               # Componentes UI
│   │   ├── ui/                   # shadcn primitives
│   │   ├── layout/               # navbar, sidebar, bottom-nav
│   │   ├── home/                 # landing
│   │   │   └── washer-rental/    # widget de reserva rápida
│   │   ├── delivery/             # dashboard driver
│   │   ├── agents/               # UI de los 20 agentes
│   │   │   └── logistica/        # agente logística
│   │   ├── visual-design/        # Device* components
│   │   ├── chat/  category/  notification/  order/  product/  rating/  security/  store/  system/
│   ├── firebase/
│   │   ├── client/               # SDK web (auth, firestore client, storage, FCM)
│   │   ├── admin/                # SDK admin (server-only)
│   │   └── shared/               # tipos compartidos (NO importar admin desde client)
│   ├── lib/
│   │   ├── server/               # ⚠️ server-only — firebase-admin, @google-cloud/*, secrets
│   │   ├── client/               # utils cliente
│   │   └── nequi/                # wrapper pago Nequi
│   ├── context/                  # React contexts (auth, theme, city)
│   ├── hooks/                    # custom hooks
│   └── ai/ .../
├── public/                       # assets
├── android/                      # proyecto Capacitor Android
├── scripts/                      # CLI (setup-superadmin, seed)
├── resources/                    # branding
├── next.config.ts
├── capacitor.config.ts           # ⚠️ appId = click.yapido.app, appName = Yapido (ver AGENTS § Drift)
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── apphosting.yaml
├── vercel.json
├── tailwind.config.ts
├── components.json               # shadcn config (style: new-york)
├── .env.example
└── package.json
```

---

## Sistema de Auth

- **Provider:** Google vía `@capacitor-firebase/authentication` (APK) + popup web (browser/PWA).
- **IdToken bridge:** el token nativo se pasa al SDK Firebase Web para mantener sesión sin reload.
- **Documento user creation:** `users/{uid}` con `keys().hasAll(['email', 'role'])` validado en reglas.
- **Superadmin:** leído de `appConfig/superAdmins.adminIds` (no hardcodeado en código).

---

## Modelo de datos (resumen)

> Detalle completo en `docs/backend.json`. Entidades específicas de lavadoras:

- **WasherRental** — reserva central (`/washerRentals/{rentalId}`).
- **WasherInventory** — unidad física (`/washerInventory/{unitId}`).
- **WasherPricing** — cotización persistida del agente precios.
- **FleetMission** — comparte colección con Yapido; tipos `washer_pickup` y `washer_delivery`.
- **Payment** — pago Nequi/PSE/PayU/Stripe por reserva.

Compartidas con Yapido: `User`, `DriverProfile`, `City`, `Zone`, `Notification`, `Rating`, `AppConfig`.

---

## 20 Agentes IA (Genkit)

| Carpeta | Función |
|---------|---------|
| `analytics/` | Métricas cruzadas (rentas, ingresos, NPS). |
| `asignador/` | Match reserva → mission → driver. |
| `cliente/` | Recomienda tipo/horas según perfil. |
| `fraude/` | Detecta reservas sospechosas. |
| `growth/` | Experimentación y growth loops. |
| `inventario/` | Rotación y mantenimiento. |
| `legal/` | Compliance y términos. |
| `logistica/` (componente UI) | Embajador visual del agente logística. |
| `marketing/` | Campañas y contenido. |
| `notificaciones/` | Cuándo y cómo avisar. |
| `optimizacion/` | Mejora continua de tarifas y rutas. |
| `pagos/` | Reconciliación y disputas. |
| `prediccion/` | Predicción de demanda. |
| `precios/` | Cotización por horas + logística. |
| `repartidor/` | Asistente del driver (ETA, instrucciones). |
| `rutas/` | Geofence + asignación de mission. |
| `seguridad/` | Detección de anomalías. |
| `soporte/` | Chat de atención al cliente. |
| `supervisor/` | Meta-agente que orquesta a los demás. |
| `tiempo-real/` | Tracking y ETA dinámico. |
| `tienda/` | (Compat con Yapido padre) |
| `customer-success/` (a veces) | Encuestas post-reserva. |

Flujos encadenados viven en `src/ai/flows/`. Cada agente expone `input` y `output` tipados con `zod`, y emite trazas al dev server (`genkit:dev`).

---

## Convenios críticos

1. **Una sola app Next.js.** No hay `conductor/`, no hay `finanzas/` adentro. Es standalone.
2. **Server-only code en `src/lib/server/`.** Todo archivo que importe `firebase-admin`, `@google-cloud/*`, o use secretos debe iniciar con:
   ```ts
   import 'server-only';
   ```
3. **El cliente NUNCA importa `firebase-admin`.** Si aparece un import cruzado, es bug.
4. **Ruta `/washer` de Yapido padre queda deprecated.** Toda redirección o deprecation se ejecuta en `next.config.ts`/middleware del padre, no aquí.
5. **Auth unificada vía `auth.yapido.click`.** Nunca crear proyecto Firebase propio.
6. **Conventional Commits:** `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
7. **Lint + typecheck obligatorio** antes de commit (`npm run lint`, `npm run typecheck`).
8. **APK se construye con `next build` → `npx cap sync android`.** No commitear `android/` modificado sin pasar por Capacitor.

---

## Drift conocido (a resolver en esta iteración)

| # | Síntoma | Estado actual | Acción |
|---|---------|---------------|--------|
| D1 | `docs/AGENTS.md` original era el cerebro de **CineStream** | Copiado por error del monorepo padre | ✅ Reemplazado. |
| D2 | `docs/blueprint.md` y `responsive-design-spec.md` originales eran de **Yapido** | Copiados y renombrados | ✅ Reemplazados con versiones propias. |
| D3 | `docs/backend.json` original contenía entidades de Yapido/Conductor | Sobredimensionado | ✅ Reemplazado con subset lavadoras + entidades nuevas (`WasherInventory`, `WasherPricing`). |
| D4 | `package.json` declara `firebase-admin` y `@google-cloud/*` para uso cliente potencial | Sin guardia | ✅ Mover a aislamiento `src/lib/server/` con `import 'server-only'`. |
| D5 | `capacitor.config.ts appId = 'click.yapido.app'` + `appName = 'Yapido'` | Branding heredado | Ver § Naming. |
| D6 | `firestore.rules` mezcla reglas de Yapido (machines, products/storeOwnerId, driverLocations, geoData…) | Sobredimensionado | Pendiente: recortar a lo que usa lavadoras. |
| D7 | `vercel.json` no revisado | Desconocido | Pendiente: auditar `vercel.json` y crear uno. |
| D8 | `scripts/` no confirmado en este proyecto | Probablemente ausente | Pendiente: crear `setup-superadmin.ts`, `seed-washer-inventory.ts`. |

---

## Pendientes resueltos en esta iteración

- ✅ Reemplazo de `docs/AGENTS.md` (cerebro lavadoras real).
- ✅ `docs/blueprint.md` propio.
- ✅ `docs/backend.json` propio (subset + entidades lavadoras-only).
- ✅ `docs/responsive-design-spec.md` propio con overrides lavadoras.

## Pendientes por ejecutar (siguientes pasos)

- [ ] **Aislamiento server-only:** crear `src/lib/server/firebase-admin.ts`, `src/lib/server/storage.ts`, mover usos desde código cliente y agregar `import 'server-only'`.
- [ ] **APK nativa:**
  - [ ] Configurar `@capacitor/splash-screen` + assets.
  - [ ] Configurar `@capacitor/biometric` (login post-primera-vez).
  - [ ] Deep linking `lavadoras.yapido.click` → app via `@capacitor/app` + `intent-filter` en AndroidManifest.
  - [ ] Iconos profesionales para `android/app/src/main/res` (reemplazar los default de Capacitor).
- [ ] **Drift:**
  - [ ] `capacitor.config.ts`: cambiar `appId` a `click.yapido.lavadoras` y `appName` a `Lavadoras` (con plan de migración de Play Store).
  - [ ] Crear `scripts/setup-superadmin.ts` y `scripts/seed-washer-inventory.ts`.
  - [ ] Auditar y recortar `firestore.rules`.
- [ ] **PWA offline:** cachear `/washer` + `/stores` + `/products` + `/profile` vía Workbox-like strategy.
- [ ] **Deprecation plan:** en Yapido padre, redirect `/washer` → `/lavadoras`. Mantener compat temporal con banner.
- [ ] **Tests mínimos:** auth bridge + booking washer happy path.

---

## Cómo arrancar en local

```bash
cd public/lavadoras
npm install
cp .env.example .env.local       # rellenar NEXT_PUBLIC_FIREBASE_*, GOOGLE_GENAI_*, etc.
npm run dev                       # http://localhost:9002
npm run genkit:dev                # http://localhost:4000 (studio Genkit)
npm run typecheck                 # tsc --noEmit
npm run lint                      # next lint
```

Build APK:
```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

---

## Riesgos activos

- **R1:** Si se importa `firebase-admin` en un componente cliente, el bundle se rompe y aumenta >1MB.
- **R2:** Si `appId` cambia sin migrar la firma de SHA-1 + package name, el APK se rompe en producción.
- **R3:** Reglas de Firestore demasiado permisivas (`allow write: if isAdmin()` sin quota) → potencial abuso.
- **R4:** 20 agentes corriendo sin rate-limit puede disparar costos Gemini en horas pico.
- **R5:** Cache offline sin versioning puede servir datos stale al usuario.

---

*Última actualización: 18 de Julio, 2026*
*Mantenido por: equipo lavadoras + IA asistente*
