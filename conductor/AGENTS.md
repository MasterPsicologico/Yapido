# AGENTS — Yapido Movilidad (`public/m/`)

> **Zona:** `public/m/` — App de movilidad yapido.click (moto/auto).
> **Tipo:** Cliente pesado (Next.js + Capacitor) + Firebase backend.
> **Documento maestro:** `docs/arquitectura.md` (léelo antes de tocar código).
> **Estado:** v1.0 — Sprint 0 completo, listo para deploy.

---

## Propósito

Aplicación de ride-sharing para **yapido.click** con:
- Pasajeros que piden viajes en moto o auto.
- Conductores verificados que aceptan y completan servicios.
- Tracking GPS bidireccional en tiempo real.
- Pagos con Wompi (Colombia) y efectivo.
- Modelo operativo inspirado en Didi Conductor.

## Stack (no cambiar sin discutir)

- **Frontend:** Next.js 15 + React 19 + Tailwind + Radix UI + Framer Motion.
- **Estado:** Zustand + XState.
- **Mapas:** Mapbox GL JS + `@mapbox/mapbox-gl-directions`.
- **Nativo:** Capacitor 8 (Android APK).
- **Backend:** Firebase (Auth + Firestore + RTDB + Cloud Functions v2 + FCM + Storage).
- **Pagos:** Wompi (Colombia) — extensible a Stripe.
- **Validación:** Zod (compartido cliente ↔ server).

## Convenciones

1. Lee `docs/arquitectura.md` completo antes de modificar cualquier archivo.
2. Toda mutación crítica (cobros, asignaciones) lleva `requestId` (uuid v4) para idempotencia.
3. Schemas Zod van en `lib/contracts/` y se importan desde Cloud Functions también.
4. Estados de viaje: usa el `state machine` definido en arquitectura §4.4. No agregues estados ad-hoc.
5. GPS: nunca escribas a RTDB sin filtrar `distance > 10m` o `time > 5s`.
6. Commits: `feat(m):`, `fix(m):`, `chore(m):`, `docs(m):`.
7. PRs con: capturas de pantalla + descripción de impacto en el modelo de datos.

## Estructura de carpetas

```
public/m/
├── app/
│   ├── (passenger)/    — rutas Next.js del pasajero
│   ├── (driver)/       — rutas Next.js del conductor
│   └── api/            — endpoints HTTP (Cloud Functions)
├── components/
│   ├── map/            — MapView, RouteMap, DriverMarker
│   ├── trip/           — TripCard, StatusBar, CancelDialog
│   └── shared/         — Button, Sheet, Toast
├── lib/
│   ├── firebase/       — init + clients (auth, db, rtdb, storage, functions)
│   ├── geo/            — geohash, distance, polyline
│   ├── realtime/       — hooks useDriverLocation, useTripStream
│   ├── api/            — fetch wrappers tipados
│   └── contracts/      — Zod schemas (cliente + server)
├── hooks/              — useAuth, useOnline, useGeolocation, useDriverGPS
├── store/              — Zustand: tripStore, userStore, driverStore
├── docs/               — este archivo + arquitectura.md + diagramas
└── styles/
```

## Modelos de datos clave (resumen)

- `users/{uid}` — perfil base (común a pasajero y conductor).
- `passenger_profiles/{uid}` — datos del pasajero.
- `driver_profiles/{uid}` — datos del conductor + estado online.
- `driver_vehicles/{vehicleId}` — vehículo del conductor.
- `driver_documents/{uid}` — documentos para verificación.
- `trips/{tripId}` — historial completo del viaje (source of truth).
- `ratings/{tripId}` — calificación (desnormalizada opcional).
- `payments/{paymentId}` — pagos y liquidaciones.
- `payouts/{payoutId}` — pagos semanales al conductor.

**Reglas Firestore y RTDB:** ver `docs/arquitectura.md` §6.13 y §5.6.

## Endpoints críticos

| Endpoint | Función |
|---|---|
| `POST /api/trips` | Crear viaje → dispara `matchTrip`. |
| `POST /api/trips/:id/accept` | Conductor acepta oferta. |
| `POST /api/trips/:id/cancel` | Cancelar (pasajero o conductor). |
| `POST /api/trips/:id/rate` | Calificar + tip. |
| `POST /api/trips/:id/pay` | Procesar pago (Wompi o cash). |
| `GET /api/fare-estimate` | Cotizar precio antes de solicitar. |

## Contexto de lanzamiento

- **Ciudad piloto:** Aguachica, Cesar (Colombia).
- **Visión:** multi-ciudad desde el día 1 (arquitectura preparada, lanzamiento gradual).
- **Moneda:** COP, timezone `America/Bogota`.
- **Modalidad prioritaria:** **moto** (≈70% del tráfico urbano en ciudades intermedias colombianas).
- **Restricción clave:** offline-first es crítico (zonas con 4G intermitente en periferia).
- **Estrategia detallada:** `docs/expansion-multi-ciudad.md`.

## Sprint actual

→ **S0 — Setup** (ver `arquitectura.md` §9).

Tareas inmediatas:
1. Crear proyecto Firebase `yapido-movilidad` (aislado del e-commerce).
2. Habilitar Auth, Firestore, RTDB, Functions, FCM, Storage.
3. Inicializar `app/` con Next.js 15 + `output: 'export'`.
4. Configurar Capacitor con `webDir: 'out'` y scope para `public/m/`.
5. Crear `lib/contracts/` con primeros schemas Zod (Trip, Driver, User, **City**).
6. **Crear `cities/aguachica`** con: geofence (polígono operativo), pricing (moto + auto, sin surge en v1), zona horaria, contacto soporte WhatsApp.
7. Dibujar y subir polígono del `serviceArea` de Aguachica (calle por calle).

## NO HACER

- ❌ No usar `localStorage` para datos sensibles (token, ubicación).
- ❌ No escribir GPS a Firestore directo → siempre a RTDB.
- ❌ No desplegar Cloud Functions sin `requestId` en mutaciones.
- ❌ No usar `getDocs` en el flujo de viaje (lento) → listeners RTDB o queries indexadas.
- ❌ No hardcodear API keys → siempre `process.env.NEXT_PUBLIC_*` o Secret Manager.

## Referencias

- **Arquitectura completa:** `docs/arquitectura.md`.
- **APK existente Yapido (capacidades ya implementadas):** `../../APK_STRUCTURE.md`.
- **Patrón multi-zona:** `../../AGENTS.md` (raíz).
- **Documentos Firebase:** `../../docs/backend.json`.

---

*Mantenedor: equipo Yapido · última actualización: 4 de Junio, 2026*
