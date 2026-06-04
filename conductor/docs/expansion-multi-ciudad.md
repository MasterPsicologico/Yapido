# 🌍 Estrategia de Expansión Multi-Ciudad — Yapido Movilidad

> **Ciudad piloto:** Aguachica, Cesar (Colombia).
> **Visión:** Multi-ciudad desde el día 1 (arquitectura preparada para escalar, lanzamiento gradual).
> **Documento complementario a:** `arquitectura.md` (léelo primero).

---

## 1. ¿Por qué Aguachica primero?

| Factor | Aguachica | Implicación técnica |
|---|---|---|
| **Tamaño** | ~100k hab, ciudad intermedia | Matching con radio amplio, baja densidad de conductores. |
| **Modalidad dominante** | **Moto** (>70% del tráfico urbano) | Tunear `matchTrip` para priorizar moto en lanzamiento. |
| **Cobertura 4G** | Intermitente en zonas rurales | **Offline-first es crítico**, no nice-to-have. |
| **Conocimiento local** | Equipo fundador vive/operará aquí | Onboarding de conductores en persona (KYC + vehículo). |
| **Mercado** | Competencia débil (Didi/Uber no operan formalmente) | Oportunidad de ser el primer actor formal. |

**Decisión de diseño:** el sistema debe funcionar **excelente en ciudad pequeña con mala conexión** desde el día 1. Si pasa esa prueba, escala a cualquier ciudad.

---

## 2. Modelo Multi-Ciudad

### 2.1 Principios

1. **Todo registro lleva `cityId`** — desde la primera escritura.
2. **Configuración regional** aislada en colección `cities/{cityId}` (precios base, geofence, comision).
3. **Los conductores y pasajeros son cross-city** (un usuario puede estar en varias ciudades), pero los **viajes son single-city**.
4. **Matching siempre dentro de la misma ciudad** — un conductor en Aguachica jamás recibe ofertas de Valledupar.
5. **Funciones serverless regionalizadas** cerca de la ciudad para reducir latencia.

### 2.2 Estructura del modelo de datos (cambios)

```ts
// Colección cities/ — fuente de verdad de configuración regional
cities/{cityId}
├── cityId: "aguachica" | "valledupar" | "barranquilla" | ...
├── displayName: "Aguachica"
├── region: "cesar" | "atlantico" | ...
├── country: "CO"
├── currency: "COP"
├── timezone: "America/Bogota"
├── geofence: {                           ← bounding box operativa
│   type: "polygon",
│   coordinates: [[[lng,lat], ...]],
│   centerLat: 8.3127,
│   centerLng: -73.6218
│ }
├── pricing: {                            ← base fare por tipo
│   moto:     { base: 3500, perKm: 900,  perMin: 150, minFare: 5000, currency: "COP" },
│   auto:     { base: 4500, perKm: 1400, perMin: 200, minFare: 7000, currency: "COP" },
│   surge: { enabled: false, max: 1.5 }   ← v1: sin surge, mejor UX
│ }
├── serviceArea: {                        ← polígono donde opera el servicio
│   type: "polygon",
│   coordinates: [[[lng,lat], ...]]
│ }
├── status: "active" | "launching" | "paused"
├── launchedAt: Timestamp | null
├── stats: {                              ← caché, actualizado por Cloud Fn
│   activeDrivers: number,
│   tripsToday: number,
│   avgWaitMin: number
│ }
├── supportPhone: string
├── supportWhatsapp: string
└── updatedAt: Timestamp
```

### 2.3 Cambios sobre el modelo original

Añadir/ajustar:

```ts
users/{uid}
├── ... (sin cambios)
└── citiesActive: string[]                ← ciudades donde puede operar (driver: muchas, passenger: 1)

passenger_profiles/{uid}
├── ... (sin cambios)
└── defaultCityId: string                 ← ciudad "home" del pasajero

driver_profiles/{uid}
├── ... (sin cambios)
├── citiesActive: string[]                ← ciudades donde está registrado
├── currentCityId: string                 ← ciudad donde está trabajando AHORA
└── currentGeohash6: string               ← ya existe, ahora también indexado por city

trips/{tripId}
├── ... (sin cambios)
├── cityId: string                        ← OBLIGATORIO
└── pricing: { ... pricingSnapshot de cities/{cityId}/pricing al momento del viaje }
```

