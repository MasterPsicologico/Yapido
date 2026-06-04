# 🛵 Yapido Movilidad — Arquitectura Técnica & Producto

> **Producto:** App de movilidad **yapido.click** (moto / auto) — modelo Didi Conductor.
> **Ruta del proyecto:** `public/m/` (Yapido Capacitor APK, ruta `/m`).
> **Stack heredado de Yapido:** Next.js 15 · React 19 · Capacitor 8 · Firebase (Auth, Firestore, RTDB, FCM, Functions, Storage) · Mapbox GL · Tailwind.
> **Audiencia:** equipo de ingeniería, diseño y producto.
> **Estado del documento:** v1.0 — listo para pasar a implementación.

---

## 📑 Índice

1. [Visión del producto y roles](#1-visión-del-producto-y-roles)
2. [架构 — Arquitectura de software](#2--arquitectura-de-software)
3. [Stack tecnológico sugerido](#3-stack-tecnológico-sugerido)
4. [Flujo de lógica: asignación y aceptación del viaje](#4-flujo-de-lógica-asignación-y-aceptación-del-viaje)
5. [Rastreo GPS bidireccional y tiempo real](#5-rastreo-gps-bidireccional-y-tiempo-real)
6. [Esquema de Base de Datos](#6-esquema-de-base-de-datos)
7. [Experiencia de usuario (UX) — Flujos detallados](#7-experiencia-de-usuario-ux--flujos-detallados)
8. [Seguridad, escalabilidad y costos](#8-seguridad-escalabilidad-y-costos)
9. [Roadmap de implementación por sprints](#9-roadmap-de-implementación-por-sprints)
10. [Anexos: contratos de API y snippets clave](#10-anexos-contratos-de-api-y-snippets-clave)

---

## 1. Visión del producto y roles

### 1.1 Producto
Una app de movilidad urbana para **yapido.click** que conecta:
- **Pasajeros** que necesitan un viaje en **moto** o **auto**.
- **Conductores** verificados que ofrecen el servicio y ganan dinero.

### 1.2 Roles del sistema

| Rol | App que usa | Permisos clave |
|---|---|---|
| **Pasajero** | Yapido (rol pasajero) | Solicitar viaje, pagar, calificar, ver historial. |
| **Conductor** | Yapido (rol conductor) | Aceptar/rechazar viajes, navegar, ver ganancias. |
| **Operador / Admin** | Web `/admin` | Ver mapa en vivo, métricas, soporte, antifraude. |
| **Sistema** | Cloud Functions | Asignación, pricing dinámico, antifraude, facturación. |

### 1.3 Tipos de servicio

- **Moto** (`moto`) — entregas rápidas y viajes 1 pasajero, casco obligatorio.
- **Auto** (`auto`) — sedán estándar, hasta 4 pasajeros.
- **Auto Comfort** (`auto_comfort`) — vehículo premium (opcional v2).

### 1.4 Métricas de éxito (North Star)

- **Tasa de aceptación de viaje** > 85% en < 10 s.
- **ETA de llegada del conductor** con precisión ±1 min.
- **Tiempo desde solicitud → viaje iniciado** < 3 min en zona urbana.
- **Cancelaciones del conductor** < 5%.

---

## 2. 架构 — Arquitectura de software

### 2.1 Vista general (high level)

```
┌──────────────────────────────────────────────────────────────────┐
│                    CLIENTES (Capacitor APK)                       │
│  ┌────────────────────────┐        ┌────────────────────────┐    │
│  │  App Pasajero (React)  │        │  App Conductor (React) │    │
│  │  • Mapa en vivo         │        │  • Mapa + ofertas       │    │
│  │  • Solicitar viaje      │        │  • Aceptar / navegar    │    │
│  │  • Pago                 │        │  • Estado online/offline│    │
│  └────────────┬───────────┘        └────────────┬───────────┘    │
└───────────────┼─────────────────────────────────┼─────────────────┘
                │ HTTPS / WSS                      │ HTTPS / WSS
                ▼                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                     FIREBASE BACKEND (GCP)                        │
│                                                                   │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────┐  │
│  │   Auth     │  │   Firestore  │  │     RTDB     │  │  FCM   │  │
│  │  (login)   │  │ (datos/regs) │  │  (GPS live)  │  │ (push) │  │
│  └────────────┘  └──────────────┘  └──────────────┘  └────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                  CLOUD FUNCTIONS (Node 20)                  │  │
│  │  • matchTrip  • settleTrip  • computeFare  • notifyDriver  │  │
│  │  • dispatch   • fraudCheck  • payoutDaily                  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────┐  ┌──────────────┐                                │
│  │  Storage   │  │  Pub/Sub     │  (eventos asíncronos)          │
│  │ (fotos/ID) │  │  (analytics) │                                │
│  └────────────┘  └──────────────┘                                │
└──────────────────────────────────────────────────────────────────┘
                ▲
                │ HTTPS admin
                │
        ┌───────┴────────┐
        │  Web /admin    │ (Next.js, mismo monorepo)
        │  Panel ops     │
        └────────────────┘
```

### 2.2 Patrón arquitectónico

- **Cliente pesado reactivo** (el móvil hace casi todo el render, el backend solo expone datos).
- **Event-driven backend** con Cloud Functions disparadas por eventos de Firestore/RTDB.
- **Separación de datos en caliente vs fríos**:
  - **RTDB** (latencia < 100 ms) → ubicación GPS en vivo, estado de conductores, oferta activa.
  - **Firestore** (consistencia fuerte) → perfiles, historial de viajes, pagos, calificaciones.
- **API Gateway**: Cloud Functions v2 con HTTP + autenticación Firebase Auth.
- **Idempotencia**: cada mutación lleva un `requestId` (uuid v4) para evitar duplicados en reintentos.

### 2.3 Estructura de carpetas en `public/m/`

```
public/m/
├── docs/                    ← este documento + diagramas
├── app/                     ← rutas Next.js (App Router)
│   ├── (passenger)/         ← grupo de rutas pasajero
│   │   ├── home/            ← mapa + solicitar viaje
│   │   ├── trip/[id]/       ← viaje en curso
│   │   └── history/         ← historial
│   ├── (driver)/            ← grupo de rutas conductor
│   │   ├── home/            ← toggle online + ofertas
│   │   ├── trip/[id]/       ← viaje asignado en curso
│   │   └── earnings/        ← ganancias
│   ├── api/                 ← endpoints HTTP (proxy a Cloud Functions)
│   └── layout.tsx
├── components/
│   ├── map/                 ← MapView, RouteMap, DriverMarker
│   ├── trip/                ← TripCard, StatusBar, CancelDialog
│   └── shared/              ← Button, Sheet, Toast
├── lib/
│   ├── firebase/            ← init, auth, db, rtdb, storage
│   ├── geo/                 ← geohash, distance, polyline
│   ├── realtime/            ← useDriverLocation, useTripStream
│   └── api/                 ← fetch wrappers a Cloud Functions
├── hooks/                   ← useAuth, useOnline, useGeolocation
├── store/                   ← Zustand stores (trip, user, driver)
├── styles/
└── capacitor.config.ts      ← (heredado de raíz, sólo se añade scope)
```

### 2.4 Patrones de diseño de cliente

- **State machine del viaje** (XState o reducer puro):
  `idle → searching → offered → accepted → arriving → in_progress → completed → rated`
- **Optimistic UI** con rollback ante fallo de mutación.
- **Offline-first** ligero: cache de últimos viajes + queue de mutaciones cuando vuelve la red.
- **Pub/Sub local** (mitt o zustand) para desacoplar UI ↔ servicios.

### 2.5 Comunicación cliente ↔ backend

| Caso | Canal | Por qué |
|---|---|---|
| Auth | Firebase Auth SDK | Sesión persistente, refresh automático. |
| Perfil, historial, pagos | Firestore SDK | Queries, índices, offline cache. |
| GPS en vivo (conductor → backend) | RTDB `.set`/`.update` | Latencia < 100 ms, alta escritura. |
| GPS en vivo (pasajero ← backend) | RTDB `onValue` listener | Push-based, sin polling. |
| Oferta de viaje (push al conductor) | FCM + RTDB fallback | Funciona con app cerrada. |
| Calcular tarifa / disponibilidad | Cloud Function HTTPS | Lógica de negocio aislada y testeable. |
| Disputa / soporte | Firestore + admin SDK | Para que Ops intervenga. |

---

## 3. Stack tecnológico sugerido

> **Filosofía:** maximizar lo que ya está aprobado en el monorepo Yapido; añadir sólo lo indispensable.

### 3.1 Frontend móvil (Next.js + Capacitor)

| Capa | Tecnología | Justificación |
|---|---|---|
| Framework | **Next.js 15 + React 19** | Ya en uso en Yapido, soporta export estático (`output: 'export'`) que Capacitor consume. |
| Estilos | **Tailwind CSS + Radix UI** | Ya en `package.json`. |
| Animaciones | **Framer Motion** | Ya en `package.json`. |
| Mapas | **Mapbox GL JS** + `@mapbox/mapbox-gl-directions` | Ya instalados, superiores a Google en costo para LATAM. |
| Estado global | **Zustand** | Liviano, sin boilerplate, ideal para UIs reactivas. |
| State machine de viaje | **XState** | Estructura formal para el ciclo de vida del viaje. |
| Validación | **Zod** | Ya en uso. |
| Forms | **react-hook-form** | Ya en uso. |
| Fechas | **date-fns** | Ya en uso. |
| HTTP | **fetch** + wrapper `lib/api` | Nativo, sin axios. |
| Real-time | **Firebase RTDB SDK** | Patrón estándar Uber/Didi. |
| Background tasks | **Capacitor** `@capacitor/background-geolocation` (plugin comunitario) o `@capacitor/geolocation` + service worker | Para tracking con app minimizada. |

### 3.2 Backend / Serverless

| Servicio | Uso | Notas |
|---|---|---|
| **Firebase Auth** | Login pasajero y conductor (Google + teléfono). | Ya integrado vía `@capacitor-firebase/authentication`. |
| **Firestore** | DB principal: usuarios, viajes, pagos, ratings, configuraciones. | Region `us-central1` o `southamerica-east1` para LATAM. |
| **Realtime Database** | Tracking GPS, estado de conductores, oferta activa. | Bajo costo, alta concurrencia. |
| **Cloud Functions v2** | Lógica de negocio: asignación, tarifa, antifraude, payouts. | Node 20, región cerca de Firestore. |
| **Cloud Storage** | Fotos de perfil, documentos del conductor, fotos de daños. | Reglas estrictas de acceso. |
| **FCM** | Push: "Tienes un viaje nuevo", "Tu conductor llegó", etc. | Ya integrado. |
| **Cloud Pub/Sub** | Eventos asíncronos (analytics, auditoría, webhooks). | Activar sólo si la app crece. |
| **Secret Manager** | API keys (Mapbox, Wompi, Twilio). | Nunca en variables de cliente. |
| **Cloud Tasks** | Cola para retries (asignación, reintentos de pago). | Para v2. |

### 3.3 Servicios externos

| Servicio | Función | Alternativa |
|---|---|---|
| **Mapbox** | Mapas, geocoding, direcciones, ETA. | Google Maps (más caro). |
| **Wompi** (Colombia) / **Stripe** | Pagos con tarjeta y PSE. | MercadoPago (LATAM). |
| **Firebase Phone Auth** | OTP para login conductor. | Twilio (más control). |
| **OpenAI / Gemini** (opcional) | Chatbot de soporte, categorización de feedbacks. | Ya hay Genkit en Yapido. |
| **Sentry** | Error tracking móvil. | LogRocket. |
| **PostHog / Firebase Analytics** | Eventos de producto. | Mixpanel. |

### 3.4 DevOps y calidad

- **CI/CD**: GitHub Actions → `firebase deploy --only functions,firestore,hosting` + build APK con Gradle.
- **Type safety end-to-end**: Zod en cliente **y** en Cloud Functions (mismas definiciones en `lib/contracts/`).
- **Testing**: Vitest (lógica) + Playwright (E2E web admin) + emulador de Firebase.
- **Observabilidad**: Firebase Crashlytics + Cloud Logging + alertas de Cloud Functions.

---

## 4. Flujo de lógica: asignación y aceptación del viaje

### 4.1 Diagrama de secuencia (Happy path)

```
Pasajero              App Pasajero         Firestore/RTDB       Cloud Fn       App Conductor
   │                        │                    │                  │                  │
   │ 1. Abre app            │                    │                  │                  │
   ├───────────────────────▶│                    │                  │                  │
   │                        │ getCurrentLocation │                  │                  │
   │                        ├───────────────────▶│                  │                  │
   │                        │◀── coords ─────── │                  │                  │
   │                        │                    │                  │                  │
   │ 2. Ingresa destino     │                    │                  │                  │
   ├───────────────────────▶│                    │                  │                  │
   │                        │ Mapbox directions  │                  │                  │
   │                        ├─────────────►(Mapbox API)             │                  │
   │                        │                    │                  │                  │
   │                        │ 3. Solicita viaje  │                  │                  │
   │                        │ POST /trips        │                  │                  │
   │                        ├───────────────────▶│  onCreate        │                  │
   │                        │                    │  tripRequest     │                  │
   │                        │                    ├─────────────────▶│                  │
   │                        │                    │                  │ matchTrip()      │
   │                        │                    │                  │  - geo query     │
   │                        │                    │                  │  - ranking       │
   │                        │                    │                  │  - FCM + RTDB    │
   │                        │                    │                  ├─────────────────▶│
   │                        │                    │                  │                  │ 4. Toast:
   │                        │                    │                  │                  │  "Nuevo viaje"
   │                        │                    │                  │                  │   Beep
   │                        │                    │                  │                  │
   │                        │                    │                  │◀──── 5. ACEPTA ──┤
   │                        │                    │  update trip     │                  │
   │                        │                    │  status=accepted │                  │
   │                        │                    │◀─────────────────┤                  │
   │ 6. Pantalla "Tu conductor va en camino"      │                  │                  │
   │◀────────────────────── │◀─── listener ───── │                  │                  │
   │                        │                    │                  │                  │
   │                        │   (GPS en vivo RTDB)                  │                  │
   │                        │◀═══════════════════╪══════════════════╪═════════════════▶│
   │                        │                    │                  │                  │
   │ 7. Conductor LLEGA     │                    │  update          │                  │
   │                        │                    │  status=arrived  │                  │
   │                        │◀═══════════════════╪══════════════════╪══════════════════│
   │                        │                    │                  │                  │
   │ 8. Inicia viaje        │                    │  update          │                  │
   │                        │                    │  status=in_progress                  │
   │                        │                    │                  │                  │
   │                        │    (ruta activa)   │                  │                  │
   │                        │◀═══════════════════╪══════════════════╪═════════════════▶│
   │                        │                    │                  │                  │
   │ 9. Completa viaje      │                    │  update          │                  │
   │                        │                    │  status=completed │                  │
   │                        │                    │                  │                  │
   │ 10. Califica y paga    │                    │                  │                  │
   ├───────────────────────▶│                    │                  │                  │
   │                        │ POST /trips/:id/rate                  │                  │
   │                        │                    │                  │                  │
```

### 4.2 Algoritmo de asignación (`matchTrip`)

```ts
// Pseudocódigo Cloud Function
async function matchTrip(tripId: string) {
  const trip = await getTrip(tripId);

  // 1. Búsqueda por geohash
  const center = geohash.encode(trip.pickup.lat, trip.pickup.lng, 6); // ~1.2 km
  const neighbors = geohash.neighbors(center); // 9 celdas

  // 2. Candidatos en RTDB: drivers con vehicleType matching y status=online
  const candidates = await rtdb.ref('drivers_online')
    .orderByChild('geo6').equalTo(center) // indexado
    .once('value');

  // 3. Ranking
  const ranked = candidates
    .map(d => ({ ...d, score: rank(d, trip) }))
    .filter(d => d.score > 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // top 5

  // 4. Cascada: ofrecer uno por uno con timeout 8s
  for (const driver of ranked) {
    const accepted = await offerToDriver(driver, trip, 8000);
    if (accepted) {
      await assignTrip(trip, driver);
      return;
    }
  }
  await markTripAsNoDrivers(trip);
}
```

### 4.3 Función de ranking

```ts
function rank(driver, trip) {
  const distance = haversine(driver.loc, trip.pickup);   // km
  const distScore  = Math.max(0, 1 - distance / 5);       // < 5 km score positivo
  const ratingScore = (driver.rating - 4) / 1;           // 4★=0, 5★=1
  const acceptRate = driver.acceptRate30d;                // 0..1
  const idleBonus  = driver.idleMinutes > 5 ? 0.1 : 0;    // premia inactivos

  return (0.5 * distScore) + (0.25 * ratingScore) + (0.15 * acceptRate) + idleBonus;
}
```

### 4.4 Estado de viaje (State machine)

```
                    ┌──────────┐
                    │   idle   │
                    └────┬─────┘
                         │ requestTrip()
                         ▼
                  ┌─────────────┐
        ┌────────▶│  searching  │──────────┐
        │         └──────┬──────┘          │
        │ cancelByUser   │ driverFound     │ noDrivers
        │                ▼                 ▼
        │         ┌────────────┐     ┌────────────┐
        │         │  offered   │     │ no_drivers │
        │         │ (conductor │     └─────┬──────┘
        │         │  decide)   │           │ retry
        │         └────┬───────┘           │
        │              │ accept             │
        │   timeout ───┤                   │
        │              ▼                    │
        │       ┌────────────┐              │
        │       │  accepted  │◀─────────────┘
        │       └────┬───────┘
        │            │ driverArrived
        │            ▼
        │     ┌────────────┐
        │     │  arriving  │
        │     └────┬───────┘
        │          │ startTrip
        │          ▼
        │   ┌─────────────┐
        │   │ in_progress │
        │   └────┬────────┘
        │        │ completeTrip
        │        ▼
        │  ┌─────────────┐
        │  │  completed  │
        │  └────┬────────┘
        │       │ payAndRate
        │       ▼
        │  ┌─────────────┐
        └──│   rated     │
   cancelBy* └─────────────┘
```

### 4.5 Timeouts y reintentos

| Evento | Timeout | Acción al expirar |
|---|---|---|
| Conductor acepta oferta | 8 s | Ofrecer al siguiente del ranking. |
| Conductor llega al pickup | 5 min desde aceptación | Cobrar tarifa de espera o cancelar. |
| Pasajero no aparece | 5 min | Cancelar, cobrar fee al pasajero. |
| Pago | 60 s | Reintentar 3×, luego cancelar y notificar. |
| Push FCM no entregado | 5 s | Fallback a RTDB listener. |

### 4.6 Manejo de conflictos (doble aceptación)

- Cada oferta genera un `offerId` único con TTL 8 s.
- Firestore transaction: el conductor que primero ejecute `acceptOffer(offerId)` gana.
- Los demás reciben `offer.expired` y el siguiente del ranking es notificado.

---

## 5. Rastreo GPS bidireccional y tiempo real

### 5.1 Por qué NO WebSockets directos

- Firebase RTDB + WebSocket interno de Firebase ya cumple la función.
- WebSockets puros requieren un servidor (Cloud Run, no estándar en Yapido).
- Costo: RTDB es ~$5/GB transferido, suficiente para LATAM.
- Mantenimiento: cero, es serverless.

### 5.2 Patrón de datos en RTDB

```
/rtdb
├── drivers_online/                  ← estado + ubicación actual
│   └── {driverId}/
│       ├── status: "online" | "on_trip" | "offline"
│       ├── vehicleType: "moto" | "auto"
│       ├── loc/
│       │   ├── lat: number
│       │   ├── lng: number
│       │   ├── h: number      ← heading 0-360
│       │   ├── s: number      ← speed km/h
│       │   ├── ts: serverTimestamp
│       │   └── geo6: string   ← geohash para queries
│       └── updatedAt: serverTimestamp
│
├── trips_live/                      ← viaje activo
│   └── {tripId}/
│       ├── status, passengerId, driverId, ...
│       ├── pickup: { lat, lng, address }
│       ├── dropoff: { lat, lng, address }
│       ├── routePolyline: string   ← Mapbox polyline
│       ├── driverLoc: { lat, lng, h, s, ts }   ← espejo de drivers_online
│       ├── eta: number              ← segundos, recalculado
│       └── lastUpdate: serverTimestamp
│
└── offers/                          ← oferta activa al conductor
    └── {driverId}/
        └── current/
            ├── tripId
            ├── expiresAt
            └── fareEstimate
```

### 5.3 Estrategia de actualización GPS (lado conductor)

```ts
// Hook useDriverGPS — corre cuando driver.status === 'online' || 'on_trip'
function useDriverGPS() {
  useEffect(() => {
    if (!isActive) return;

    const watchId = Geolocation.watchPosition(
      { enableHighAccuracy: true, distanceFilter: 10, interval: 3000 },
      async (pos) => {
        const { latitude, longitude, heading, speed } = pos.coords;
        const loc = { lat: latitude, lng: longitude, h: heading, s: speed, ts: Date.now() };
        const update = { loc, geo6: geohash.encode(latitude, longitude, 6) };

        // 1. RTDB: estado de conductor (baja latencia)
        await rtdb.ref(`drivers_online/${driverId}`).update(update);

        // 2. RTDB: viaje en curso (cliente pasajero escucha)
        if (currentTripId) {
          await rtdb.ref(`trips_live/${currentTripId}/driverLoc`).set(loc);
        }
      },
      { maximumAge: 5000 }
    );

    return () => Geolocation.clearWatch({ id: watchId });
  }, [isActive, driverId, currentTripId]);
}
```

**Frecuencias:**

| Estado conductor | Intervalo GPS | Por qué |
|---|---|---|
| `online` sin oferta | 10 s | Búsqueda pasiva, ahorra batería. |
| `online` con oferta | 2 s | Precisión al acercarse. |
| `on_trip` (arriving) | 3 s | Pasajero ve movimiento fluido. |
| `on_trip` (in_progress) | 5 s | Suficiente para visualizar ruta. |
| App en background | 15-30 s | Plugin de background-geolocation, restricciones OS. |

### 5.4 Estrategia de actualización mapa (lado pasajero)

```ts
// Hook useDriverLiveLocation
function useDriverLiveLocation(tripId: string) {
  const [driverLoc, setDriverLoc] = useState<LatLng | null>(null);

  useEffect(() => {
    const ref = rtdb.ref(`trips_live/${tripId}/driverLoc`);
    const unsub = ref.on('value', snap => {
      const loc = snap.val();
      if (loc) setDriverLoc({ lat: loc.lat, lng: loc.lng });
    });
    return () => ref.off('value', unsub);
  }, [tripId]);

  return driverLoc;
}
```

**Render en el mapa:**
- Marker del conductor animado con `easeTo` de Mapbox para interpolación suave entre actualizaciones (evita saltos).
- ETA recalculado cada 30 s con Mapbox Directions API.
- Polyline de la ruta fija (origen → destino), recalculada sólo si hay desvío > 100 m.

### 5.5 Reconnect y resync

```ts
// Patrón: cuando el cliente vuelve online, pedir el último estado conocido
function useResilientTrip(tripId: string) {
  useEffect(() => {
    const onConnect = rtdb.ref('.info/connected');
    onConnect.on('value', async snap => {
      if (snap.val() === false) return;
      // Reconectado: refrescar desde Firestore (source of truth)
      const trip = await getDoc(doc(db, 'trips', tripId));
      if (trip.exists()) hydrateLocalState(trip.data());
    });
    return () => onConnect.off();
  }, [tripId]);
}
```

### 5.6 Seguridad del canal

- **Reglas RTDB** (resumen):
  ```
  /drivers_online/$driverId: write auth.uid === $driverId
                          : read  auth != null
  /trips_live/$tripId:    read  auth.uid === data.child('passengerId').val()
                                || auth.uid === data.child('driverId').val()
                       : write auth.uid === data.child('driverId').val()
  ```
- Validar `geo6` para que coincida con lat/lng (evita spoofing en celda lejana).
- Detección de "teleporting": si `distancia entre 2 updates > 500 m`, marcar conductor como sospechoso (`flags.teleport = true`).

### 5.7 Privacidad

- Pasajero **no** ve la ubicación del conductor antes de aceptar.
- Conductor **no** ve la dirección exacta del pasajero hasta aceptar (sólo zona aproximada).
- Al completar el viaje, se eliminan `trips_live/{tripId}` y se conserva el snapshot en Firestore `trips/{tripId}`.

---

## 6. Esquema de Base de Datos

> **Nota:** Firestore es NoSQL, así que "tablas" son **colecciones** y los campos son orientativos. Todo ID es `string` salvo indicación.

### 6.1 Diagrama entidad-relación

```
users ─────────┐
  │            │
  │ 1..1       │ 1..1
  ▼            ▼
passenger_profiles   driver_profiles
                          │ 1..1
                          ▼
                     driver_documents
                          │
                          │ 1..N
                          ▼
driver_vehicles ──── trips ──── trip_events
                          │
                          ├── ratings
                          ├── payments
                          └── fare_estimates
```

### 6.2 Colección: `users` (común a ambos roles)

```ts
users/{uid}
├── uid: string
├── email: string | null
├── phone: string | null              // E.164
├── displayName: string
├── photoURL: string | null
├── role: "passenger" | "driver" | "both"
├── fcmTokens: string[]               // para push
├── createdAt: Timestamp
├── updatedAt: Timestamp
├── status: "active" | "suspended" | "banned"
└── locale: "es-CO" | "en"
```

### 6.3 Colección: `passenger_profiles`

```ts
passenger_profiles/{uid}
├── uid: string
├── defaultPaymentMethodId: string | null
├── homeAddress: GeoPoint | null
├── workAddress: GeoPoint | null
├── ratingAvg: number                // como pasajero
├── ratingCount: number
├── totalTrips: number
└── promoCodes: string[]
```

### 6.4 Colección: `driver_profiles`

```ts
driver_profiles/{uid}
├── uid: string
├── status: "pending_docs" | "approved" | "rejected" | "blocked"
├── ratingAvg: number
├── ratingCount: number
├── totalTrips: number
├── acceptRate30d: number             // 0..1
├── cancelRate30d: number
├── vehicleId: string                 // ref a driver_vehicles
├── documentsId: string
├── bankAccount: { provider, maskedAccount, holderName }
├── online: boolean                   // espejo para queries rápidas
├── currentLocation: GeoPoint         // última conocida
├── currentGeohash6: string
├── city: string
└── flaggedAt: Timestamp | null       // antifraude
```

### 6.5 Colección: `driver_vehicles`

```ts
driver_vehicles/{vehicleId}
├── vehicleId: string
├── driverId: string
├── type: "moto" | "auto" | "auto_comfort"
├── plate: string                     // normalizada
├── brand: string
├── model: string
├── year: number
├── color: string
├── capacity: number
├── photoFront: string                // URL Storage
├── photoSide: string
├── photoBack: string
├── insuranceExpiry: Timestamp
├── soatExpiry: Timestamp             // (Colombia) revisión tecno-mecánica
└── verifiedAt: Timestamp | null
```

### 6.6 Colección: `driver_documents`

```ts
driver_documents/{uid}
├── uid: string
├── ccFrontUrl: string                // cédula
├── ccBackUrl: string
├── licenseUrl: string                // licencia de conducir
├── licenseExpiry: Timestamp
├── backgroundCheckUrl: string | null
├── selfieWithCcUrl: string
├── status: "pending" | "approved" | "rejected"
├── reviewedBy: string | null         // admin uid
├── reviewedAt: Timestamp | null
├── rejectionReason: string | null
└── updatedAt: Timestamp
```

### 6.7 Colección: `trips` (historial completo, source of truth)

```ts
trips/{tripId}
├── tripId: string
├── status: "searching" | "offered" | "accepted" | "arriving" | "in_progress"
│        | "completed" | "cancelled" | "no_drivers" | "rated"
├── type: "moto" | "auto" | "auto_comfort"
│
├── passenger: {
│   uid, displayName, photoURL, rating, phone
│ }
│
├── driver: {                         // null hasta aceptado
│   uid, displayName, photoURL, rating, phone, plate, vehicleDesc
│ } | null
│
├── pickup: { lat, lng, address, notes? }
├── dropoff: { lat, lng, address, notes? }
│
├── routePolyline: string             // Mapbox encoded
├── distanceMeters: number
├── durationSeconds: number           // estimado inicial
│
├── fare: {
│   currency: "COP",
│   base: number,
│   distance: number,
│   time: number,
│   surge: number,                    // 1.0 = sin surge
│   tolls: number,
│   wait: number,
│   total: number,
│   driverEarning: number,            // 80% por defecto
│   platformFee: number,              // 20%
│   tip: number
│ }
│
├── payment: {
│   method: "cash" | "card" | "wompi",
│   status: "pending" | "paid" | "failed" | "refunded",
│   transactionId: string | null,
│   paidAt: Timestamp | null
│ }
│
├── timeline: {                       // orden cronológico
│   requestedAt: Timestamp,
│   matchedAt: Timestamp | null,
│   acceptedAt: Timestamp | null,
│   arrivedAt: Timestamp | null,
│   startedAt: Timestamp | null,
│   completedAt: Timestamp | null,
│   cancelledAt: Timestamp | null,
│   cancelledBy: "passenger" | "driver" | "system" | null,
│   cancelReason: string | null,
│   ratedAt: Timestamp | null
│ }
│
├── offerLog: Array<{                 // auditoría
│   driverId, offeredAt, expiredAt, reason
│ }>
│
├── city: string
└── createdAt: Timestamp
```

### 6.8 Colección: `ratings` (desnormalizado opcional)

```ts
ratings/{tripId}
├── tripId: string
├── from: "passenger" | "driver"
├── toUid: string
├── score: number                     // 1..5
├── tags: string[]                    // ["clean_car","good_drive"]
├── comment: string | null
└── createdAt: Timestamp
```

### 6.9 Colección: `payments`

```ts
payments/{paymentId}
├── paymentId: string
├── tripId: string
├── driverId: string
├── passengerId: string
├── amount: number
├── currency: "COP"
├── method: "cash" | "card" | "wompi"
├── status: "pending" | "settled" | "failed" | "refunded"
├── wompiTransactionId: string | null
├── settledAt: Timestamp | null
├── payoutId: string | null
└── createdAt: Timestamp
```

### 6.10 Colección: `payouts` (semanal al conductor)

```ts
payouts/{payoutId}
├── payoutId: string
├── driverId: string
├── periodStart: Timestamp
├── periodEnd: Timestamp
├── tripsCount: number
├── grossAmount: number
├── platformFee: number
├── tips: number
├── adjustments: number
├── netAmount: number
├── status: "pending" | "paid" | "failed"
├── paidAt: Timestamp | null
└── bankRef: string | null
```

### 6.11 Colección: `fare_estimates` (cache de cotizaciones)

```ts
fare_estimates/{estimateId}
├── estimateId: string
├── pickupGeohash6: string
├── dropoffGeohash6: string
├── distanceBucket: string            // "0-2km","2-5km","5-10km"
├── type: "moto" | "auto"
├── avgFare: number
├── sampleSize: number
├── updatedAt: Timestamp
```

### 6.12 Índices requeridos (Firestore)

```json
// firestore.indexes.json (extracto)
{
  "indexes": [
    {
      "collectionGroup": "trips",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "passenger.uid", "order": "ASCENDING" },
        { "fieldPath": "timeline.requestedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "trips",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "driver.uid", "order": "ASCENDING" },
        { "fieldPath": "timeline.requestedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "trips",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "city", "order": "ASCENDING" },
        { "fieldPath": "timeline.requestedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "driver_profiles",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "currentGeohash6", "order": "ASCENDING" }
      ]
    }
  ]
}
```

### 6.13 Reglas Firestore (resumen)

```js
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {

    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }

    match /passenger_profiles/{uid} {
      allow read, write: if request.auth.uid == uid;
    }

    match /driver_profiles/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid
                   && (request.resource.data.diff(resource.data).affectedKeys()
                       .hasOnly(['online','currentLocation','currentGeohash6']));
    }

    match /trips/{tripId} {
      allow read: if request.auth.uid == resource.data.passenger.uid
                  || request.auth.uid == resource.data.driver.uid
                  || isAdmin(request.auth.uid);
      allow create: if request.auth.uid == request.resource.data.passenger.uid;
      allow update: if request.auth.uid == resource.data.driver.uid
                    || request.auth.uid == resource.data.passenger.uid;
    }

    match /payments/{id} {
      allow read: if request.auth.uid == resource.data.driverId
                  || request.auth.uid == resource.data.passengerId
                  || isAdmin(request.auth.uid);
    }

    function isAdmin(uid) {
      return exists(/databases/$(db)/documents/admins/$(uid));
    }
  }
}
```

---

## 7. Experiencia de usuario (UX) — Flujos detallados

### 7.1 Pantallas principales (taxonomía)

**Pasajero (10 pantallas)**
1. Splash / Auth
2. Home (mapa)
3. Selección de destino + servicios
4. Confirmación + método de pago
5. Búsqueda de conductor (loader)
6. Conductor asignado (info + GPS en vivo)
7. Conductor en camino
8. Viaje en curso
9. Calificación + tip
10. Historial

**Conductor (8 pantallas)**
1. Splash / Auth
2. Onboarding documentos
3. Home con toggle online
4. Oferta de viaje (modal full-screen)
5. Navegación al pasajero
6. Espera al pasajero
7. Viaje en curso
8. Ganancias del día/semana

### 7.2 Flujo pasajero paso a paso

| Paso | Pantalla | Acción usuario | Sistema |
|---|---|---|---|
| 1 | Auth | Toca "Ingresar" | Firebase Auth + Google o teléfono. |
| 2 | Permisos | Acepta ubicación | Capacitor `requestPermissions()`. |
| 3 | Home | Ve mapa centrado en su ubicación | `watchPosition` activo. |
| 4 | Home | Toca "¿A dónde vas?" | Abre bottom sheet. |
| 5 | Búsqueda | Escribe destino | Autocomplete Mapbox Places API. |
| 6 | Confirm | Elige tipo (moto/auto) | Llama a `fareEstimates/{estimateId}`. |
| 7 | Confirm | Confirma + método de pago | POST `/trips` → estado `searching`. |
| 8 | Búsqueda | Loader animado "Buscando conductor" | Suscribe a `trips/{id}` y `drivers_nearby`. |
| 9 | Búsqueda | — | `matchTrip` corre, oferta a top 5. |
| 10 | Asignado | Ve foto, placa, rating, ETA | Push FCM "Tu conductor es Juan en ABC123". |
| 11 | En camino | Ve marcador moviéndose | RTDB `trips_live/{id}/driverLoc`. |
| 12 | En camino | — | Conductor marca `arrived` → notificación "Tu conductor llegó". |
| 13 | En curso | Inicia cuando pasajero sube | Status `in_progress`, cronómetro y tarifa corriendo. |
| 14 | En curso | — | Recálculo de tarifa en cada update GPS. |
| 15 | Final | Conductor marca "Completar" | Status `completed`, mostrar total. |
| 16 | Calificar | Toca 1-5 estrellas + tip opcional | POST `ratings` + cierre de pago. |
| 17 | Final | Pantalla de éxito | `passenger_profiles.totalTrips++`. |

### 7.3 Flujo conductor paso a paso

| Paso | Pantalla | Acción | Sistema |
|---|---|---|---|
| 1 | Auth | Login con teléfono | OTP Firebase. |
| 2 | Docs | Sube cédula, licencia, selfie | Storage + estado `pending_docs`. |
| 3 | Wait | "En revisión 24-48h" | Admin revisa desde `/admin`. |
| 4 | Approved | Toca "Activar" | toggle `online: true`. |
| 5 | Online | Ve mapa con zonas calientes | `useDriverGPS` activo. |
| 6 | Oferta | Beep + vibración + modal con mapa | FCM + RTDB push. |
| 7 | Oferta | Acepta / Rechaza (8 s) | RTDB `/offers/{driverId}/current` transa. |
| 8 | Al pasajero | Ve ruta al pickup | Mapbox Directions. |
| 9 | Llegó | Toca "Ya llegué" | Status `arriving` → push al pasajero. |
| 10 | Espera | Toca "Iniciar viaje" (código QR pasajero) | Status `in_progress`. |
| 11 | Viaje | Sigue ruta sugerida | Mapbox navigation. |
| 12 | Final | Toca "Completar" + selector método de pago | Status `completed`, cobro. |
| 13 | Cobro | Confirma efectivo o app cobra con Wompi | `payments` creado. |
| 14 | Rating | Califica al pasajero | `ratings` creado. |
| 15 | Siguiente | "Aceptar otro viaje" | Toggle vuelve a `online`. |

### 7.4 Estados vacíos y errores clave

| Caso | UX recomendada |
|---|---|
| Sin conductores disponibles | "No encontramos conductores cerca, intenta de nuevo en 1 min" + botón retry. |
| Conductor cancela | Reasignar automático, notificar: "Buscando otro conductor…". |
| GPS desactivado | Banner persistente: "Activa tu ubicación para usar Yapido". |
| Sin internet | Banner "Sin conexión — reintentando" + cache del último viaje. |
| Pago rechazado | Modal con 3 reintentos + opción de efectivo. |
| Documentos rechazados | Pantalla con razón + reintento. |

### 7.5 Accesibilidad (a11y)

- Contraste AA mínimo en toda la UI.
- Botones con altura mínima 48×48 dp.
- VoiceOver / TalkBack labels en español.
- Modo oscuro desde v1.
- Tipos de letra escalables (`rem`).

---

## 8. Seguridad, escalabilidad y costos

### 8.1 Seguridad

- **Auth + RBAC**: roles en custom claims (`admin`, `driver`, `passenger`).
- **Reglas estrictas** en Firestore y RTDB (ver secciones 5.6 y 6.13).
- **Validación de entrada** con Zod **tanto en cliente como en Cloud Functions** (compartir `lib/contracts/`).
- **Rate limiting** en Cloud Functions (10 req/s por uid via `rateLimit` middleware).
- **Idempotency keys** en mutaciones críticas (cobros, payouts).
- **HTTPS obligatorio** (Firestore y Functions ya lo son).
- **API keys en Secret Manager**, jamás en código.
- **Antifraude básico**:
  - Verificación de velocidad máxima (200 km/h) entre updates GPS.
  - Distancia recorrida vs polyline (desvío > 1 km ⇒ flag).
  - Patrón de "ghost trips" (conectar → cancelar rápido).

### 8.2 Escalabilidad

- Firestore escala horizontalmente; tamaño máx doc 1 MB (no problema).
- RTDB: monitorear bandwidth (~$5/GB). Con 1.000 conductores actualizando 1 vez/5s = ~50 GB/día = $250/día (sí, hay que cuidar).
  - **Optimización**: solo escribir si `distancia recorrida > 10 m`.
  - A 1.000 conductores activos: 1000 × 17 KB/min × 60 min × 24 h ≈ 24 GB/día = **$120/día**.
  - Alternativa más barata a escala: **MongoDB Atlas + WebSockets en Cloud Run** (revisar si crece > 5.000 conductores concurrentes).
- Cloud Functions: 2 vCPU / 1 GB RAM por default; auto-scale.

### 8.3 Costos estimados (mensual, 1.000 viajes/día)

| Servicio | Estimado |
|---|---|
| Firestore reads/writes (incluido en Spark/Blaze) | $50-150 |
| RTDB (24 GB/día) | $3,600 ⚠️ |
| Cloud Functions | $50-200 |
| FCM | gratis |
| Storage (fotos docs) | $20-50 |
| Mapbox | $50-200 (50k loads gratis) |
| **Total** | **~$3,800 – $4,200/mes** |

**Conclusión**: el costo dominante es RTDB GPS. Optimizar frecuencia y deduplicar es crítico. Alternativa v2: **MongoDB Change Streams** o **Redis + WebSocket** en Cloud Run para reducir 70% del costo de tracking.

---

## 9. Roadmap de implementación por sprints

| Sprint | Duración | Entregable |
|---|---|---|
| **S0 — Setup** | 3 días | `public/m/` con Next.js, Capacitor, Firebase init, Auth. |
| **S1 — Modelo de datos** | 3 días | Colecciones + reglas + emulador local + seeds. |
| **S2 — Onboarding conductor** | 5 días | Docs upload, admin approval, perfil conductor. |
| **S3 — Solicitar viaje (pasajero)** | 5 días | Home con mapa, autocomplete destino, fare estimate. |
| **S4 — Asignación** | 5 días | Cloud Function `matchTrip` + cascada de ofertas. |
| **S5 — GPS bidireccional** | 5 días | Hook `useDriverGPS` + listener pasajero + marker animado. |
| **S6 — State machine del viaje** | 4 días | Estados, transiciones, timeouts, eventos. |
| **S7 — Pagos** | 5 días | Wompi + efectivo, payouts semanales, fees. |
| **S8 — Calificaciones + historial** | 3 días | Pantallas y queries. |
| **S9 — Panel admin `/admin/m`** | 5 días | Mapa en vivo, métricas, soporte. |
| **S10 — Antifraude + QA** | 5 días | Reglas, tests, E2E, beta cerrada. |
| **S11 — Lanzamiento** | 3 días | Play Store, marketing, monitor 24/7. |

**Total estimado: ~7-8 semanas con 1 dev full-time.**

---

## 10. Anexos: contratos de API y snippets clave

### 10.1 Contrato: `POST /api/trips` (Cloud Function)

**Request**
```json
{
  "requestId": "uuid-v4",
  "type": "moto",
  "pickup": { "lat": 4.7110, "lng": -74.0721, "address": "Calle 100 #15-20" },
  "dropoff": { "lat": 4.6760, "lng": -74.0480, "address": "Calle 72 #10-15" },
  "paymentMethodId": "pm_abc123",
  "notes": "Por favor llegar por la entrada principal"
}
```

**Response 201**
```json
{
  "tripId": "tr_xyz789",
  "status": "searching",
  "fare": { "total": 12500, "currency": "COP", "surge": 1.0 },
  "eta": 180
}
```

### 10.2 Contrato: `POST /api/trips/{id}/rate`

**Request**
```json
{
  "requestId": "uuid-v4",
  "score": 5,
  "tags": ["clean_car","good_drive"],
  "comment": "Excelente servicio",
  "tip": 2000
}
```

**Response 200**
```json
{ "ok": true, "newDriverRating": 4.87 }
```

### 10.3 Snippet: `useDriverGPS` (lado conductor)

```ts
import { useEffect, useRef } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { ref, update, serverTimestamp } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import { geohash } from '@/lib/geo';

export function useDriverGPS(opts: { driverId: string; tripId?: string; active: boolean; }) {
  const last = useRef<{ lat: number; lng: number; ts: number } | null>(null);

  useEffect(() => {
    if (!opts.active) return;
    let watchId: string | null = null;

    (async () => {
      watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          distanceFilter: 10,
          interval: 3000,
        },
        async (pos) => {
          const { latitude: lat, longitude: lng, heading: h = 0, speed: s = 0 } = pos.coords;
          const now = Date.now();

          // Throttle: solo si se movió > 10m o pasaron > 5s
          if (last.current) {
            const d = haversine(last.current, { lat, lng });
            if (d < 0.01 && now - last.current.ts < 5000) return;
          }
          last.current = { lat, lng, ts: now };

          const update_ = {
            loc: { lat, lng, h, s, ts: now },
            geo6: geohash.encode(lat, lng, 6),
            updatedAt: serverTimestamp(),
          };

          await update(ref(rtdb, `drivers_online/${opts.driverId}`), update_);
          if (opts.tripId) {
            await update(ref(rtdb, `trips_live/${opts.tripId}/driverLoc`), update_.loc);
          }
        }
      );
    })();

    return () => {
      if (watchId) Geolocation.clearWatch({ id: watchId });
    };
  }, [opts.driverId, opts.tripId, opts.active]);
}
```

### 10.4 Snippet: `matchTrip` Cloud Function (esqueleto)

```ts
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import { getDatabase } from 'firebase-admin/database';
import { geohash } from '@/lib/geo';

export const matchTrip = onDocumentCreated('trips/{tripId}', async (event) => {
  const trip = event.data?.data();
  if (!trip || trip.status !== 'searching') return;

  const rtdb = getDatabase();
  const center = geohash.encode(trip.pickup.lat, trip.pickup.lng, 6);
  const cells = [center, ...geohash.neighbors(center)];

  const candidates: any[] = [];
  for (const cell of cells) {
    const snap = await rtdb.ref('drivers_online')
      .orderByChild('geo6').equalTo(cell).once('value');
    snap.forEach(child => {
      const d = child.val();
      if (d.status === 'online' && d.vehicleType === trip.type) {
        candidates.push({ id: child.key!, ...d });
      }
    });
  }

  const ranked = candidates
    .map(d => ({ ...d, score: rank(d, trip) }))
    .filter(d => d.score > 0.4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  for (const driver of ranked) {
    const ok = await offerToDriver(driver.id, event.params.tripId, 8000);
    if (ok) {
      logger.info(`Trip ${event.params.tripId} assigned to ${driver.id}`);
      return;
    }
  }

  await event.data!.ref.update({ status: 'no_drivers' });
});
```

### 10.5 Variables de entorno (cliente)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=yapido.click
NEXT_PUBLIC_FIREBASE_PROJECT_ID=yapido-prod
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://yapido-prod-default-rtdb.firebaseio.com
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx
NEXT_PUBLIC_API_BASE=https://us-central1-yapido-prod.cloudfunctions.net
```

### 10.6 Diagrama de carpetas (referencia rápida)

```
public/m/
├── app/
│   ├── (passenger)/
│   ├── (driver)/
│   └── api/
├── components/
│   ├── map/
│   ├── trip/
│   └── shared/
├── lib/
│   ├── firebase/
│   ├── geo/
│   ├── realtime/
│   ├── api/
│   └── contracts/        ← Zod schemas compartidos cliente/servidor
├── hooks/
├── store/
├── docs/                 ← este archivo
│   ├── arquitectura.md
│   └── diagramas/
└── styles/
```

---

## ✅ Checklist de "listo para código"

- [ ] Decidir **mapas**: Mapbox (recomendado por stack actual) vs Google.
- [ ] Decidir **pagos**: Wompi vs Stripe según país.
- [ ] Crear proyecto Firebase secundario `yapido-movilidad` (aislar datos del e-commerce).
- [ ] Configurar índices y reglas de RTDB + Firestore.
- [ ] Implementar `matchTrip` con emulador local.
- [ ] Diseñar pantalla de oferta con cuenta regresiva 8 s.
- [ ] Wireframe Figma de las 18 pantallas clave.
- [ ] Plan de pruebas: 50 conductores beta en una zona (ej. Bogotá, zona rosa).
- [ ] Política de privacidad + términos (Wompi + RTDB de datos sensibles).

---

> **Próximo paso sugerido:** abrir un `AGENTS.md` específico para `public/m/` y empezar con el **Sprint 0 (setup)**.
>
> *Documento mantenido por Mavis · última actualización: 4 de Junio, 2026*
