# CAPABILITIES — Mapa de capacidades Lavadoras

> Estado real (18 Jul 2026) de qué hace cada archivo del proyecto.
> Pensado para que la IA sepa qué tocar y qué deprecar sin abrir 100 archivos.

---

## 0. Resumen ejecutivo

| Módulo | Ruta | % listo | Notas |
|--------|------|---------|-------|
| Reserva cliente `/washer` | `src/components/home/washer-rental/` | 60% | Componentes sólidos pero falta wizard unificado. |
| Waiting room `/washer/waiting-room/[id]` | `src/app/washer/waiting-room/[id]/page.tsx` | ⚠️ 40% | **Lee `orders/{id}` de Yapido, no `washerRentals/{id}`**. Drift que requiere fix. |
| Inventario admin `/admin/washer` | `src/app/admin/washer/[id]/page.tsx` | ⚠️ 30% | Edición de **store** (no de unidad de lavadora). Renombrar. |
| Inventario unidades | (no existe ruta propia) | 0% | Falta `/admin/inventory/washers` para CRUD de `washerInventory`. |
| Pagos Nequi webhook | `src/app/api/payments/nequi/route.ts` | 70% | Lee `orders`, no `washerRentals`. |
| Cron purge-trash | `src/app/api/stores/purge-trash/route.ts` | 100% | OK. |

---

## 1. Reserva cliente — `src/components/home/washer-rental/`

| Archivo | Función |
|---------|---------|
| `WasherRentalCard.tsx` | Card base del flujo (preview resumen). |
| `WasherTimeSelector.tsx` | Selector de horas (4–24). |
| `WasherRouteSelector.tsx` | Selector de ciudad + zona. |
| `WasherAddressInput.tsx` | Input de dirección con autocomplete (Mapbox). |
| `WasherNameInput.tsx` | Nombre del cliente (fallback desde perfil). |
| `WasherPhoneInput.tsx` | Teléfono de contacto. |
| `WasherServiceDetails.tsx` | Tipo de lavadora (standard/premium/industrial). |
| `WasherPaymentSelector.tsx` | Método de pago (Nequi/PSE/cash). |
| `WasherCustomerInfo.tsx` | Step "datos del cliente". |
| `WasherAdminPricingDialog.tsx` | Diálogo admin para fijar tarifa (admin only). |
| `WasherSolicitationDialog.tsx` | Wizard de solicitud (padre). |
| `WasherSolicitationFooter.tsx` / `Header.tsx` | Layout del diálogo. |
| `solicitation/...` | Subcomponentes segmentados (auth, hero, identity, payment, pricing, service). |

**Lacuna:** no hay Endpoint que cree el documento en `washerRentals/`. Hay que añadir `src/app/api/washer-rentals/route.ts` (POST).

---

## 2. Waiting room — `src/app/washer/waiting-room/[id]/`

> ⚠️ **DRIFT CRÍTICO**: el `page.tsx` consulta
> ```ts
> doc(firestore, 'orders', id)
> ```
> debería ser
> ```ts
> doc(firestore, 'washerRentals', id)
> ```

Subcomponentes:
- `TimerHero.tsx` — animación de espera.
- `StatusIdentityCard.tsx` — estado actual del pedido.
- `OffersRadarSection.tsx` — ofertas de repartidores (no aplica a lavadoras simples).
- `RetrySearchSection.tsx` — reintento de búsqueda.

> Las secciones `OffersRadarSection` y `RetrySearchSection` están diseñadas para `orders`, no para `washerRentals` (lavadoras no reciben contraofertas). Reemplazar por una vista de mapa con ETA + driver asignado.

---

## 3. Admin Inventario — `src/app/admin/washer/[id]/page.tsx`

> ⚠️ **MAL ROTULADO**: este archivo edita el documento de **store** (tiene `operatingHours`, `catalogo`, etc.) bajo el slug del store. No es lavadora-unidad.
>
> Acción: renombrar archivo → `src/app/admin/stores/[id]/page.tsx` (consolidar con el genérico) y dejar `src/app/admin/inventory/washers/page.tsx` para `washerInventory`.

---

## 4. `/admin/business-plan` y `/admin/agents`

- `/admin/business-plan` → pieza editorial, funciona.
- `/admin/agents/[id]` → panel de los 20 agentes. Funciona.

---

## 5. `components/agents/logistica/`

Embajador visual de la `LogisticsAgent` (no almacena datos; consume flow):

| Archivo | Función |
|---------|---------|
| `LogisticsPanel.tsx` | Contenedor principal. |
| `LogisticsHeader.tsx` | Header + breadcrumb. |
| `LogisticsStats.tsx` | KPIs logísticos. |
| `LogisticsEmpty.tsx` | Estado vacío. |
| `feed/OrderFeed.tsx`, `feed/OrderFeedItem.tsx` | Cola de operaciones. |
| `timeline/HorizontalTimeline.tsx`, `TimelineNode.tsx`, `timeline-utils.ts` | Línea de tiempo visual. |
| `classification/OrderClassifier.tsx` | Clasificación heurística. |

> ⚠️ Los nombres (`OrderFeed`, `OrderClassifier`) son heredados de Yapido. En lavadoras debería ser `RentalFeed`, `RentalClassifier`. No bloqueante, pero hacer rename en una iteración futura.

---

## 6. Compatibilidad con Yapido padre

Esta app reusa catálogos (`stores`, `products`, `mainCategories`). Para que **no sea una copia de Yapido**, las pantallas de lavadoras deben trabajar **sobre**:
- `washerRentals/{id}` (reservas) — entidad propia.
- `washerInventory/{id}` (unidades) — entidad propia.
- `washerPricing/{id}` (cotizaciones) — entidad propia.
- `fleetMissions/{id}` (compartida, pero filtrada por `type: washer_*`).
- `driverProfiles/{uid}`, `payments/{id}`, `ratings/{id}` (compat Yapido).

> Cualquier pantalla que escriba a `orders/{}` está **fuera de scope** de lavadoras. La regla de oro: si una pantalla toca `orders/{}`, debe migrar a `washerRentals/{}` o eliminarse.

---

## 7. Plan de migración (resumen, ver `DEPRECATION_PLAN.md`)

1. **Crear** `src/app/admin/washer/ page.tsx` (CRUD `washerInventory`).
2. **Crear** `src/app/api/washer-rentals/route.ts` (POST/GET/PATCH).
3. **Refactor** `waiting-room` para leer de `washerRentals` y simplificar componentes no usados.
4. **Renombrar** `src/app/admin/washer/[id]/page.tsx` → `src/app/admin/stores/[id]/page.tsx`.
5. **Eliminar** ofertas/retry en lavadoras (mantener solo ETA + driver).
6. **Rewrite** nequi webhook para apuntar a `washerRentals/{rentalId}/payments/...`.

---

## 8. Referencias rápidas

- Blueprint de producto → `docs/blueprint.md`
- Modelo de datos Firestore → `docs/backend.json`
- Sistema responsive → `docs/responsive-design-spec.md`
- Plan de deprecación Yapido → `docs/DEPRECATION_PLAN.md`
- Reglas Firestore → `firestore.rules`
- Runbook de claves → `SECURITY.md`