### 2.4 Índices Firestore (ajustes)

```json
{
  "indexes": [
    {
      "collectionGroup": "trips",
      "fields": [
        { "fieldPath": "cityId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "timeline.requestedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "trips",
      "fields": [
        { "fieldPath": "passenger.uid", "order": "ASCENDING" },
        { "fieldPath": "cityId", "order": "ASCENDING" },
        { "fieldPath": "timeline.requestedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "driver_profiles",
      "fields": [
        { "fieldPath": "currentCityId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "currentGeohash6", "order": "ASCENDING" }
      ]
    }
  ]
}
```

### 2.5 RTDB: nodos particionados por ciudad

```
/rtdb
├── cities/
│   ├── aguachica/
│   │   ├── drivers_online/    ← SOLO conductores en Aguachica
│   │   ├── trips_live/        ← viajes activos Aguachica
│   │   └── offers/            ← ofertas activas Aguachica
│   ├── valledupar/
│   │   ├── drivers_online/
│   │   ├── trips_live/
│   │   └── offers/
│   └── ...
```

**Ventajas:**
- Queries de matching filtran primero por ciudad (escala).
- Reglas RTDB más simples: conductor solo escribe a `cities/{suCiudad}/...`.
- Aislamientos operativos (si una ciudad tiene problemas, no afecta otras).

**Reglas RTDB (extracto):**
```js
{
  "rules": {
    "cities": {
      "$cityId": {
        "drivers_online": {
          "$driverId": {
            ".read": "auth != null",
            ".write": "auth.uid === $driverId
                       && (root.child('driver_profiles/' + auth.uid + '/currentCityId').val() === $cityId)"
          }
        },
        "trips_live": { ... },
        "offers": { ... }
      }
    }
  }
}
```

---

## 3. Matching con densidad baja (Aguachica, ~50 conductores)

### 3.1 El reto

En Aguachica no podés asumir "hay 10 conductores a 1 km". El matching debe:

- **Esperar más**: timeout por oferta sube a 12s (no 8s).
- **Radio amplio**: hasta 8 km (no 5 km) para encontrar al menos 1 conductor.
- **Pool completo**: si no hay conductor online, notificar a conductores `offline` con push "Hay demanda, ven a trabajar".
- **No castigar al conductor**: si el pasajero no aparece, no cobrar fee de espera los primeros 3 min.

### 3.2 Algoritmo adaptativo por ciudad

```ts
async function matchTrip(tripId: string) {
  const trip = await getTrip(tripId);
  const city = await getCity(trip.cityId);

  const center = geohash.encode(trip.pickup.lat, trip.pickup.lng, 6);
  const cells = [center, ...geohash.neighbors(center)];

  // 1. Candidatos: TODOS los online en la ciudad (Aguachica caben en un solo fetch)
  const snap = await rtdb.ref(`cities/${trip.cityId}/drivers_online`).once('value');
  const candidates = Object.entries(snap.val() ?? {})
    .map(([id, d]) => ({ id, ...d }))
    .filter(d => d.vehicleType === trip.type && d.status === 'online');

  // 2. Ranking con scoring de ciudad (radio más amplio)
  const ranked = candidates
    .map(d => ({
      ...d,
      distance: haversine(d.loc, trip.pickup),
      score: rank(d, trip, city)
    }))
    .filter(d => d.distance < 8) // 8 km en ciudad pequeña
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // 3. Cascada con timeout adaptativo
  const offerTimeout = city.population < 200_000 ? 12_000 : 8_000;
  for (const driver of ranked) {
    const ok = await offerToDriver(driver.id, tripId, offerTimeout);
    if (ok) return;
  }

  // 4. Si nada: push a TODOS los offline de la ciudad
  await sendDemandPushToCity(trip.cityId, trip);
  await markTripAsNoDrivers(trip);
}
```

