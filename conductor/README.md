# 🛵 Yapido Movilidad

> App de ride-sharing personalizada para **yapido.click** — modelo Didi Conductor.
> Piloto: **Aguachica, Cesar (Colombia)** · Multi-ciudad desde el día 1.

![Stack](https://img.shields.io/badge/Next.js-15-black) ![Capacitor](https://img.shields.io/badge/Capacitor-8-blue) ![Firebase](https://img.shields.io/badge/Firebase-Backend-orange) ![Mapbox](https://img.shields.io/badge/Mapbox-Maps-lightblue) ![Light Mode](https://img.shields.io/badge/UI-Light_Mode-yellow)

## Estado

✅ **Sprint 0 completo** — código base, configuración, schemas, hooks, state machines, Cloud Functions, UI pasajero y conductor, seed, scripts.
⏳ Pendiente: deploy a Firebase prod, integración Mapbox Directions real, on-call rotación, iconos/splash nativos.

## Quick start (3 minutos)

```bash
# 1. Instalar
cd public/m
npm install

# 2. Configurar env
cp .env.example .env.local
# Completar: NEXT_PUBLIC_FIREBASE_* + NEXT_PUBLIC_MAPBOX_TOKEN

# 3. Emuladores + Next dev (todo en uno)
npm run dev:emu          # Linux/mac
# o
scripts\dev-all.bat      # Windows

# 4. Seed de Aguachica
npm run seed:aguachica

# 5. Seed dev (4 conductores + 1 pasajero fake)
npm run seed:dev

# Abre http://localhost:9005/m
```

## Estructura

```
public/m/
├── app/                              # Next.js App Router
│   ├── (passenger)/                  # Rutas del pasajero
│   ├── (driver)/                     # Rutas del conductor
│   ├── auth/                         # Login OTP
│   └── api/health/                   # Health check
├── components/
│   ├── map/MapView.tsx               # Mapbox GL
│   ├── shared/                       # Button, Input, Loading, Rating
│   ├── layout/Splash.tsx             # Splash animado
│   └── trip/StatusPill.tsx
├── lib/
│   ├── contracts/                    # Zod schemas compartidos
│   ├── firebase/                     # Client + Admin SDK init
│   ├── geo/                          # Geohash, haversine, bbox, polygon
│   ├── realtime/                     # Suscripciones RTDB
│   ├── api/                          # Wrappers a Cloud Functions
│   └── utils/                        # cn, uuid, retry
├── hooks/                            # useAuth, useDriverGPS, useTripStream, useOfflineQueue
├── store/                            # XState machines + Zustand stores
├── functions/                        # Cloud Functions v2 (Node 20 ESM)
│   └── src/
│       ├── handlers/                 # onTripCreated, createTrip, etc.
│       └── lib/                      # fare, matching, geo
├── scripts/                          # seed, dev-all
├── styles/globals.css                # Tailwind + tema claro
├── docs/                             # Documentación técnica
├── firestore.rules                   # Reglas de seguridad
├── rtdb.rules.json                   # Reglas de RTDB (particionado por ciudad)
├── storage.rules                     # Reglas de Storage
├── firebase.json                     # Config de emuladores + deploy
└── package.json
```

## Comandos principales

| Comando | Descripción |
|---|---|
| `npm run dev` | Next.js dev en puerto 9005 |
| `npm run dev:emu` | Emuladores + Next (todo en uno) |
| `npm run emu` | Solo emuladores |
| `npm run build:static` | Build estático para Capacitor |
| `npm run seed:aguachica` | Crea `cities/aguachica` |
| `npm run seed:dev` | 4 conductores + 1 pasajero fake |
| `npm run functions:build` | Compila Cloud Functions |
| `npm run deploy:rules` | Deploy de reglas (Firestore + RTDB + Storage) |
| `npm run deploy:functions` | Deploy de Cloud Functions |
| `npm run deploy:all` | Deploy completo |
| `npm run capacitor:sync` | Build + sync a Android |
| `npm run typecheck` | TypeScript sin emitir |

## Roles y rutas

| Rol | Rutas |
|---|---|
| **Pasajero** | `/m` · `/m/auth` · `/m/(passenger)/home` · `/m/(passenger)/home/search` · `/m/(passenger)/home/confirm` · `/m/(passenger)/trip/[id]` · `/m/(passenger)/history` · `/m/(passenger)/profile` |
| **Conductor** | `/m` · `/m/(driver)/onboarding` · `/m/(driver)/home` · `/m/(driver)/trip/[id]` · `/m/(driver)/trip/done` · `/m/(driver)/earnings` |
| **Admin** (futuro) | `/admin/m/*` (en el monorepo raíz) |

## Modelo de datos (resumen)

```
users/{uid}
  └─ role: passenger | driver | both
passenger_profiles/{uid}
driver_profiles/{uid}
  └─ currentCityId, currentLocation, currentGeohash6, vehicleType, online
driver_vehicles/{id}             ← por conductor
driver_documents/{uid}           ← onboarding KYC
cities/{cityId}                  ← aguachica, valledupar, ...
trips/{tripId}                   ← source of truth del viaje
ratings/{tripId}                 ← desnormalizado
payments/{id}
payouts/{id}                     ← liquidación semanal
fare_estimates/{id}              ← cache

RTDB particionado por ciudad:
  cities/{cityId}/drivers_online/{driverId}
  cities/{cityId}/trips_live/{tripId}
  cities/{cityId}/offers/{driverId}/current
```

## Decisiones clave (resumen)

| Tema | Decisión |
|---|---|
| **Tracking** | RTDB (latencia < 100ms), no WebSockets directos |
| **Asignación** | Cloud Function `onTripCreated` con cascada de ofertas (timeout 12s Aguachica) |
| **Ranking** | Adaptativo: en ciudades < 200k hab el peso de distancia sube de 0.5 a 0.65, radio de 5 a 8 km |
| **Auth** | Phone OTP via Firebase Auth |
| **Mapas** | Mapbox GL JS, estilo `light-v11` |
| **Pagos** | Wompi (Colombia) — extensible a Stripe |
| **Offline** | Service worker + Zustand persist para mutaciones |
| **Comisión lanzamiento** | 0% las primeras 4 semanas en Aguachica |
| **Multi-ciudad** | RTDB particionado por `cities/{cityId}`, matching nunca cruza ciudades |
| **Pricing moto** | base $3.500 + $900/km + $150/min, mín $5.000 |

## Sprint actual (S0 — Setup ✅)

- [x] Estructura + configuración base
- [x] Firebase (reglas, índices, emuladores)
- [x] Schemas Zod (cliente ↔ servidor)
- [x] Lib core (geo, realtime, api, utils)
- [x] State machines (XState)
- [x] Hooks (auth, GPS, trip stream, offline queue)
- [x] Cloud Functions (matching, fare, settlement, rate, cancel, online)
- [x] Layout + modo claro + splash animado
- [x] Componentes compartidos
- [x] App Pasajero (6 pantallas)
- [x] App Conductor (6 pantallas)
- [x] Seed Aguachica + seed dev
- [x] Scripts + manifest
- [ ] Deploy a Firebase prod
- [ ] Iconos/splash nativos en Capacitor
- [ ] Mapbox Directions API server-side
- [ ] Tests E2E con Playwright

## Próximos pasos (Sprint 1 — Onboarding y matching)

1. **Deploy manual de reglas + funciones a dev** (`npm run deploy:rules` y `deploy:functions` apuntando a un proyecto dev).
2. **Conectar Mapbox Directions API** para ETA real (hoy usa haversine).
3. **Poblar el polígono real de Aguachica** con el equipo de operaciones.
4. **Onboarding presencial de los primeros 10-15 conductores** (sincronizar docs desde `App.tsx` con validación en `/admin`).
5. **Beta cerrada**: 30 conductores, 50 pasajeros, feedback diario.
6. **Marketing local**: Facebook Ads geo-targeted a Aguachica, radio local.

## Documentación

- [Arquitectura técnica completa](docs/arquitectura.md)
- [Estrategia de expansión multi-ciudad](docs/expansion-multi-ciudad.md)
- [Diagrama visual HTML](docs/diagramas/arquitectura.html)
- [AGENTS de la zona](AGENTS.md) — convenciones del equipo

## Contacto

- **Mantenedor:** equipo Yapido
- **Brand:** yapido.click
- **Slack interno:** #yapido-movilidad

---

*v1.0 — 4 de Junio, 2026*
