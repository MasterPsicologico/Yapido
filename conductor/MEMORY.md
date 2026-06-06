# 🧠 MEMORIA EVOLUTIVA — Yapido Movilidad (`conductor/`)

> **Archivo de memoria técnica completa del proyecto.**
> Este documento es la **fuente única de verdad** sobre cómo funciona cada parte del código.
> **Debe consultarse SIEMPRE antes de modificar cualquier archivo** y **actualizarse cuando se produzcan cambios**.

---

## 📑 Índice

1. [Visión global del proyecto](#1-visión-global-del-proyecto)
2. [Stack y versiones exactas](#2-stack-y-versiones-exactas)
3. [Estructura de carpetas (mapa completo)](#3-estructura-de-carpetas-mapa-completo)
4. [Configuración del proyecto (raíz)](#4-configuración-del-proyecto-raíz)
5. [Sistema de diseño y estilos](#5-sistema-de-diseño-y-estilos)
6. [Contratos de datos (Zod schemas)](#6-contratos-de-datos-zod-schemas)
7. [Constantes de dominio](#7-constantes-de-dominio)
8. [Capa de Firebase (cliente y admin)](#8-capa-de-firebase-cliente-y-admin)
9. [Utilidades geográficas](#9-utilidades-geográficas)
10. [Capa de Realtime (RTDB)](#10-capa-de-realtime-rtdb)
11. [Capa de API (Cloud Functions wrappers)](#11-capa-de-api-cloud-functions-wrappers)
12. [Geocoding con Mapbox](#12-geocoding-con-mapbox)
13. [Hooks de React](#13-hooks-de-react)
14. [State management (Zustand + XState)](#14-state-management-zustand--xstate)
15. [Componentes UI](#15-componentes-ui)
16. [Pantallas (rutas Next.js)](#16-pantallas-rutas-nextjs)
17. [Cloud Functions (backend)](#17-cloud-functions-backend)
18. [Reglas de seguridad](#18-reglas-de-seguridad)
19. [Índices de Firestore](#19-índices-de-firestore)
20. [Scripts de seed y dev](#20-scripts-de-seed-y-dev)
21. [Flujos end-to-end](#21-flujos-end-to-end)
22. [Pricing y comisiones](#22-pricing-y-comisiones)
23. [Multi-ciudad y particionado RTDB](#23-multi-ciudad-y-particionado-rtdb)
24. [Workflows de desarrollo y deploy](#24-workflows-de-desarrollo-y-deploy)
25. [Convenciones del equipo](#25-convenciones-del-equipo)
26. [Decisiones arquitectónicas clave](#26-decisiones-arquitectónicas-clave)
27. [Pendientes y roadmap](#27-pendientes-y-roadmap)
28. [Cómo actualizar este documento](#28-cómo-actualizar-este-documento)

---

## 1. Visión global del proyecto

**Yapido Movilidad** es una app de **ride-sharing** (moto/auto) para **yapido.click**, modelo **Didi Conductor**.

- **Ciudad piloto:** Aguachica, Cesar (Colombia) — `~102.000 hab`.
- **Modalidad prioritaria:** **moto** (~70% del tráfico urbano).
- **Multi-ciudad desde el día 1:** arquitectura preparada para lanzar gradualmente.
- **Moneda:** COP, timezone `America/Bogota`, locale `es-CO`.
- **Pagos:** Wompi (Colombia) + efectivo — extensible a Stripe.
- **Vocabulario crítico:** *pasajero* = usuario que pide, *conductor* = usuario que ofrece el servicio, *viaje/trip* = servicio completo.
- **Restricción clave:** offline-first es crítico (4G intermitente en periferia).
- **Tipo de cliente:** **cliente pesado** (Next.js + Capacitor 8 → Android APK).
- **Puerto dev:** `9005`.
- **Proyecto Firebase:** `yapido-movilidad` (separado del e-commerce de Yapido principal).

---

## 2. Stack y versiones exactas

### 2.1 Frontend (Next.js)
| Paquete | Versión | Función |
|---|---|---|
| `next` | `15.5.9` | Framework React con App Router |
| `react` / `react-dom` | `^19.2.1` | UI |
| `tailwindcss` | `^3.4.1` | Estilos utility-first |
| `tailwindcss-animate` | `^1.0.7` | Animaciones utilities |
| `autoprefixer` | `^10.4.20` | Vendor prefixes |
| `clsx` | `^2.1.1` | Conditional classNames |
| `tailwind-merge` | `^3.0.1` | Merge conflicting Tailwind classes |
| `framer-motion` | `^12.38.0` | Animaciones declarativas |
| `lucide-react` | `^0.475.0` | Iconos SVG |
| `@radix-ui/*` | varios | Primitivos UI accesibles (avatar, dialog, popover, toast, etc.) |
| `@hookform/resolvers` | `^4.1.3` | Integración react-hook-form + Zod |
| `react-hook-form` | `^7.54.2` | Forms |
| `zod` | `^3.24.2` | Validación de schemas |
| `zustand` | `^5.0.2` | Estado global |
| `@xstate/react` + `xstate` | `^5.0.5` / `^5.19.2` | State machines |
| `mapbox-gl` | `^3.23.0` | Mapas interactivos |
| `date-fns` | `^3.6.0` | Fechas |
| `uuid` | `^11.0.5` | UUIDs |
| `ngeohash` | `^0.6.3` | Geohash encoding |

### 2.2 Firebase
| Paquete | Versión | Función |
|---|---|---|
| `firebase` | `^11.9.1` | SDK cliente (Auth, Firestore, RTDB, Storage, Functions, FCM) |
| `firebase-admin` | `^13.10.0` | SDK admin (server-side, Cloud Functions, scripts) |

### 2.3 Capacitor (nativo Android)
| Paquete | Versión | Función |
|---|---|---|
| `@capacitor/core` | `^8.3.1` | Runtime Capacitor |
| `@capacitor/android` | `^8.3.1` | Plataforma Android |
| `@capacitor/app` | `^8.0.0` | App lifecycle |
| `@capacitor/geolocation` | `^8.0.0` | GPS nativo (mayor precisión) |
| `@capacitor/haptics` | `^8.0.2` | Vibración |
| `@capacitor/network` | `^8.0.0` | Detección online/offline |
| `@capacitor/push-notifications` | `^8.0.3` | FCM en nativo |
| `@capacitor/status-bar` | `^8.0.0` | Status bar nativa |

### 2.4 Dev / calidad
| Paquete | Versión | Función |
|---|---|---|
| `typescript` | `^5` | Tipado |
| `eslint` + `eslint-config-next` | `^9` / `15.5.9` | Lint |
| `vitest` | `^2.1.8` | Tests unitarios |
| `tsx` | `^4.19.2` | Ejecutar TS directamente (scripts) |
| `concurrently` | `^9.1.0` | Correr múltiples procesos (emu + next) |

### 2.5 Cloud Functions (Node 20 ESM)
- `firebase-admin` `^13.0.0`
- `firebase-functions` `^6.1.0`
- `geohash` `^1.1.0` + `ngeohash` `^0.6.3`
- `uuid` `^11.0.5`
- `zod` `^3.24.2`
- TypeScript `^5.5.0`

---

## 3. Estructura de carpetas (mapa completo)

```
conductor/                              ← Raíz del proyecto
├── AGENTS.md                           ← Convenciones del equipo (NO TOCAR sin discutir)
├── README.md                           ← Quick start
├── MEMORY.md                           ← ⬅️ ESTE ARCHIVO (memoria evolutiva completa)
│
├── package.json                        ← npm scripts + deps del frontend
├── next.config.ts                      ← Config Next.js (output: 'export' si NEXT_PUBLIC_EXPORT=true)
├── tsconfig.json                       ← TypeScript del frontend
├── tailwind.config.ts                  ← Tema (paleta brand, ink, moto, auto, animaciones)
├── postcss.config.cjs                  ← Tailwind + autoprefixer
├── .eslintrc.json                      ← ESLint next/core-web-vitals
├── .gitignore                          ← node_modules, .next, out, .env*.local, android/, etc.
│
├── .env.example                        ← Plantilla de variables de entorno
├── .firebaserc                         ← Proyecto Firebase por defecto
├── firebase.json                       ← Emuladores + reglas
├── firestore.rules                     ← Reglas de seguridad Firestore
├── firestore.indexes.json              ← Índices compuestos Firestore
├── rtdb.rules.json                     ← Reglas RTDB (particionado por ciudad)
├── storage.rules                       ← Reglas de Storage (fotos, documentos)
│
├── app/                                ← Next.js App Router
│   ├── layout.tsx                      ← RootLayout con FirebaseBootstrap + AuthProvider + Splash
│   ├── page.tsx                        ← Hub de selección de rol (pasajero/conductor)
│   ├── providers.tsx                   ← AuthProvider (onAuthStateChanged + users snapshot)
│   ├── bootstrap.tsx                   ← FirebaseBootstrap (cliente-only init)
│   ├── api/health/route.ts             ← GET /api/health → {ok, app, ts}
│   ├── auth/page.tsx                   ← Login con Google (popup)
│   ├── passenger/                      ← Grupo de rutas del pasajero
│   │   ├── home/page.tsx               ← Mapa + autolocalización + atajos
│   │   ├── home/search/page.tsx        ← Autocomplete Mapbox + tap-en-mapa
│   │   ├── home/confirm/page.tsx       ← Confirmar viaje (tipo + pago + notas)
│   │   ├── trip/[id]/page.tsx          ← Viaje en curso (pasajero) con XState
│   │   ├── history/page.tsx            ← Historial de viajes
│   │   └── profile/page.tsx            ← Perfil + logout
│   └── driver/                         ← Grupo de rutas del conductor
│       ├── onboarding/page.tsx         ← 3 pasos: personal → vehículo → docs
│       ├── home/page.tsx               ← Toggle online + ofertas en vivo
│       ├── trip/[id]/page.tsx          ← Viaje asignado (fases: arriving → waiting → inProgress)
│       ├── trip/done/page.tsx          ← Resumen de viaje completado
│       └── earnings/page.tsx           ← Ganancias hoy/7 días + últimos viajes
│
├── components/
│   ├── layout/Splash.tsx               ← Splash animado (se muestra una vez por sesión)
│   ├── map/
│   │   ├── MapView.tsx                 ← Wrapper Mapbox GL con marcadores custom
│   │   └── index.ts                    ← Barrel: MapView, StatusPill
│   ├── shared/
│   │   ├── Button.tsx                  ← Botón con variants (primary/secondary/ghost/destructive)
│   │   ├── Input.tsx                   ← Input base
│   │   ├── Loading.tsx                 ← Spinner SVG
│   │   ├── Rating.tsx                  ← Estrella + número
│   │   └── index.ts                    ← Barrel
│   └── trip/StatusPill.tsx             ← Pill con color según estado de viaje
│
├── lib/
│   ├── contracts/
│   │   ├── constants.ts                ← Enums, timeouts, comisiones
│   │   ├── schemas.ts                  ← Zod schemas compartidos cliente↔servidor
│   │   └── index.ts                    ← Barrel
│   ├── firebase/
│   │   ├── client.ts                   ← Init Firebase CLIENTE (Auth, Firestore, RTDB, Storage, Functions)
│   │   ├── admin.ts                    ← Init Firebase Admin (server-side)
│   │   └── index.ts                    ← Barrel CLIENT-ONLY (sin admin)
│   ├── geo/index.ts                    ← Geohash, haversine, bbox, polygon, formateo
│   ├── realtime/index.ts               ← Wrappers RTDB (drivers_online, trips_live, offers)
│   ├── api/
│   │   ├── index.ts                    ← Wrappers Cloud Functions (createTrip, acceptOffer, etc.)
│   │   └── geocode.ts                  ← Geocoding Mapbox (Search Box v1 + Geocoding v5)
│   └── utils/index.ts                  ← cn, uuid, nowMs, safeJSON, retry, sleep
│
├── hooks/
│   ├── useAuth.ts                      ← Suscribe a Firebase Auth + perfil Firestore
│   ├── useDriverGPS.ts                 ← WatchPosition + throttle + write RTDB
│   ├── useTripStream.ts                ← Snapshot Firestore + RTDB del viaje
│   ├── useOfflineQueue.ts              ← Cola de mutaciones con persist localStorage
│   ├── useOnline.ts                    ← navigator.onLine + listener
│   └── index.ts                        ← Barrel
│
├── store/                              ← Estado global
│   ├── userStore.ts                    ← Zustand: usuario autenticado + isPassenger/isDriver/isAdmin
│   ├── driverStore.ts                  ← Zustand: online, cityId, vehicleType, location, pendingOffer
│   ├── tripMachine.ts                  ← XState: máquina de estados del viaje (lado pasajero)
│   ├── tripStore.ts                    ← Helper para crear instancias de tripMachine
│   ├── driverMachine.ts                ← XState: máquina del conductor (offline/online/offering/onTrip)
│   └── index.ts                        ← Barrel
│
├── functions/                          ← Cloud Functions v2 (backend Node 20)
│   ├── package.json                    ← Deps aisladas del backend
│   ├── tsconfig.json                   ← TS estricto, output ES2022
│   └── src/
│       ├── index.ts                    ← Barrel de exports
│       ├── types.ts                    ← Tipos compartidos servidor (TripDoc, City, etc.)
│       ├── handlers/
│       │   ├── onTripCreated.ts        ← onDocumentCreated → matchTrip con cascada
│       │   ├── createTrip.ts           ← onCall: crear viaje + mirror RTDB
│       │   ├── acceptOffer.ts          ← onCall: aceptar oferta (transacción atómica)
│       │   ├── cancelTrip.ts           ← onCall: cancelar viaje
│       │   ├── completeTrip.ts         ← onCall: completar + recalcular fare + crear payment
│       │   ├── rateTrip.ts             ← onCall: calificar + actualizar rating
│       │   ├── fareEstimate.ts         ← onCall: cotizar antes de solicitar
│       │   └── setOnline.ts            ← onCall: conductor online/offline
│       └── lib/
│           ├── fare.ts                 ← computeFare() + estimateDistanceDuration()
│           ├── geo.ts                  ← haversine, encodeGeohash, geohash9, bearing
│           └── matching.ts             ← rankDrivers() + getOfferTimeoutMs() (adaptativo por ciudad)
│
├── scripts/
│   ├── seed-aguachica.ts               ← Crea cities/aguachica con pricing y geofence
│   ├── seed-dev.ts                     ← Crea 4 conductores + 1 pasajero fake para testing
│   ├── dev-all.bat                     ← Windows: emuladores + Next.js dev
│   └── dev-all.sh                      ← Linux/macOS: idem
│
├── styles/
│   └── globals.css                     ← Tailwind + tema claro (light) + dark + glassmorphism + animaciones
│
├── public/
│   └── m-static/
│       ├── manifest.json               ← PWA manifest
│       └── .gitkeep
│
└── tests/                              ← (carpeta vacía, para Vitest)
```

---

## 4. Configuración del proyecto (raíz)

### 4.1 `package.json` — scripts clave
| Script | Comando | Función |
|---|---|---|
| `npm run dev` | `next dev -p 9005` | Dev server Next.js en puerto 9005 |
| `npm run dev:emu` | `concurrently emu + dev` | Emuladores + Next.js en paralelo |
| `npm run emu` | `firebase emulators:start --only auth,firestore,functions,storage` | Solo emuladores |
| `npm run build` | `next build` | Build SSR |
| `npm run build:static` | `NEXT_PUBLIC_EXPORT=true next build` | Build estático para Capacitor |
| `npm run start` | `next start -p 9005` | Servir build |
| `npm run lint` | `next lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` | Verificar tipos sin emitir |
| `npm run test` | `vitest run` | Tests |
| `npm run seed:aguachica` | `tsx scripts/seed-aguachica.ts` | Sembrar ciudad Aguachica |
| `npm run seed:dev` | `tsx scripts/seed-dev.ts` | Sembrar datos de prueba |
| `npm run functions:build` | `tsc -p functions/tsconfig.json` | Compilar Cloud Functions |
| `npm run functions:serve` | `npm --prefix functions run serve` | Servir funciones en emulador |
| `npm run deploy:rules` | `firebase deploy --only firestore:rules,database,storage` | Deploy reglas |
| `npm run deploy:functions` | `firebase deploy --only functions` | Deploy funciones |
| `npm run deploy:all` | `firebase deploy` | Deploy todo |
| `npm run capacitor:sync` | `build:static && npx cap sync android` | Sincronizar APK |
| `npm run capacitor:open` | `npx cap open android` | Abrir proyecto Android Studio |

### 4.2 `next.config.ts`
- `output: 'export'` cuando `NEXT_PUBLIC_EXPORT=true` (build para Capacitor).
- `trailingSlash: true` (rutas con slash final, importante para export).
- `images.unoptimized: true` cuando es export (no usa Image Optimization).
- `basePath: '/m'` cuando es export (sirve bajo `/m/`).
- `webpack.fallback.fs = false` (Firebase usa fs, webpack lo marca como noop en navegador).

### 4.3 `tsconfig.json`
- `target: ES2022`, `module: esnext`, `moduleResolution: bundler`.
- `strict: true`, `noEmit: true`, `isolatedModules: true`.
- `paths: { "@/*": ["./*"] }` — alias de imports absolutos.
- Excluye `node_modules`, `functions`, `out`.

### 4.4 `firebase.json`
- Firestore en `us-central1`.
- Emuladores: Auth `9099`, Functions `5001`, Firestore `8080`, RTDB `9000`, Storage `9199`, UI `4000`.
- `singleProjectMode: true`.

### 4.5 `.env.example` (variables que DEBEN estar en `.env.local`)
**Cliente (`NEXT_PUBLIC_*`):**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID=yapido-movilidad`
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_MAPBOX_TOKEN`
- `NEXT_PUBLIC_API_BASE=https://us-central1-yapido-movilidad.cloudfunctions.net`
- `NEXT_PUBLIC_API_TIMEOUT_MS=12000`
- `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` + `NEXT_PUBLIC_WOMPI_SANDBOX=true`
- `NEXT_PUBLIC_APP_NAME=Yapido`
- `NEXT_PUBLIC_DEFAULT_CITY_ID=aguachica`
- `NEXT_PUBLIC_LOCALE=es-CO`
- `NEXT_PUBLIC_TIMEZONE=America/Bogota`
- `NEXT_PUBLIC_CURRENCY=COP`
- **Feature flags:** `FEATURE_SURGE=false`, `FEATURE_TIPS=true`, `FEATURE_OFFLINE_MAPS=true`, `FEATURE_BACKGROUND_GPS=true`.

**Server-only (sin `NEXT_PUBLIC_`):**
- `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET`
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (para admin SDK).

---

## 5. Sistema de diseño y estilos

### 5.1 `styles/globals.css`
- **Modo claro por defecto** (paleta slate + primary verde Yapido).
- Variables CSS en `:root` (modo claro) y `.dark` (modo oscuro manual).
- **Primary:** `rgb(0 184 113)` (verde Yapido brand-600).
- **Accent:** `rgb(124 58 237)` (violet-600).
- **Helpers:** `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-secondary`, `.btn-destructive`, `.card`, `.input`, `.chip`, `.label`, `.link`, `.skeleton`.
- **Safe areas:** `.pb-safe`, `.pt-safe` (iOS notch).
- **Animaciones:**
  - `yapidoSplash` (logo rebota 1.2s)
  - `yapidoPulse` (pulso 1.4s)
  - `yapidoSlideUp` (slide desde abajo 0.4s)
  - `yapidoFadeIn` (fade + translateY 0.3s)
  - `yapidoScaleIn` (scale 0.25s)
  - `yapidoPinPulse` (marker pulse 2.2s)
  - `yapidoDriverBob` (driver sube-baja 2.4s)
  - `yapidoUserPulse` (user pulse 2.6s)
  - `yapidoShimmer` (skeleton shimmer 1.4s)
- **Helpers visuales:**
  - `.glass` / `.glass-strong` / `.glass-dark` (glassmorphism con backdrop-filter)
  - `.yapido-pin` / `.yapido-pin--pickup` / `.yapido-pin--dropoff` (markers Mapbox custom)
  - `.yapido-driver` (emoji 🛵 con bob animation)
  - `.yapido-user-pin` (pulse + core gradient)
  - `.text-brand-gradient` / `.bg-brand-gradient` (gradiente `#00b871 → #00d97e → #7c3aed`)

### 5.2 `tailwind.config.ts`
- `darkMode: 'class'` (toggle manual).
- **Paleta semántica:** `background`, `foreground`, `card`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring` (todas leen CSS vars).
- **Paleta brand:** `brand-50` a `brand-900` (verde Yapido).
- **Moto/auto:** `moto: #ff8a3d`, `auto: #3da6ff`.
- **Ink (slate custom):** `ink-50` a `ink-900` (slate personalizado).
- **Fuentes:** `sans: Inter`, `mono: JetBrains Mono`.
- **Animaciones custom:** `pulse-slow`, `marker-bounce`, `shimmer`.
- **Plugin:** `tailwindcss-animate`.

---

## 6. Contratos de datos (Zod schemas)

📁 `lib/contracts/schemas.ts` — **compartido cliente ↔ servidor**. Todas las mutaciones a Cloud Functions validan input con estos schemas.

### 6.1 Primitivos
- `LatLngSchema` → `{ lat: -90..90, lng: -180..180 }` (tipo `LatLng`).
- `GeohashSchema` → string regex `^[0-9b-hjkmnp-z]{1,12}$`.
- `TimestampSchema` → union de `number` (ms epoch) | Firestore Timestamp | Date.

### 6.2 User (`users/{uid}`)
```ts
{
  uid, email?, phone? (E.164), displayName, photoURL?,
  role: 'passenger' | 'driver' | 'both' | 'admin',
  fcmTokens: string[], createdAt?, updatedAt?,
  status: 'active' | 'suspended' | 'banned' (default 'active'),
  locale: 'es-CO', citiesActive: string[]
}
```

### 6.3 PassengerProfile (`passenger_profiles/{uid}`)
```ts
{
  uid, defaultPaymentMethodId?, homeAddress?, workAddress?,
  ratingAvg (0..5, default 5), ratingCount, totalTrips,
  promoCodes: string[], defaultCityId: 'aguachica'
}
```

### 6.4 DriverProfile (`driver_profiles/{uid}`)
```ts
{
  uid,
  status: 'pending_docs' | 'approved' | 'rejected' | 'blocked',
  ratingAvg, ratingCount, totalTrips,
  acceptRate30d (0..1), cancelRate30d (0..1),
  vehicleId?, documentsId?,
  bankAccount?: { provider, maskedAccount, holderName },
  online: boolean,
  currentLocation?, currentGeohash6?,
  citiesActive: string[], currentCityId: 'aguachica',
  flaggedAt?,
  onboarding: { channel: 'in_person' | 'remote', verificationCity?, verifiedBy?, verifiedAt?, verificationNotes? },
  market: { primaryZone, worksWeekends, worksNights, vehicleInspectionPassed },
  city: 'aguachica'
}
```

### 6.5 DriverVehicle (`driver_vehicles/{vehicleId}`)
```ts
{
  vehicleId, driverId,
  type: 'moto' | 'auto' | 'auto_comfort',
  plate (max 10), brand, model, year (1990..current+1), color, capacity (1..8),
  photoFront?, photoSide?, photoBack?,
  insuranceExpiry?, soatExpiry?, verifiedAt?
}
```

### 6.6 DriverDocuments (`driver_documents/{uid}`)
```ts
{
  uid, ccFrontUrl?, ccBackUrl?, licenseUrl?,
  licenseExpiry?, backgroundCheckUrl?, selfieWithCcUrl?,
  status: 'pending' | 'approved' | 'rejected',
  reviewedBy?, reviewedAt?, rejectionReason?, updatedAt?
}
```

### 6.7 City (`cities/{cityId}`) — clave multi-ciudad
```ts
{
  cityId, displayName, region,
  country: 'CO', currency: 'COP', timezone: 'America/Bogota',
  geofence: GeoPolygon,
  serviceArea: GeoPolygon,
  centerLat, centerLng, population?,
  pricing: {
    moto: Pricing,
    auto: Pricing,
    auto_comfort?: Pricing,
    surge: { enabled: boolean, max: 1..3 }
  },
  status: 'active' | 'launching' | 'paused',
  launchedAt?,
  supportPhone?, supportWhatsapp?,
  stats: { activeDrivers, tripsToday, avgWaitMin },
  updatedAt?
}

Pricing = {
  base, perKm, perMin, minFare,
  currency: 'COP', commissionPct (0..1, default 0.20),
  waitingFeePerMin (default 200)
}
```

### 6.8 Trip (`trips/{tripId}`) — source of truth
```ts
{
  tripId, cityId,
  status: 'searching' | 'offered' | 'accepted' | 'arriving'
        | 'in_progress' | 'completed' | 'cancelled' | 'no_drivers' | 'rated',
  type: 'moto' | 'auto' | 'auto_comfort',
  passenger: { uid, displayName, photoURL?, rating, phone? },
  driver: { uid, displayName, photoURL?, rating, phone?, plate?, vehicleDesc? } | null,
  pickup: LatLng & { address, notes? },
  dropoff: LatLng & { address, notes? },
  routePolyline?, distanceMeters, durationSeconds,
  fare: TripFare, payment: TripPayment, timeline: TripTimeline,
  offerLog: Array<{ driverId, offeredAt, expiredAt?, reason? }>,
  createdAt?
}

TripFare = {
  currency: 'COP', base, distance, time,
  surge (1..3, default 1), tolls, wait,
  total, driverEarning, platformFee, tip
}

TripTimeline = {
  requestedAt, matchedAt?, acceptedAt?, arrivedAt?, startedAt?,
  completedAt?, cancelledAt?,
  cancelledBy: 'passenger' | 'driver' | 'system' | null,
  cancelReason?, ratedAt?
}
```

### 6.9 API Contracts (inputs/outputs de Cloud Functions)
| Schema | Función | Notas |
|---|---|---|
| `CreateTripInputSchema` | POST `/trips` | `requestId` UUID v4 obligatorio para idempotencia |
| `CreateTripOutputSchema` | response | `{ tripId, status, fare, eta? }` |
| `CancelTripInputSchema` | POST `/trips/:id/cancel` | `requestId` + `reason` |
| `RateTripInputSchema` | POST `/trips/:id/rate` | `requestId`, `score: 1..5`, `tags`, `tip: 0..100_000` |
| `FareEstimateInputSchema` | GET `/fare-estimate` | `type`, `pickup`, `dropoff`, `cityId` |
| `FareEstimateOutputSchema` | response | `fare`, `distanceMeters`, `durationSeconds`, `routePolyline`, `surge`, `eta?` |
| `SetOnlineInputSchema` | POST `/driver/set-online` | `requestId`, `online`, `cityId`, `loc` |
| `UpdateLocationInputSchema` | POST `/driver/location` | `requestId`, `loc & {h?, s?}`, `cityId` (RTDB preferido, este es fallback) |
| `AcceptOfferInputSchema` | POST `/trips/:id/accept` | `requestId`, `offerId` |
| `StartTripInputSchema` | POST `/trips/:id/start` | `requestId`, `pickupCode?` (4 dígitos) |
| `CompleteTripInputSchema` | POST `/trips/:id/complete` | `requestId`, `finalLocation?` |

### 6.10 Helpers
- `okResponse(dataSchema)` → `{ ok: true, data }`.
- `errResponse(errorSchema)` → `{ ok: false, error }`.

---

## 7. Constantes de dominio

📁 `lib/contracts/constants.ts`

```ts
VEHICLE_TYPES = ['moto', 'auto', 'auto_comfort']
TRIP_STATUSES = ['searching', 'offered', 'accepted', 'arriving',
                 'in_progress', 'completed', 'rated', 'cancelled', 'no_drivers']
PAYMENT_METHODS = ['cash', 'card', 'wompi', 'pse']
PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded']
DRIVER_STATUSES = ['pending_docs', 'approved', 'rejected', 'blocked']
DRIVER_ONLINE_STATUSES = ['online', 'on_trip', 'offline']
CANCEL_REASONS = ['passenger_no_show', 'passenger_changed_mind',
                  'driver_no_show', 'driver_vehicle_issue',
                  'passenger_behavior', 'driver_behavior', 'wrong_address', 'system']
USER_ROLES = ['passenger', 'driver', 'both', 'admin']

TIMEOUTS = {
  OFFER_TO_DRIVER: 12,           // 12s Aguachica, 8s ciudades grandes
  DRIVER_WAIT_PICKUP: 300,       // 5 min
  PASSENGER_WAIT_DRIVER: 300,    // 5 min
  PAYMENT_RETRY: 60,
  GPS_INTERVAL_FAST: 2000,
  GPS_INTERVAL_NORMAL: 3000,
  GPS_INTERVAL_SLOW: 5000,
  GPS_INTERVAL_BACKGROUND: 15000,
  GPS_MIN_DISTANCE_M: 10,        // no escribir a RTDB si < 10m
}

DEFAULT_COMMISSION_PCT = 0.20   // 20% plataforma
LAUNCH_COMMISSION_PCT = 0.00    // 0% lanzamiento Aguachica
LAUNCH_WEEKS = 4                // duración del lanzamiento
DEFAULT_CITY_ID = 'aguachica'
```

---

## 8. Capa de Firebase (cliente y admin)

### 8.1 `lib/firebase/client.ts` — Inicialización CLIENTE
⚠️ NO importar `firebase-admin` desde aquí (rompe webpack en navegador).

Inicializa **lazy singletons** con `getApps().length ? getApp() : initializeApp(config)`. Funciones exportadas:
- `firebaseApp()` → `FirebaseApp`.
- `firebaseAuth()` → `Auth` (con `connectAuthEmulator` si `isEmulator`).
- `firebaseDb()` → `Firestore` (con `connectFirestoreEmulator` si emulador).
- `firebaseRtdb()` → `Database` (con `connectDatabaseEmulator` si emulador).
- `firebaseStorage()` → `FirebaseStorage` (con `connectStorageEmulator`).
- `firebaseFunctions()` → `Functions` en `us-central1` (con `connectFunctionsEmulator`).

**⚠️ NOTA:** `isEmulator = false` (hardcoded) — para usar emuladores cambiar a `true` o usar las env vars. Las funciones de connectEmulator están envueltas en `try{}` por si ya están conectadas.

### 8.2 `lib/firebase/admin.ts` — SDK Admin (server-side)
- Usado por Cloud Functions y scripts de seed.
- Si `FIRESTORE_EMULATOR_HOST` o `FIREBASE_AUTH_EMULATOR_HOST` está set → `initializeApp({ projectId })` sin credenciales.
- En producción → `initializeApp({ credential: cert({...}), databaseURL })` usando env vars.
- Exporta: `adminApp`, `adminAuth`, `adminDb`, `adminRtdb`, `adminStorage`.

### 8.3 `lib/firebase/index.ts` — Barrel CLIENTE-ONLY
Re-exporta solo lo de `client.ts`. Para código server-side importar de `@/lib/firebase/admin` directamente.

---

## 9. Utilidades geográficas

📁 `lib/geo/index.ts`

| Función | Input | Output | Descripción |
|---|---|---|---|
| `encodeGeohash(loc, precision=6)` | `LatLng` | `string` | Geohash con `ngeohash.encode`. |
| `decodeGeohash(hash)` | `string` | `LatLng` | Decodifica. |
| `geohashNeighbors(hash)` | `string` | `string[]` | 8 vecinos. |
| `geohash9(loc, precision=6)` | `LatLng` | `string[9]` | Centro + 8 vecinos (usado en matching). |
| `haversine(a, b)` | `LatLng, LatLng` | `km` | Distancia en km. |
| `haversineMeters(a, b)` | `LatLng, LatLng` | `m` | Distancia en metros. |
| `bboxAround(center, radiusKm)` | `LatLng, number` | `BBox` | Bounding box alrededor de un punto. |
| `isInBBox(p, b)` | `LatLng, BBox` | `boolean` | ¿Dentro del bbox? |
| `isPointInPolygon(p, polygon)` | `LatLng, number[][][]` | `boolean` | Ray casting. |
| `bearing(from, to)` | `LatLng, LatLng` | `number (0..360)` | Rumbo (heading). |
| `lerpLatLng(a, b, t)` | `LatLng, LatLng, t` | `LatLng` | Interpolación lineal (animación markers). |
| `formatDistance(m)` | `number` | `string` | "850 m" o "3.4 km". |
| `formatDuration(s)` | `number` | `string` | "45 s", "3 min", "1 h 20 min". |
| `formatCOP(value)` | `number` | `string` | "$ 12.500" (Intl es-CO). |

Constante interna: `EARTH_R_KM = 6371`.

---

## 10. Capa de Realtime (RTDB)

📁 `lib/realtime/index.ts` — Encapsula listeners y writes al Realtime Database.

### 10.1 Estructura RTDB (particionada por ciudad)
```
cities/
  {cityId}/
    drivers_online/
      {driverId}/
        ├── status, vehicleType, loc: {lat, lng, h?, s?, ts}, geo6
        ├── driverId, updatedAt
    trips_live/
      {tripId}/
        ├── driverLoc, status, eta, lastUpdate
    trip_search/                  (mirror de trips para matching, written por onTripCreated)
      {geo6}/
        {tripId}/
          ├── tripId, pickup, type, requestedAt
    offers/
      {driverId}/
        current/
          ├── offerId, tripId, pickup, dropoff, type
          ├── fareEstimate, distanceKm, expiresAt, createdAt
drivers_offers/                   (legacy/alternativa: raíz en vez de cities)
  {driverId}/current/
```

### 10.2 Funciones de escritura
| Función | Path | Propósito |
|---|---|---|
| `writeDriverOnline(cityId, driverId, data)` | `cities/{cityId}/drivers_online/{driverId}` | `set` con `{...data, driverId, updatedAt: Date.now()}`. |
| `writeDriverLocation(cityId, driverId, loc)` | idem | `update` con `loc & {ts}` + `geo6`. |
| `writeDriverOffline(cityId, driverId)` | idem | `set` a `null`. |
| `writeTripDriverLocation(cityId, tripId, loc)` | `cities/{cityId}/trips_live/{tripId}/driverLoc` | `update` con `{...loc, ts: Date.now()}`. |
| `writeTripStatus(cityId, tripId, status, extras)` | `cities/{cityId}/trips_live/{tripId}` | `update` con `status`, extras y `lastUpdate: serverTimestamp()`. |
| `clearDriverOffer(driverId)` | `drivers_offers/{driverId}/current` | `set` a `null`. |

### 10.3 Funciones de suscripción
| Función | Path | Callback |
|---|---|---|
| `subscribeTripLive(cityId, tripId, onChange)` | `cities/{cityId}/trips_live/{tripId}` | `({driverLoc?, status?, eta?, routePolyline?})` |
| `subscribeDriverOffer(driverId, onChange)` | `drivers_offers/{driverId}/current` | `({tripId, expiresAt, fareEstimate?, pickup?, type?})` |
| `subscribeConnection(onChange)` | `.info/connected` | `(connected: boolean)` |

Todas devuelven una función `Unsubscribe` que llama `off(ref, 'value', listener)`.

---

## 11. Capa de API (Cloud Functions wrappers)

📁 `lib/api/index.ts` — Cada función valida input y output con Zod antes/después de la llamada.

Helper genérico:
```ts
async function call<I, O>(name, input, inputSchema, outputSchema): Promise<O>
```
- `inputSchema.parse(input)` → valida antes de enviar.
- `httpsCallable<I, unknown>(functions, name)` → llamada HTTPS.
- `outputSchema.parse(result.data)` → valida respuesta.

### Funciones expuestas
| Función | Cloud Function | Validación output |
|---|---|---|
| `apiCreateTrip(input)` | `createTrip` | `CreateTripOutputSchema` |
| `apiCancelTrip(tripId, input)` | `cancelTrip` | loose `{ok: true}` |
| `apiRateTrip(tripId, input)` | `rateTrip` | loose `{ok: true, newDriverRating?}` |
| `apiSetOnline(input)` | `setOnline` | loose `{ok: true}` |
| `apiAcceptOffer(tripId, input)` | `acceptOffer` | loose `{ok: true}` |
| `apiStartTrip(tripId, input)` | `startTrip` | loose `{ok: true}` |
| `apiCompleteTrip(tripId, input)` | `completeTrip` | loose `{ok: true, fare: unknown}` |
| `apiFareEstimate(input)` | `fareEstimate` | `FareEstimateOutputSchema` |

---

## 12. Geocoding con Mapbox

📁 `lib/api/geocode.ts` — Wrappers para Mapbox Search Box API v1 (autocomplete) y Geocoding v5 (reverse).

### 12.1 Constantes
- `SEARCH_BOX_URL = 'https://api.mapbox.com/search/searchbox/v1'`
- `GEOCODING_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places'`
- `token()` → `process.env.NEXT_PUBLIC_MAPBOX_TOKEN`.
- `sessionToken()` → `crypto.randomUUID()` o fallback.

### 12.2 Cache 30s
- `Map<string, {value, ts}>` con TTL 30_000ms.

### 12.3 Tipos
```ts
interface PlaceSuggestion {
  id, name, address, shortAddress?, fullAddress?, featureType?,
  loc: LatLng, distanceMeters?
}
```

### 12.4 Funciones
| Función | API | Parámetros | Notas |
|---|---|---|---|
| `geocodeForward(query, opts)` | Search Box v1 `/forward` | `query`, `proximity?`, `countryCodes?`, `limit?`, `types?`, `useSessionToken?`, `signal?` | Devuelve `PlaceSuggestion[]`. Si query < 2 chars → `[]`. |
| `geocodeRetrieve(suggestionId, sessionTkn, signal?)` | Search Box v1 `/retrieve/{id}` | — | Recupera geometría exacta. Opcional (v1 ya la suele traer). |
| `geocodeReverse(loc, signal?)` | Geocoding v5 `/{lng},{lat}.json` | `loc` | `limit=1` (v5 no acepta tipos múltiples + limit). |

### 12.5 Mapeo de features
`mapSearchBoxFeature(f: SearchBoxFeature)`:
- Lee `geometry.coordinates` → `[lng, lat]`.
- `p.mapbox_id` → `id`.
- `p.name_preferred || p.name || p.place_formatted || p.full_address` → `name`.
- `p.full_address || p.place_formatted || p.address` → `address`.

---

## 13. Hooks de React

### 13.1 `useAuth()` — `hooks/useAuth.ts`
- Suscribe a `onAuthStateChanged(firebaseAuth())`.
- En cada cambio → `onSnapshot(doc(db, 'users', uid))` para perfil en vivo.
- Si perfil no existe (race en signup) → crea un user mínimo con `role: 'passenger'`.
- Expone: `{ user, isPassenger, isDriver, isAdmin }` desde `useUserStore`.

### 13.2 `useDriverGPS({ driverId, active, onError? })` — `hooks/useDriverGPS.ts`
- Solo se activa si `active && driverId`.
- 1) `Geolocation.checkPermissions()` → si `denied` → `onError`.
- 2) Si `prompt` → `Geolocation.requestPermissions()` → debe ser `granted`.
- 3) `Geolocation.watchPosition({ enableHighAccuracy: true, timeout: 10_000 })`.
- En cada update:
  - Construye `loc: {lat, lng}` + `h: heading, s: speed*3.6` (m/s → km/h).
  - **Throttle:** si distancia < `GPS_MIN_DISTANCE_M` (10m) Y tiempo < 5s → skip.
  - `setLocation(loc)` en store.
  - `writeDriverLocation(cityId, driverId, {...loc, h, s})` a RTDB.
- Cleanup: `Geolocation.clearWatch({id})`.
- Cleanup adicional: si `!active && driverId` → `writeDriverOffline(cityId, driverId)`.

### 13.3 `useTripStream(tripId)` — `hooks/useTripStream.ts`
- Si `!tripId` → no hace nada.
- Suscribe a `onSnapshot(doc(db, 'trips', tripId))` → setea `trip` (source of truth).
- Suscribe a `subscribeTripLive(cityId, tripId, ...)` → actualiza `driverLoc`, `liveStatus`, `eta`.
- Retorna: `{ trip, driverLoc, liveStatus, eta, loading, error }`.

### 13.4 `useOfflineQueue()` — `hooks/useOfflineQueue.ts`
- Zustand + `persist` middleware con storage `localStorage` (key: `yapido-m-offline-queue`).
- Estado: `queue: PendingMutation[]` con `{id, endpoint, body, headers, createdAt, retries, lastError?}`.
- Acciones: `enqueue`, `dequeue`, `markError(id, err)`, `clear`.
- `useEffect` con `window.addEventListener('online', onOnline)`:
  - Al volver online (o montar si `navigator.onLine`) → `flush()` itera la queue.
  - Para cada `m`: `fetch(m.endpoint, { method: 'POST', headers, body })` → si `ok` `dequeue`, sino `markError`.
- `submitOrQueue(endpoint, body, headers?)`:
  - Intenta `fetch` → si ok, `{queued: false, ok: true}`.
  - Si catch (network) → `enqueue` + `{queued: true, ok: false}`.

### 13.5 `useOnline()` — `hooks/useOnline.ts`
- `navigator.onLine` → `online` state.
- Listeners `window` para `online`/`offline`.
- Retorna `{ online, rtdbConnected, setRtdbConnected }` (este último preparado para `useConnectionStatus` de RTDB, aún no conectado).

### 13.6 `hooks/index.ts` — Barrel
Exporta los 5 hooks.

---

## 14. State management (Zustand + XState)

### 14.1 `store/userStore.ts` (Zustand)
```ts
interface UserStore {
  user: User | null,
  isPassenger: boolean,    // user.role === 'passenger' || 'both'
  isDriver: boolean,       // user.role === 'driver' || 'both'
  isAdmin: boolean,        // user.role === 'admin'
  setUser(u), setRole(role)
}
```
Sincronizado por `useAuth()` (en providers.tsx y useAuth.ts).

### 14.2 `store/driverStore.ts` (Zustand)
```ts
interface DriverStore {
  online: boolean,
  cityId: 'aguachica',
  vehicleType: 'moto' | 'auto' | 'auto_comfort',
  currentLocation: LatLng | null,
  pendingOffer: { tripId, fareEstimate, expiresAt } | null,
  currentTripId: string | null,
  setOnline, setCity, setVehicleType, setLocation, setOffer, setTrip
}
```

### 14.3 `store/tripMachine.ts` (XState) — Lado PASAJERO
**Estados:** `idle`, `searching`, `offered`, `accepted`, `arriving`, `inProgress`, `completed`, `rated`, `cancelled`, `noDrivers`, `error`.

**Eventos:**
- `SET_FARE_ESTIMATE {fare, eta?}` (en idle).
- `REQUEST_TRIP {trip}` (idle → searching).
- `DRIVER_FOUND {driver}` (searching → offered).
- `DRIVER_LOCATION {loc}` (offered/accepted/arriving/inProgress).
- `ETA_UPDATE {eta}`.
- `DRIVER_ARRIVED` (accepted/offered → arriving).
- `TRIP_STARTED` (arriving → inProgress; también accepted → arriving).
- `TRIP_COMPLETED {fare}` (inProgress → completed).
- `RATE_SUBMITTED` (completed → rated).
- `CANCEL {by, reason?}` (cualquiera → cancelled).
- `NO_DRIVERS` (searching → noDrivers).
- `ERROR {message}` (searching → error).
- `RESET` (→ idle con initialContext).

**Timeouts (XState `after`):**
- `offered`: 12_000ms → vuelve a `searching` con "Conductor no respondió, buscando otro...".
- `completed`: 300_000ms (5 min) → `idle` con reset.

### 14.4 `store/tripStore.ts`
Helper: `newTripMachine()` que retorna `tripMachine`. **NOTA:** `useMachine` es un hook de React, no se puede llamar fuera de componentes. Cada componente inicializa su propia instancia.

### 14.5 `store/driverMachine.ts` (XState) — Lado CONDUCTOR
**Estados:** `offline`, `online`, `offering`, `onTrip`.

**Eventos:**
- `GO_ONLINE {cityId, vehicleType, loc}` (offline → online).
- `GO_OFFLINE` (online → offline; onTrip → offline).
- `LOCATION_UPDATE {loc}`.
- `OFFER_RECEIVED {offer}` (online → offering).
- `ACCEPT_OFFER {tripId}` (offering → onTrip).
- `REJECT_OFFER` (offering → online).
- `OFFER_EXPIRED` (offering → online).
- `TRIP_ASSIGNED {tripId}`.
- `TRIP_ARRIVED`, `TRIP_STARTED` (no transicionan, marca interna).
- `TRIP_COMPLETED` (onTrip → online).
- `ERROR {message}`.

**Timeout:** `offering`: 12_000ms → vuelve a `online` con `pendingOffer: null`.

---

## 15. Componentes UI

### 15.1 `components/layout/Splash.tsx`
- `useUserStore` para mostrar.
- Estado local `show`. En mount, chequea `sessionStorage['yapido-m-splash-shown']`:
  - Si no existe → `setShow(true)` y marca `'1'`.
  - Si existe → no se muestra.
- Auto-hide: `setTimeout(() => setShow(false), 2200)`.
- UI: logo Y "Y" con animación `splash-logo splash-pulse` + texto.

### 15.2 `components/map/MapView.tsx`
Wrapper completo de Mapbox GL con:
- Props: `center`, `zoom?`, `driverLoc?`, `pickup?`, `dropoff?`, `routePolyline?`, `onMapClick?`, `interactiveCursor?`, `className?`, `style?`, `userLoc?`, `showUserLocationControl?`.
- Style default: `mapbox://styles/mapbox/light-v11`.
- Inicializa `mapboxgl.Map` con `pitchWithRotate: false`, `dragRotate: false`.
- **Markers custom (HTML elements):**
  - `buildPickupEl()` → pin verde con pulse.
  - `buildDropoffEl()` → pin oscuro con icono home.
  - `buildDriverEl()` → círculo blanco con emoji 🛵 + animación bob.
  - `buildUserEl()` → pin con pulse ring + core gradient.
- **Animación de markers** (driver + user): `lerpLatLng(start, target, t)` con `requestAnimationFrame` durante 1200-1500ms.
- **Click handler:** si `onMapClick` → `map.on('click', e => onMapClick({lat, lng}))`.
- **Cursor crosshair** si `interactiveCursor`.
- **GeolocateControl** nativo de Mapbox (top-right) si `showUserLocationControl`.
- **Route polyline:** decodifica con `decodePolyline(str, precision=5)` (algoritmo estándar de Google polyline) y dibuja dos capas:
  - `route-shadow`: línea negra 9px con blur 6, opacity 0.15.
  - `route`: línea verde `#00b871` 5px, opacity 0.95.
- Limpieza: `marker.remove()` + `map.remove()` en cleanup.

### 15.3 `components/shared/Button.tsx`
- `forwardRef<HTMLButtonElement, ButtonProps>`.
- Props: `variant: 'primary' | 'secondary' | 'ghost' | 'destructive'`, `size: 'sm' | 'md' | 'lg'`, `loading?`, `fullWidth?`, `leftIcon?`, `rightIcon?`.
- Classes: combinadas con `cn` (clsx + twMerge).
- `loading` muestra `<Loader2 className="animate-spin" />` en lugar de leftIcon.

### 15.4 `components/shared/Input.tsx`
- `forwardRef<HTMLInputElement, InputHTMLAttributes>`.
- Aplica estilos de la clase `.input` de globals.css (más extras via cn).

### 15.5 `components/shared/Loading.tsx`
- Spinner SVG doble (círculo externo con `border-primary/20`, interno con `border-t-primary animate-spin`).
- Props: `label?`, `className?`.

### 15.6 `components/shared/Rating.tsx`
- `<Star className="text-amber-500 fill-amber-500" />` + número con 1 decimal.
- Props: `score: number`, `size: 'sm' | 'md' | 'lg'` (14/16/20px).

### 15.7 `components/trip/StatusPill.tsx`
- Recibe `status: string` y devuelve un pill con label + color tone:
  - `searching`/`offered` → amber "Buscando"/"Ofreciendo".
  - `accepted`/`arriving` → blue "Aceptado"/"Conductor llegando".
  - `in_progress` → primary "En viaje".
  - `completed`/`rated` → emerald "Finalizado"/"Calificado".
  - `cancelled` → slate.
  - `no_drivers` → red.
  - Default: `bg-slate-200`.

### 15.8 Barrels
- `components/shared/index.ts` → Button, Input, Loading, Rating.
- `components/map/index.ts` → MapView, StatusPill.

---

## 16. Pantallas (rutas Next.js)

### 16.1 `app/layout.tsx` (RootLayout)
- `lang="es-CO"`, theme-color `#f8fafc`.
- Carga `mapbox-gl.css` + `mapbox-gl-directions.css` desde CDN.
- Meta `manifest: '/m-static/manifest.json'`.
- Viewport: `width=device-width, initialScale: 1, maximumScale: 1, userScalable: false` (PWA-like).
- Estructura: `<FirebaseBootstrap><AuthProvider><Splash>{children}</Splash></AuthProvider></FirebaseBootstrap>`.

### 16.2 `app/page.tsx` (Hub de rol)
- Si `!user` → `<LandingPreAuth />` con logo, hero "Tu viaje en moto o auto, en minutos", features chips (Rápido/Seguro/Confiable), CTA "Empezar ahora" → `/auth`.
- Si `user`:
  - Header con saludo personalizado (`user.displayName.split(' ')[0]`).
  - `<RoleCard>` para pasajero (`/passenger/home`) — solo si `isPassenger`.
  - `<RoleCard>` para conductor (`/driver/home`) — solo si `isDriver`.
  - Footer con 3 `MiniStat`: "3 min" Llega, "24/7" Seguro, "Aguachica" Cobertura.
- **Aurora background** con 3 blur-glows (primary, violet, emerald).
- Link "¿Eres conductor? Regístrate aquí" → `/auth?role=driver`.

### 16.3 `app/providers.tsx` (AuthProvider)
- `onAuthStateChanged(firebaseAuth())`:
  - Si no hay user → `setUser(null)`, `setReady(true)`.
  - Si hay user → `getDoc(doc(db, 'users', uid))`:
    - Si existe → `setUser({uid, ...data})`.
    - Si no existe (race) → user mínimo con `role: 'passenger'`, `citiesActive: []`.
  - En `catch` → `setUser(null)`.
  - `setReady(true)`.
- Mientras `!ready` muestra "Cargando Yapido..." con pulse.

### 16.4 `app/bootstrap.tsx` (FirebaseBootstrap)
- `useEffect` que llama `firebaseApp()` para inicializar en cliente.
- Wrapper passthrough de `children`.

### 16.5 `app/api/health/route.ts`
- `GET()` → `Response.json({ok: true, app: 'yapido-movilidad', ts: Date.now()})`.

### 16.6 `app/auth/page.tsx`
- Botón "Ingresar con Google" con SVG del logo Google.
- `signInWithPopup(firebaseAuth(), new GoogleAuthProvider())`:
  - `setDoc(doc(db, 'users', uid), {uid, email, displayName, photoURL, role: 'passenger', fcmTokens: [], status: 'active', locale: 'es-CO', citiesActive: ['aguachica'], createdAt, updatedAt}, {merge: true})`.
  - `router.push('/')`.
- Muestra errores con `setError`.

### 16.7 `app/passenger/home/page.tsx`
- Mapa full-screen con `MapView` (center, userLoc, pickup).
- `navigator.geolocation.watchPosition` → guarda `userLoc`, inicializa `pickup` la primera vez.
- Top bar glassmorphism: avatar + saludo + botones a `/passenger/history` y `/passenger/profile`.
- Banner offline si `!online`.
- Botón flotante `recenter` (mueve pickup a userLoc).
- Bottom sheet con:
  - "¿A dónde vamos?" + dirección.
  - Search bar (Link a `/passenger/home/search?pickup=lat,lng&pickupAddress=...`).
  - 4 quick places (Mi casa/Mi trabajo/Parque/Hospital).
  - 3 stats (Llega 3 min, Conductores activos, Rating 4.8).
- Greeting dinámico: Buenos días/tardes/noches según hora.

### 16.8 `app/passenger/home/search/page.tsx`
- Lee `pickup`, `pickupAddress`, `quickPlace` de searchParams.
- Top: search bar + banner "Toca el mapa para fijar el destino".
- Selector de tipo (Moto/Auto/Auto Comfort) glassmorphism.
- Bottom sheet scrollable:
  - Si `query` → lista de `results` de Mapbox (debounce 280ms).
  - Si no hay query → recents (localStorage key `yapido_recent_searches_v1`) + 5 QUICK_FALLBACK.
  - Footer con `estimate.fare` + `formatDistance` + `formatDuration` + botón "Continuar".
- `handleSelect(place)`:
  - Llama `apiFareEstimate({type, pickup, dropoff: place.loc, cityId: 'aguachica'})`.
  - Setea `estimate`.
- `handleMapTap(loc)`:
  - `geocodeReverse(loc)` → `place`.
  - Si falla → fallback con lat/lng como address.
- `goConfirm()`:
  - `saveRecent(place)` (localStorage).
  - `router.push('/passenger/home/confirm?...')`.

### 16.9 `app/passenger/home/confirm/page.tsx`
- Lee `pickup`, `dropoff`, `pickupAddress`, `dropoffAddress`, `dropoffName`, `type` de searchParams.
- Mapa con pickup + dropoff.
- Card con destino (fila 1) + origen (fila 2).
- Grid 3 columnas: tipo de vehículo (Moto/Auto/Comfort) con ETA preestablecido.
- Grid 3 columnas: método de pago (Efectivo/Tarjeta/PSE).
- Input de notas (max 280).
- Re-estimación con `apiFareEstimate` cuando cambia `type`.
- `handleConfirm()`:
  - `apiCreateTrip({requestId: uuid(), type, pickup, dropoff, paymentMethod, notes})`.
  - `router.push('/passenger/trip/{tripId}')`.

### 16.10 `app/passenger/trip/[id]/page.tsx`
- Lee `tripId` de `useParams`.
- `useMachine(tripMachine)` + `useTripStream(tripId)`.
- **Hidrata la state machine** según `trip.status`:
  - `searching` + idle → `REQUEST_TRIP`.
  - `accepted`/`arriving` → `DRIVER_FOUND` + `TRIP_STARTED` + (si arriving) `DRIVER_ARRIVED`.
  - `in_progress` → `DRIVER_FOUND` + `TRIP_STARTED` + `DRIVER_ARRIVED` + `TRIP_STARTED`.
  - `completed` → `DRIVER_FOUND` + `TRIP_COMPLETED`.
  - `cancelled` → `CANCEL` (by: 'system').
  - `no_drivers` → `NO_DRIVERS`.
- `useEffect` empuja `DRIVER_LOCATION` cuando llega `driverLoc`.
- `useEffect` empuja `ETA_UPDATE` cuando llega `eta`.
- Vista condicional según estado:
  - `searching` → `<SearchingCard eta={eta} />`.
  - `offered`/`accepted` → `<DriverCard driver statusText="Va en camino" eta={eta} />`.
  - `arriving` → `<DriverArrivedCard driver />`.
  - `inProgress` → `<InProgressCard driver fare />`.
  - `cancelled` → `<CenteredMessage title="Viaje cancelado" />`.
  - `noDrivers` → `<CenteredMessage title="No encontramos conductores" />`.
  - `completed`/`rated` → `<RatingScreen tripId fare onSubmitted />`.
- Botón "Cancelar" (X) en top: `apiCancelTrip(tripId, {requestId, reason: 'passenger_changed_mind'})` + send CANCEL.
- `<RatingScreen>`: 5 estrellas + input comentario + 4 botones de propina (0/$2.000/$5.000/$10.000) + "Total cobrado: $X" + botón Enviar.

### 16.11 `app/passenger/history/page.tsx`
- Query Firestore: `trips` where `passenger.uid == user.uid`, orderBy `timeline.requestedAt desc`, limit 30.
- Lista de cards: destino, status pill, fecha, fare total.
- Click → `/passenger/trip/{tripId}`.

### 16.12 `app/passenger/profile/page.tsx`
- Card con avatar + displayName + phone/email.
- Lista de items (Métodos de pago, Direcciones, Ayuda, Términos).
- Botón "Cerrar sesión": `signOut(firebaseAuth())` + `setUser(null)` + `router.push('/m')`.

### 16.13 `app/driver/onboarding/page.tsx`
- 3 pasos: `personal` → `vehicle` → `docs`.
- **Personal:** nombre + celular → siguiente.
- **Vehicle:** tipo (moto/auto/auto_comfort) + placa + año + marca + modelo + color.
- **Docs:** ccFront + ccBack + license + selfie (File inputs con `accept="image/*" capture="environment"`).
- **Submit:** sube archivos a Storage `users/{uid}/driver_onboarding/...` con `uploadBytes` + `getDownloadURL`.
- Crea 3 docs: `driver_profiles/{uid}` (status `pending_docs`), `driver_vehicles/{vehicleId}`, `driver_documents/{uid}` (status `pending`).
- `setDoc(users/{uid}, {role: 'driver', ...}, {merge: true})` + `setUser({...user, role: 'driver'})`.
- `router.push('/driver/home')`.

### 16.14 `app/driver/home/page.tsx`
- Carga `driver_profiles/{user.uid}` al montar. Si no existe → CTA "Registrarme como conductor".
- Si `profile.status !== 'approved'` → "Tu cuenta está en revisión".
- `useDriverGPS({driverId, active: online})`.
- `useEffect` cuando `online`: suscribe a `subscribeDriverOffer(user.uid, ...)` → guarda `pendingOffer` en store.
- `useEffect`: `navigator.geolocation.watchPosition` → actualiza `center` y `currentLocation` (si online).
- **toggleOnline():**
  - Llama `apiSetOnline({requestId, online, cityId, loc})`.
  - `setOnline(next)`.
- **handleAccept():** `apiAcceptOffer(offer.tripId, {requestId, offerId})` + `clearDriverOffer` + `setTrip` + `router.push('/driver/trip/{tripId}')`.
- **handleReject():** `clearDriverOffer` + `setOffer(null)`.
- **UI:**
  - Top bar con rating + totalTrips + botón Wallet → `/driver/earnings`.
  - Bottom panel con:
    - Selector de tipo de vehículo (deshabilitado si online).
    - Toggle grande online/offline (verde esmeralda si online).
  - **Modal de oferta (si `pendingOffer`):** `Countdown` de 12s + botones Rechazar/Aceptar.

### 16.15 `app/driver/trip/[id]/page.tsx`
- 3 phases internas: `arriving`, `waiting`, `inProgress`.
- `useDriverGPS({active: true})` siempre.
- `onSnapshot(doc(db, 'trips', tripId))` → `trip`.
- `setInterval` cada 3s → calcula distancia al pickup con `haversineMeters`.
- **onArrived:** `writeTripStatus(cityId, tripId, 'arriving')` + `setPhase('waiting')` + `setWaitingSince(Date.now())`.
- **onStartTrip:** `apiStartTrip(tripId, {requestId})` + `writeTripStatus(cityId, tripId, 'in_progress')` + `setPhase('inProgress')`.
- **onComplete:** `apiCompleteTrip(tripId, {requestId})` + `router.push('/driver/trip/done')`.
- **onCancel:** confirmación + `router.push('/driver/home')`.
- **UI:**
  - Top bar: `Navigation` icon + "Ir al pickup" o "Llevar a destino" + distancia.
  - Bottom panel:
    - Avatar pasajero + nombre + rating + botones phone/chat.
    - Cards de pickup (verde) + dropoff (foreground).
    - Phase `arriving` → botón "Ya llegué al pickup".
    - Phase `waiting` → `<WaitingTimer since={waitingSince} />` (3 min en amber) + botón "Iniciar viaje".
    - Phase `inProgress` → total estimado + botón "Completar viaje".

### 16.16 `app/driver/trip/done/page.tsx`
- Pantalla de éxito con `CheckCircle2` verde.
- (Nota: el `fare` state está declarado pero no se popula — falta leer del trip completado).
- Botones "Ver ganancias" (`/driver/earnings`) y "Listo" (`/driver/home`).

### 16.17 `app/driver/earnings/page.tsx`
- Query: `trips` where `driver.uid == user.uid` AND `status in ('completed', 'rated')`, orderBy `timeline.completedAt desc`, limit 50.
- Calcula:
  - `today` = suma `driverEarning` de viajes con `completedAt` después de medianoche.
  - `week` = suma `driverEarning` de los últimos 7 días.
  - `tripsCount` = total.
- 2 cards: "Hoy" y "7 días" con `formatCOP`.
- Botón "Retirar a mi banco" (no implementado, solo UI).
- Lista de últimos 20 viajes con destino + fecha + earning.

---

## 17. Cloud Functions (backend)

📁 `functions/src/` — Node 20 ESM, TypeScript estricto.

### 17.1 `index.ts` — Barrel
Re-exporta los 8 handlers. Importa con extensión `.js` (ESM).

### 17.2 `types.ts` — Tipos servidor
- `LatLng`, `VehicleType`, `TripStatus` (espejo de constants.ts pero sin Zod).
- `City`, `CityPricing` (replica la estructura de Firestore).
- `TripDoc` (snapshot completo del doc de trip).

### 17.3 `handlers/createTrip.ts` — `onCall`
1. Auth check.
2. **Idempotencia:** query trips where `passenger.uid == uid` AND `payment.requestId == input.requestId` → si existe, devolverlo.
3. Carga `cities/{cityId}` (default `aguachica`).
4. Carga `users/{uid}` (pasajero).
5. `estimateDistanceDuration(pickup, dropoff)` (haversine + 25 km/h).
6. `computeFare({city, type, distanceMeters, durationSeconds})`.
7. Crea trip con `uuidv4()` como `tripId`, status `searching`, timeline con `requestedAt: Timestamp.now()`.
8. **Mirror en RTDB:** `cities/{cityId}/trip_search/{geo6}/{tripId}` con `pickup`, `type`, `requestedAt`.
9. Retorna `{ tripId, status, fare: {total, currency, surge}, eta: seconds }`.

Helper `getUserCity(db, uid)` → `passenger_profiles/{uid}.defaultCityId` o `aguachica`.

### 17.4 `handlers/onTripCreated.ts` — `onDocumentCreated('trips/{tripId}')`
Trigger cuando se crea un trip. Si `status !== 'searching'` → return.
1. Carga `cities/{trip.cityId}`.
2. Lee `cities/{cityId}/drivers_online` de RTDB.
3. Filtra candidatos: `status === 'online' && vehicleType === trip.type`. Construye `DriverCandidate[]` con `id, loc, ratingAvg, acceptRate30d, vehicleType, idleMinutes`.
4. `rankDrivers(candidates, pickup, type, city)` → `RankedDriver[]` ordenados por score desc, top 5.
5. **Cascada de ofertas** (`for` loop):
   - Genera `offerId = uuidv4()`, `expiresAt = Date.now() + getOfferTimeoutMs(city)` (12s Aguachica, 8s ciudades grandes).
   - Escribe oferta RTDB: `cities/{cityId}/offers/{driverId}/current`.
   - `FieldValue.arrayUnion` en `offerLog`.
   - FCM al primer token del conductor (si existe) con título "Nuevo viaje cerca", body `${formatCOP(fare.total)} • ${distance.toFixed(1)} km`, data `{tripId, offerId, type: 'new_offer'}`.
   - `waitForAccept(rtdb, tripId, driverId, offerTimeout)`:
     - Suscribe a `trips/{tripId}/acceptances/{driverId}`.
     - Si `status === 'accepted'` → resolve(true).
     - Timeout → resolve(false).
     - Safety timeout adicional: `setTimeout(... timeoutMs + 1000)`.
   - Si aceptado → log + return.
   - Si no → `rtdb.ref('cities/{cityId}/offers/{driverId}/current').remove()`.
6. Si nadie acepta → `snap.ref.update({status: 'no_drivers'})`.

### 17.5 `handlers/acceptOffer.ts` — `onCall`
Input: `{requestId, offerId, tripId}`. `driverId = req.auth.uid`.
**Transacción atómica Firestore:**
- Si `status !== 'searching' && status !== 'offered'` → `failed-precondition`.
- Si ya tiene `driver` → `failed-precondition`.
- Carga `driver_profiles/{driverId}`: si no existe o `status !== 'approved'` → error.
- Carga `driver_vehicles/{driver.vehicleId}` (si existe).
- Update con: `status: 'accepted'`, `driver: {uid, displayName, photoURL, rating, phone, plate, vehicleDesc}`, `timeline.matchedAt ?? Timestamp.now()`, `timeline.acceptedAt: Timestamp.now()`.
- **Bug menor:** `rtdb.ref(`cities/${result.driver?.uid ? tripRef.parent.parent?.id : ''}/offers/${driverId}/current`).remove()` — el `cityId` queda vacío si el conductor no tiene uid (raro). Probablemente debería usar `trip.cityId` directamente.
- Retorna `{ok: true}`.

### 17.6 `handlers/cancelTrip.ts` — `onCall`
Input: `{requestId, tripId, reason}`. Verifica que `uid` sea pasajero o conductor del trip.
Si `status in ('completed', 'rated', 'cancelled')` → `failed-precondition`.
Update: `status: 'cancelled'`, `timeline.cancelledAt: Timestamp.now()`, `cancelledBy: 'passenger' | 'driver'`, `cancelReason: reason`.

### 17.7 `handlers/handlers/completeTrip.ts` — `onCall`
Input: `{requestId, finalLocation?, waitSeconds?}`.
Solo el conductor asignado puede llamar.
1. Carga trip. Si `status not in ('in_progress', 'accepted', 'arriving')` → error.
2. Recalcula fare con `computeFare` usando `Date.now() - timeline.startedAt` como `durationSeconds` y `waitSeconds`.
3. Update: `status: 'completed'`, `fare`, `timeline.completedAt: Timestamp.now()`.
4. Crea `payments` doc:
   - `tripId, driverId, passengerId`.
   - `amount: fare.total, driverEarning, platformFee, tip: 0`.
   - `method: trip.payment.method`.
   - `status: trip.payment.method === 'cash' ? 'paid' : 'pending'`.
   - `wompiTransactionId: null, settledAt: null`.
5. Retorna `{ok: true, fare}`.

### 17.8 `handlers/rateTrip.ts` — `onCall`
Input: `{requestId, tripId, score, tags?, comment?, tip?}`.
1. Carga trip. Si `status !== 'completed'` → error.
2. Solo pasajero o conductor del trip pueden calificar.
3. Crea `ratings/{tripId}` con `{tripId, from: 'passenger' | 'driver', toUid, score, tags, comment, createdAt}`.
4. **Actualiza rating promedio del target** (transacción):
   - `targetCol = isPassenger ? 'driver_profiles' : 'passenger_profiles'`.
   - `newCount = (ratingCount ?? 0) + 1`.
   - `newAvg = ((ratingAvg * ratingCount) + score) / newCount`.
5. Update trip: `status: 'rated'`, `fare.tip: tip`, `timeline.ratedAt: Timestamp.now()`.
6. Si `tip > 0 && trip.driver` → update `payments` con tip.

### 17.9 `handlers/fareEstimate.ts` — `onCall`
Input: `{type, pickup, dropoff, cityId?}` (default `aguachica`).
- Auth check, carga ciudad.
- `estimateDistanceDuration(pickup, dropoff)`.
- `computeFare({city, type, distanceMeters, durationSeconds})`.
- Retorna `{fare, distanceMeters, durationSeconds, surge}`.

### 17.10 `handlers/setOnline.ts` — `onCall`
Input: `{requestId, online, cityId, loc}`.
1. Auth check. `driverId = req.auth.uid`.
2. Verifica `driver_profiles/{driverId}.status === 'approved'`.
3. Si `online`:
   - `vehicleType = profile.vehicleType ?? 'moto'`.
   - `geo6 = encodeGeohash(loc, 6)`.
   - `set` en RTDB: `cities/{cityId}/drivers_online/{driverId}` con `{driverId, status: 'online', vehicleType, loc: {...loc, ts: Date.now()}, geo6, ratingAvg, acceptRate30d, updatedAt}`.
   - Update profile: `{online: true, currentCityId, currentLocation, currentGeohash6}`.
4. Si `!online`:
   - `remove` de RTDB.
   - Update profile: `{online: false}`.

### 17.11 `lib/fare.ts`
**`computeFare({city, type, distanceMeters, durationSeconds, waitSeconds?, surge?, tolls?, tip?})`:**
- `pricing = city.pricing[type]`.
- `km = distanceMeters/1000`, `min = durationSeconds/60`.
- `wait = (waitSeconds/60) * pricing.waitingFeePerMin`.
- `distanceFare = km * pricing.perKm`.
- `timeFare = min * pricing.perMin`.
- `total = base + distanceFare + timeFare + wait + tolls`.
- Si `surge.enabled && surge > 1` → `total *= surge` (clamped a `surge.max`).
- `total = max(total, minFare)`, redondeado a 100 COP.
- `platformFee = round(total * commissionPct)`.
- `driverEarning = total - platformFee`.
- Retorna `FareBreakdown`.

**`estimateDistanceDuration(pickup, dropoff)`:**
- Haversine → km → segundos a 25 km/h.
- Retorna `{meters, seconds}`.

### 17.12 `lib/geo.ts`
- `haversineKm(a, b)` — haversine en km.
- `encodeGeohash(loc, precision=6)` — geohash con ngeohash.
- `geohashNeighbors(hash)` — 8 vecinos.
- `geohash9(loc, precision=6)` — centro + 8 vecinos.
- `bearing(from, to)` — rumbo 0-360.

### 17.13 `lib/matching.ts`
**`rankDrivers(candidates, pickup, type, city): RankedDriver[]`:**
- `isSmallCity = (city.population ?? 200_000) < 200_000`.
- `maxKm = isSmallCity ? 8 : 5`.
- `distWeight = isSmallCity ? 0.65 : 0.50`.
- `idleThreshold = isSmallCity ? 3 : 5`, `idleBonus = 0.15`.
- Score: `distWeight * distScore + 0.20 * ratingScore + 0.10 * acceptScore + bonus`.
  - `distScore = max(0, 1 - distance/maxKm)`.
  - `ratingScore = max(0, (ratingAvg - 4)/1)`.
  - `acceptScore = acceptRate30d`.
  - `bonus = idleMinutes > threshold ? 0.15 : 0`.
- Filtra `distance < maxKm && score > 0.3`, sort desc, slice 5.

**`getOfferTimeoutMs(city)`:**
- Small city → 12_000ms, large → 8_000ms.

---

## 18. Reglas de seguridad

### 18.1 `firestore.rules` (rules_version 2)
| Path | Read | Write |
|---|---|---|
| `users/{uid}` | isSignedIn | create: isSelf; update: isSelf + diffKeys ⊆ {displayName, photoURL, phone, fcmTokens, updatedAt, locale}; delete: isAdmin |
| `admins/{uid}` | isSignedIn | false (solo admin SDK) |
| `passenger_profiles/{uid}` | isSelf | isSelf |
| `driver_profiles/{uid}` | isSignedIn | create: isSelf; update: isSelf + diffKeys ⊆ {online, currentLocation, currentGeohash6, currentCityId, updatedAt, flaggedAt}; delete: isAdmin |
| `driver_vehicles/{vehicleId}` | isSignedIn | isSelf(resource.data.driverId) || isAdmin |
| `driver_documents/{uid}` | isSelf(uid) \|\| isAdmin | create: isSelf; update: isAdmin |
| `cities/{cityId}` | true (público) | isAdmin |
| `trips/{tripId}` | isSignedIn && (uid == passenger.uid \|\| uid == driver.uid \|\| isAdmin) | create: isSignedIn && uid == request.resource.data.passenger.uid && status == 'searching'; update: passenger.uid o driver.uid; delete: isAdmin |
| `ratings/{tripId}` | isSignedIn | create: isSignedIn && uid in [passenger.uid, driver.uid] |
| `payments/{id}` | isSignedIn && (uid == driverId \|\| uid == passengerId \|\| isAdmin) | isAdmin (solo cloud fns) |
| `payouts/{id}` | isSignedIn && uid == driverId | isAdmin |
| `fare_estimates/{id}` | true | isAdmin |
| `promo_codes/{code}` | isSignedIn | isAdmin |

**Helpers:**
- `isSignedIn()`, `isSelf(uid)`, `isAdmin()` (chequea `admins/{uid}` exists), `isDriverCity(uid, cityId)`.

### 18.2 `rtdb.rules.json`
Estructura `cities/{cityId}/...`:
- **`drivers_online/{driverId}`**:
  - `.read`: `auth != null`.
  - `.write`: `auth != null && auth.uid === $driverId && (no existía OR driverId.val() === auth.uid)`.
  - `.validate`: `hasChildren(['loc','geo6','vehicleType','status','updatedAt'])`.
  - Subvalidaciones: `loc.{lat: -90..90, lng: -180..180, ts: number}`, `geo6: 6 chars`, `vehicleType: string`, `status: 'online'|'on_trip'|'offline'`, `updatedAt: number`, `driverId: === auth.uid`.
- **`trips_live/{tripId}`**:
  - `.read`: `auth != null && (passengerId === auth.uid || driverId === auth.uid)`.
  - `$other.{read,write}: false` (solo campos específicos).
  - `driverId: .write` solo si `=== auth.uid`.
  - `passengerId: .write` solo si `=== auth.uid`.
  - `driverLoc: .write` solo si `driverId === auth.uid`.
  - `status, eta: .write` si auth.
- **`offers/{driverId}/current`**: read/write solo si `auth.uid === $driverId`.

### 18.3 `storage.rules`
- `users/{uid}/{allPaths=**}`: read si auth; write si isOwner + size < 8MB + contentType `image/*` o `application/pdf`.
- `trips/{tripId}/{allPaths=**}`: read si auth; write si auth + el trip existe en Firestore + uid == passenger.uid o driver.uid + size < 8MB + contentType `image/*`.

---

## 19. Índices de Firestore

📁 `firestore.indexes.json` (8 índices):
1. `trips`: `passenger.uid` ASC + `timeline.requestedAt` DESC.
2. `trips`: `driver.uid` ASC + `timeline.requestedAt` DESC.
3. `trips`: `cityId` ASC + `status` ASC + `timeline.requestedAt` DESC.
4. `trips`: `status` ASC + `timeline.requestedAt` DESC.
5. `driver_profiles`: `status` ASC + `currentCityId` ASC + `currentGeohash6` ASC.
6. `driver_profiles`: `currentCityId` ASC + `status` ASC.
7. `fare_estimates`: `pickupGeohash6` ASC + `dropoffGeohash6` ASC + `type` ASC.
8. `ratings`: `toUid` ASC + `createdAt` DESC.

---

## 20. Scripts de seed y dev

### 20.1 `scripts/seed-aguachica.ts`
Inicializa `firebase-admin` con `cert` desde env vars (o sin credenciales en emulador).
Crea/mergea `cities/aguachica`:
- `displayName: 'Aguachica'`, `region: 'cesar'`, `country: 'CO'`.
- `centerLat: 8.3127, centerLng: -73.6218` (centro de Aguachica).
- `population: 102_000`.
- `serviceArea` y `geofence`: polígono simplificado con 4 puntos.
- **Pricing moto:** base `3500` + `perKm 900` + `perMin 150`, minFare `5000`, commissionPct `0.0` (lanzamiento), waitingFeePerMin `200`.
- **Pricing auto:** base `4500` + `perKm 1400` + `perMin 200`, minFare `7000`, commissionPct `0.0`.
- **Pricing auto_comfort:** base `6500` + `perKm 1900` + `perMin 280`, minFare `10000`, commissionPct `0.0`.
- `surge: { enabled: false, max: 1.5 }`.
- `status: 'launching'`, `launchedAt: null`.
- Soporte: `+57 300 000 0000`.

### 20.2 `scripts/seed-dev.ts`
Crea 4 conductores + 1 pasajero fake con Auth + Firestore:
- **Conductores** (`test-driver-1..4`):
  - 2 motos: Juan Pérez (ABC123, Yamaha FZ 150) + Carlos Ramírez (DEF456, Honda CB 125).
  - 2 autos: Miguel Hernández (GHI789, Renault Logan) + Andrés López (JKL012, Chevrolet Onix).
  - `driver_profiles`: status `approved`, ratingAvg `4.8`, ratingCount `32`, acceptRate30d `0.9`.
  - `driver_vehicles`: capacity 1 (moto) o 4 (auto), year 2020, SOAT/insurance expiran +365 días.
  - `driver_documents`: status `approved`.
- **Pasajero** (`test-passenger-1`): María González.

Mensaje final: "Login en emulador: Pasajero +57 300 200 0001 → cualquier OTP / Conductor +57 300 100 0001 → cualquier OTP".

### 20.3 `scripts/dev-all.bat` (Windows)
1. `start "Firebase Emulators" cmd /k "npx firebase emulators:start --only auth,firestore,functions,storage"`.
2. `timeout /t 5`.
3. Setea env vars: `NEXT_PUBLIC_USE_EMULATOR=true`, `FIRESTORE_EMULATOR_HOST`, `FIREBASE_AUTH_EMULATOR_HOST`, `FIREBASE_STORAGE_EMULATOR_HOST`.
4. `npx next dev -p 9005`.

### 20.4 `scripts/dev-all.sh` (Linux/mac)
Equivalente al .bat con `&` y `trap kill`.

---

## 21. Flujos end-to-end

### 21.1 Flujo pasajero
```
[Landing /] → [Auth /auth] → [Hub /] → [Home /passenger/home]
  ↓ tap "¿A dónde vamos?"
[Search /passenger/home/search]
  ↓ autocomplete Mapbox o tap en mapa
[Confirm /passenger/home/confirm]
  ↓ elegir tipo + pago + "Pedir viaje"
  → apiCreateTrip → Firestore trips/{id} + RTDB trip_search
  → onTripCreated trigger: matchTrip
[Trip /passenger/trip/{id}]
  ↓ states: searching → offered → accepted → arriving → inProgress
  ↓ useTripStream snapshot + RTDB live
[completed] → RatingScreen → [Home]
```

### 21.2 Flujo conductor
```
[Landing /] → [Auth /auth] → [Hub /]
  ↓ si isDriver && !profile → [Onboarding /driver/onboarding]
  ↓ 3 pasos + upload
[Home /driver/home]
  ↓ toggle online
  ↓ useDriverGPS activo + subscribeDriverOffer
  ↓ llega oferta (FCM + RTDB listener)
  ↓ modal con countdown 12s
  ↓ Aceptar
[Trip /driver/trip/{id}]
  ↓ arriving → waiting → inProgress
  ↓ useDriverGPS siempre activo
  ↓ "Completar viaje"
[Done /driver/trip/done] → [Earnings /driver/earnings]
```

### 21.3 Flujo de matching (backend)
```
createTrip (HTTP) → trips/{id} status='searching'
  + RTDB cities/{cityId}/trip_search/{geo6}/{id}
  ↓ trigger
onTripCreated
  ↓ carga drivers_online de RTDB
  ↓ rankDrivers (score: dist, rating, accept, idle)
  ↓ top 5
  ↓ for each:
      → RTDB offers/{driverId}/current
      → FCM push
      → waitForAccept (suscripción RTDB acceptances)
    si nadie acepta → status='no_drivers'
```

---

## 22. Pricing y comisiones

### 22.1 Pricing Aguachica (lanzamiento)
| Vehículo | Base | /km | /min | Mínimo | Comisión |
|---|---|---|---|---|---|
| **Moto** | $3.500 | $900 | $150 | $5.000 | **0%** |
| **Auto** | $4.500 | $1.400 | $200 | $7.000 | **0%** |
| **Auto Comfort** | $6.500 | $1.900 | $280 | $10.000 | **0%** |

- **Surge desactivado** (`enabled: false`) en lanzamiento.
- **Tarifa de espera:** $200/min (moto/auto), $250/min (comfort).
- **Redondeo:** a $100 COP.
- **Comisión post-lanzamiento:** 20% (DEFAULT_COMMISSION_PCT).
- **Launch weeks:** 4 (después vuelve a 20%).

### 22.2 Cálculo (Cloud Function `computeFare`)
1. `wait = (waitSeconds/60) * waitingFeePerMin`.
2. `distanceFare = km * perKm`.
3. `timeFare = min * perMin`.
4. `total = base + distanceFare + timeFare + wait + tolls`.
5. Si surge activo: `total *= surge` (clamped a `max`).
6. `total = max(total, minFare)`, redondeo a 100.
7. `platformFee = round(total * commissionPct)`.
8. `driverEarning = total - platformFee`.

### 22.3 Velocidad estimada
- `estimateDistanceDuration` usa **25 km/h** (promedio urbano ciudad pequeña).

---

## 23. Multi-ciudad y particionado RTDB

### 23.1 Principios
1. **Todo registro lleva `cityId`** desde la primera escritura.
2. **Config regional** aislada en `cities/{cityId}`.
3. Usuarios cross-city, **viajes single-city**.
4. **Matching siempre dentro de la misma ciudad** — un conductor en Aguachica jamás recibe ofertas de Valledupar.
5. Funciones serverless regionalizadas cerca de la ciudad (reducir latencia).

### 23.2 Particionado RTDB
```
cities/{cityId}/
  drivers_online/{driverId}/     ← matching nunca cruza ciudades
  trips_live/{tripId}/           ← live data del viaje
  offers/{driverId}/current      ← oferta activa
  trip_search/{geo6}/{tripId}/   ← mirror para matching
```

### 23.3 Adaptación por tamaño de ciudad
En `lib/matching.ts`:
- **isSmallCity** (population < 200k):
  - `maxKm = 8` (radio de búsqueda más amplio).
  - `distWeight = 0.65` (más peso a distancia).
  - `idleThreshold = 3 min` (bonifica inactivos rápido).
- **isLargeCity**:
  - `maxKm = 5`, `distWeight = 0.50`, `idleThreshold = 5 min`.
- **Offer timeout:** 12s (small) vs 8s (large).

---

## 24. Workflows de desarrollo y deploy

### 24.1 Setup local (primera vez)
```bash
cd conductor
npm install
cp .env.example .env.local
# Completar NEXT_PUBLIC_FIREBASE_* y NEXT_PUBLIC_MAPBOX_TOKEN
# (Opcional) FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY para admin SDK
```

### 24.2 Dev con emuladores
```bash
# Opción A (Linux/mac):
npm run dev:emu

# Opción B (Windows):
scripts\dev-all.bat

# Opción C (manual):
npm run emu   # en una terminal
npm run dev   # en otra
```

### 24.3 Seed de datos
```bash
npm run seed:aguachica   # crea cities/aguachica
npm run seed:dev         # crea 4 conductores + 1 pasajero fake
```

### 24.4 Build estático (Capacitor)
```bash
npm run build:static       # genera /out
npm run capacitor:sync     # copia a android/
npm run capacitor:open     # abre Android Studio
```

### 24.5 Deploy a producción
```bash
npm run deploy:rules      # firestore + rtdb + storage
npm run deploy:functions  # cloud functions
npm run deploy:all        # todo
```

### 24.6 Verificación
```bash
npm run typecheck         # tsc --noEmit
npm run lint              # next lint
npm run test              # vitest run
```

---

## 25. Convenciones del equipo

1. **Consultar `MEMORY.md` (este archivo) + `AGENTS.md` antes de modificar cualquier archivo.**
2. **Toda mutación crítica lleva `requestId` (uuid v4)** para idempotencia.
3. **Schemas Zod van en `lib/contracts/`** y se importan desde Cloud Functions también.
4. **Estados de viaje:** usar la state machine (`tripMachine`/`driverMachine`). No agregar estados ad-hoc.
5. **GPS:** nunca escribir a RTDB sin filtrar `distancia > 10m` O `tiempo > 5s`.
6. **Commits:** `feat(m):`, `fix(m):`, `chore(m):`, `docs(m):` (prefijo `(m)` para esta zona).
7. **PRs con:** capturas de pantalla + descripción de impacto en el modelo de datos.
8. **Aliases:** usar `@/*` para imports absolutos.
9. **NO usar `localStorage` para datos sensibles** (token, ubicación).
10. **NO escribir GPS a Firestore directo** → siempre a RTDB.
11. **NO desplegar Cloud Functions sin `requestId`** en mutaciones.
12. **NO usar `getDocs` en el flujo de viaje** (lento) → listeners RTDB o queries indexadas.
13. **NO hardcodear API keys** → siempre `process.env.NEXT_PUBLIC_*` o Secret Manager.
14. **NO usar Tailwind dark:** el proyecto es light-only por ahora (variable `.dark` existe pero no se activa).

---

## 26. Decisiones arquitectónicas clave

| Tema | Decisión | Razón |
|---|---|---|
| **Tracking** | RTDB (latencia < 100ms) | No WebSockets directos, serverless, $5/GB. |
| **Asignación** | Cloud Function `onTripCreated` con cascada de ofertas | Event-driven, top 5 conductores, oferta 12s. |
| **Ranking** | Adaptativo por tamaño de ciudad | Mejor UX en ciudad pequeña con baja densidad. |
| **Auth** | Firebase Auth (Google popup + Phone OTP) | Phone OTP para conductores (planes). |
| **Mapas** | Mapbox GL JS estilo `light-v11` | Costo-efectivo para LATAM vs Google. |
| **Pagos** | Wompi Colombia (sandbox) + efectivo | Mercado local, extensible a Stripe. |
| **Offline** | Service worker + Zustand persist para mutaciones | 4G intermitente en periferia Aguachica. |
| **Multi-ciudad** | RTDB particionado por `cities/{cityId}` | Matching nunca cruza ciudades. |
| **Comisión lanzamiento** | 0% las primeras 4 semanas en Aguachica | Adopción rápida, fricción cero. |
| **Static export** | `output: 'export'` + Capacitor 8 → APK | Cliente pesado reutilizable. |
| **state machine** | XState v5 | Modelo formal del viaje, timeouts declarativos. |
| **Mappers** | `lerpLatLng` con `requestAnimationFrame` | Animación suave de markers (1.2-1.5s). |
| **Glassmorphism** | `backdrop-filter` con `.glass`/`.glass-strong` | Look premium light mode. |
| **Theme** | Light-only con variable `.dark` lista | No prioridad por ahora. |

---

## 27. Pendientes y roadmap

### 27.1 Sprint 0 (Setup) — ✅ COMPLETO
- Estructura + config base.
- Firebase (reglas, índices, emuladores).
- Schemas Zod.
- Lib core (geo, realtime, api, utils).
- State machines (XState).
- Hooks (auth, GPS, trip stream, offline queue).
- Cloud Functions (matching, fare, settlement, rate, cancel, online).
- Layout + modo claro + splash animado.
- Componentes compartidos.
- App Pasajero (6 pantallas).
- App Conductor (6 pantallas).
- Seed Aguachica + seed dev.
- Scripts + manifest.

### 27.2 Pendiente inmediato
- [ ] Deploy manual de reglas + funciones a un proyecto dev.
- [ ] Conectar Mapbox Directions API server-side (hoy usa haversine).
- [ ] Poblar el polígono real de Aguachica con operaciones.
- [ ] Onboarding presencial de los primeros 10-15 conductores.
- [ ] Beta cerrada: 30 conductores, 50 pasajeros.
- [ ] Marketing local (Facebook Ads, radio).
- [ ] Iconos/splash nativos en Capacitor.
- [ ] Tests E2E con Playwright.
- [ ] Login con teléfono (OTP) — hoy solo Google.
- [ ] Pago con Wompi real (webhook + reconciliación).
- [ ] Panel admin `/admin/m` (mapa en vivo, métricas, antifraude).
- [ ] Tutorial in-app (3 pantallas primera apertura).
- [ ] Sentry + Crashlytics.
- [ ] Habeas data (Ley 1581/2012 Colombia).
- [ ] Webhook de Wompi apuntando a `settlePayment` CF.
- [ ] Anti-fraude: speed check, teleport check, cancel pattern.
- [ ] Soporte 24/7 vía WhatsApp Business.

### 27.3 Sprint 1 (Onboarding y matching) — SIGUIENTE
- [ ] Deploy manual de reglas + funciones.
- [ ] Mapbox Directions server-side.
- [ ] Polígono real Aguachica.
- [ ] Onboarding presencial 10-15 conductores.
- [ ] Beta cerrada 30/50.
- [ ] Marketing local.

---

## 28. Cómo actualizar este documento

> **REGLA DE ORO:** Si modificas código, también modificas este archivo.

### 28.1 ¿Cuándo actualizarlo?
- ✅ Al **agregar/eliminar/renombrar** un archivo, función, schema, ruta, comando npm, variable de entorno, regla de seguridad o índice.
- ✅ Al **modificar el comportamiento** de una función, hook, componente o Cloud Function.
- ✅ Al **cambiar decisiones arquitectónicas** (e.g., mover GPS de RTDB a Firestore).
- ✅ Al **añadir nuevas ciudades, vehículos, métodos de pago, estados de viaje**.
- ✅ Al **corregir bugs** que cambien la semántica (no bugs triviales).
- ✅ Al **actualizar versiones** del stack (Next.js, Firebase, XState, etc.).

### 28.2 ¿Qué secciones tocar?
- **Nueva función en `lib/contracts/`** → §6.
- **Nuevo hook** → §13.
- **Nuevo componente** → §15.
- **Nueva ruta Next.js** → §16.
- **Nueva Cloud Function** → §17.
- **Cambio en reglas de seguridad** → §18.
- **Cambio en pricing** → §22.
- **Cambio en convención** → §25.
- **Cambio en decisión arquitectónica** → §26.
- **Feature completado** → §27.1 (mover de 27.2 a 27.1).

### 28.3 Formato de actualización
- **Encabezado de la sección:** actualiza el contenido directo, no el número de sección.
- **Bug fixes importantes:** agrégalos en la sección correspondiente con la nota `> ⚠️ Bug conocido: ...`.
- **Agregar items al roadmap:** usa `- [ ]` para pendientes, `- [x]` para hechos.

### 28.4 Estructura de cambios
```diff
- ### 16.X `app/...` (descripción anterior)
+ ### 16.X `app/...` (descripción nueva)
+ - Punto 1
+ - Punto 2
```

### 28.5 Revisión
- Cada vez que se haga `git commit` que toque código de la app, **el diff debe incluir** también cambios en `MEMORY.md` si aplica.
- Antes de un PR, releer este documento y verificar que la sección "Pendientes" está al día.

---

## 📌 Changelog del documento

| Fecha | Cambio | Autor |
|---|---|---|
| 2026-06-05 | Creación inicial con análisis completo del proyecto Sprint 0. | opencode (MiniMax-M3) |

---

> **Próxima revisión sugerida:** tras Sprint 1 (matching + onboarding en producción).
> **Mantenedor:** equipo Yapido · **Contacto:** #yapido-movilidad