### 3.3 Función `rank` con variable de ciudad

```ts
function rank(driver, trip, city) {
  const distance = haversine(driver.loc, trip.pickup);
  const maxKm = city.population < 200_000 ? 8 : 5;
  const distScore = Math.max(0, 1 - distance / maxKm);

  // En ciudad chica, premia MUCHO a quien esté más cerca (radio importa más)
  const distWeight = city.population < 200_000 ? 0.65 : 0.50;

  const ratingScore = (driver.rating - 4) / 1;
  const acceptRate = driver.acceptRate30d;
  const idleBonus  = driver.idleMinutes > 3 ? 0.15 : 0; // 3 min en ciudad chica

  return (distWeight * distScore)
       + (0.20 * ratingScore)
       + (0.10 * acceptRate)
       + idleBonus;
}
```

---

## 4. Onboarding de conductores (proceso Aguachica)

### 4.1 Proceso semi-presencial

En ciudades pequeñas no podés confiar 100% en KYC remoto. Modelo híbrido:

1. **Online**: conductor descarga app, sube fotos de cédula, licencia, SOAT, tarjeta de propiedad, fotos del vehículo.
2. **Presencial** (en punto físico o约定的 punto de encuentro): verificación visual de documentos + fotos del vehículo con placas legibles.
3. **Aprobación admin**: desde `/admin/m/conductores/pendientes`.

### 4.2 Campos adicionales al modelo del conductor

```ts
driver_profiles/{uid}
├── ... (existentes)
├── onboarding: {
│   channel: "in_person" | "remote",
│   verificationCity: string,
│   verifiedBy: string | null,        // uid del admin
│   verifiedAt: Timestamp | null,
│   verificationNotes: string | null
│ }
└── market: {                          ← datos de su zona de operación
│   primaryZone: string,              // "centro" | "norte" | "sur" | ...
│   worksWeekends: boolean,
│   worksNights: boolean,
│   vehicleInspectionPassed: boolean
│ }
```

### 4.3 Incentivos de lanzamiento (Aguachica)

- **0% comisión** las primeras 4 semanas al conductor.
- **Bono de $20.000 COP** al conductor que complete 20 viajes en la primera semana.
- **Pasajero**: 3 viajes con 50% de descuento (cupón `BIENVENIDAAGUACHICA`).
- Esto se modela en `pricing.commissionPercent` y en `promo_codes` collection.

---

## 5. Offline-First (crítico para Aguachica)

### 5.1 Estrategia

- **Service worker** que cachea:
  - Mapa de tiles de Aguachica (área operativa) en primera apertura.
  - Historial de viajes del usuario.
  - Foto de perfil, datos básicos del usuario.
- **Cola de mutaciones** en `localStorage` (Zustand persist) con reintento cuando vuelve la red.
- **GPS local** sigue funcionando; cuando vuelve la señal, sincroniza el "gap" al backend con interpolación.

### 5.2 Snippet: cola offline

```ts
// lib/offline-queue.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type PendingMutation = {
  id: string;
  endpoint: string;
  body: unknown;
  createdAt: number;
  retries: number;
};

export const useOfflineQueue = create<{ queue: PendingMutation[] }>()(
  persist(
    (set, get) => ({
      queue: [],
      enqueue: (m: PendingMutation) => set({ queue: [...get().queue, m] }),
      dequeue: (id: string) => set({ queue: get().queue.filter(m => m.id !== id) }),
    }),
    { name: 'yapido-m-offline' }
  )
);

// Reintenta cuando vuelve la conexión
window.addEventListener('online', async () => {
  const { queue, dequeue } = useOfflineQueue.getState();
  for (const m of queue) {
    try {
      await fetch(m.endpoint, { method: 'POST', body: JSON.stringify(m.body) });
      dequeue(m.id);
    } catch {
      m.retries++;
    }
  }
});
```

### 5.3 Tiles de mapa offline

- En la primera conexión sólida (WiFi del conductor o del admin al instalar la app), pre-cachear zoom 12-15 del bounding box de Aguachica.
- Mapbox permite descargar regiones offline con `mapbox.offlineManager`.
- Tamaño estimado: ~50 MB para toda el área operativa.

---

## 6. Rollout por ciudades

### 6.1 Roadmap

| Fase | Ciudad | Disparo | Conductores objetivo | KPI éxito |
|---|---|---|---|---|
| **Piloto cerrado** | Aguachica | Mes 1 (beta con 30 conductores) | 30 | 95% viajes completados. |
| **Piloto abierto** | Aguachica | Mes 2 (público) | 80 | 200 viajes/día. |
| **Expansión 1** | Valledupar | Mes 4 | 150 | 400 viajes/día. |
| **Expansión 2** | Barranquilla / Soledad | Mes 6 | 500 | 1.500 viajes/día. |
| **Expansión 3** | Bogotá / Medellín | Mes 9 | 2.000+ | 5.000+ viajes/día. |

### 6.2 Criterio para abrir nueva ciudad

- Ciudad anterior con **> 80% de tasa de aceptación** sostenida 30 días.
- **NPS conductor > 40**.
- Equipo local identificado (1 líder de operaciones + 1 líder de conductores).
- **Verificación legal** local (permiso municipal, SOAT, pólizas).
- **Marketing**: acuerdo con 1-2 canales locales (radio, Facebook groups).

### 6.3 Adaptaciones por ciudad

| Ciudad | Ajuste principal |
|---|---|
| Aguachica | Radio 8 km, sin surge, offline-first, 0% comisión inicial. |
| Valledupar | Radio 6 km, surge moderado en festival de acordeón. |
| Barranquilla | Radio 5 km, surge normal, integración con Carnaval. |
| Bogotá / Medellín | Radio 3 km, surge completo, multi-zona. |

---

## 7. Configuración del conductor al cambiar de ciudad

```ts
// En el panel del conductor: "¿En qué ciudad vas a trabajar hoy?"
async function setDriverCity(driverId: string, cityId: string) {
  await firestore.doc(`driver_profiles/${driverId}`).update({
    currentCityId: cityId,
    citiesActive: admin.firestore.FieldValue.arrayUnion(cityId),
  });

  // No requiere relogin, sólo cambia el namespace RTDB
  // El siguiente push ya cae en cities/{cityId}/offers/...
}
```

**Reglas RTDB** se encargan de validar que el conductor puede escribir solo a `cities/{currentCityId}/drivers_online/{suId}`.

---

## 8. Costos estimados por ciudad (RTDB)

| Ciudad | Conductores online | GPS GB/día | Costo RTDB GPS/mes |
|---|---|---|---|
| Aguachica | 80 | ~1.9 GB | $285 |
| Valledupar | 150 | ~3.6 GB | $540 |
| Barranquilla | 500 | ~12 GB | $1,800 |
| Bogotá + Medellín | 2,000 | ~48 GB | $7,200 |
| **Total (5 ciudades)** | **2,730** | **~65 GB** | **~$9,800** |

**Lección:** si el modelo se valida en Aguachica con buena UX, **justifica la migración a Cloud Run + MongoDB para tracking** cuando superes 1,000 conductores concurrentes.

---

## 9. Checklist de lanzamiento en nueva ciudad

- [ ] Crear `cities/{cityId}` con geofence, pricing, contacto soporte.
- [ ] Dibujar polígono de `serviceArea` en mapa (calle por calle si es ciudad pequeña).
- [ ] Onboarding de 10-30 conductores fundacionales (presencial).
- [ ] Campaña de marketing local (Facebook Ads geo-targeted, volantes, radio).
- [ ] Habilitar código promo de lanzamiento.
- [ ] Equipo de soporte local con WhatsApp dedicado.
- [ ] Monitoreo diario: tasa de aceptación, tiempo de espera, cancelaciones.
- [ ] Revisión semanal con métricas de las primeras 4 semanas.

---

> **Próximo paso concreto:** ejecutar **Sprint 0** (setup) y crear `cities/aguachica` con su geofence, pricing y onboarding de los primeros 10 conductores.
>
> *Documento mantenido por Mavis · última actualización: 4 de Junio, 2026*
