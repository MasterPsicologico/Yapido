# DEPRECATION_PLAN — Lavadoras standalone vs `/washer` en Yapido

> Cómo se consolida el módulo alquiler en **este proyecto**, dejando atrás la implementación legacy dentro de `yapido.click/washer`.

---

## 1. Diagnóstico

Existen dos superficies para el mismo producto de alquiler de lavadoras:

1. **Yapido padre** (`/washer` en `yapido.click`) — implementación legacy, mantiene compatibilidad.
2. **Lavadoras standalone** (este proyecto, `lavadoras.yapido.click`) — superficie canónica.

El objetivo es que **(2)** sea la única superficie operativa. **(1)** solo conserva una redirección + banner temporal por un trimestre.

---

## 2. Fases

### Fase 0 — Congelamiento (en curso, 18 Jul 2026)
- ❄️ Sin nuevas features en `/washer` de Yapido padre.
- ✅ Toda nueva feature entra en `public/lavadoras/`.
- 📘 Documentación canónica migrada a `public/lavadoras/docs/`.

### Fase 1 — Redirección suave (próximo sprint)
- En Yapido padre:

  ```ts
  // next.config.ts (Yapido padre)
  {
    source: '/washer',
    destination: 'https://lavadoras.yapido.click/washer',
    permanent: false,
  },
  {
    source: '/washer/:path*',
    destination: 'https://lavadoras.yapido.click/washer/:path*',
    permanent: false,
  }
  ```

  - `permanent: false` para mantener SEO estable hasta la fase 2.
  - Banner en `/washer` legacy invitando a usar la nueva ruta.

### Fase 2 — Migración de datos (cuando sea estable)
- Los `WasherRental` que vivan en `orders/{}` de Yapido **NO** se migran (no había entidad limpia).
- Solo se invita a los usuarios existentes a recrear reservas en `/washer` de lavadoras.
- Inventario físico: se inicia desde cero en `washerInventory/` (script `seed:washer-inventory` ya creado).

### Fase 3 — Redirect 301 (trimestre siguiente)
- Cambiamos a `permanent: true`.
- Se da de baja públicamente `yapido.click/washer`.
- Solo queda `lavadoras.yapido.click/washer`.

### Fase 4 — Limpieza interna (cuando aplique)
- Eliminar `app/washer/...` de Yapido padre (mantener solo el wrapper de redirect o un banner).

---

## 3. Compatibilidad Auth

Ambos sitios usan la misma cuenta:
```
authDomain: auth.yapido.click
projectId: studio-4796645076-6f375
```

→ El usuario navega de una URL a otra **sin reautenticarse**. Las cookies de sesión de Firebase se comparten a través del subdominio si están configuradas en `.yapido.click`.

### Verificación

- Login en `lavadoras.yapido.click`.
- Visita a `yapido.click/profile`.
- ✅ Sesión activa en ambos.

Si no funciona, ajustar:
```ts
// src/firebase/config.ts (ambos proyectos)
const auth = getAuth(app);
auth.useDeviceLanguage();
await setPersistence(auth, browserLocalPersistence);
```

---

## 4. Compatibilidad Firestore

- Comparten el **mismo proyecto** (`studio-4796645076-6f375`).
- Los documentos `users/{uid}` son únicos.
- Las colecciones específicas de lavadoras (`washerRentals`, `washerInventory`, `washerPricing`) **solo existen** acá; no chocan con Yapido.
- Las colecciones `stores/products/mainCategories/fleet*` se comparten.
- Reglas de Firestore en este proyecto: recortadas y endurecidas (`firestore.rules`).

---

## 5. Compatibilidad de marca

| Superficie | Branding |
|------------|----------|
| `lavadoras.yapido.click` → web | "Lavadoras" (verde yapido + acento violeta) |
| APK | `lavadoras.yapido.click` · appName "Lavadoras" |
| Yapido padre (home, footer) | Mantiene referencias a "Lavadoras" → link externo |

---

## 6. Compatibilidad de tests / CI

- ✅ Tests mínimos de lavadoras corren en pipeline del proyecto (`scripts/test` cuando esté).
- ⚠️ Yapido padre mantiene sus tests legacy sin cambios hasta fase 3.

---

## 7. Riesgos y mitigación

| Riesgo | Mitigación |
|--------|------------|
| Sesión Firebase no se propaga entre subdominios | Configurar cookie domain `.yapido.click`. Si no aplica, forzar login en redirección. |
| Pieza de SEO antiguo pierde ranking | `permanent: false` (302) en fase 1; nuevo sitemap incluye URLs lavadoras. |
| Equipo sigue tocando `/washer` de Yapido por inercia | Codeowners + CODEOWNERS en lavadoras; mensaje PR en Yapido. |

---

## 8. Estado a la fecha

- [x] Documentación propia (blueprint, backend, design, AGENTS, CAPABILITIES).
- [x] Módulo server-only aislado (`src/lib/server/*`).
- [x] APK con icono + splash + biometría + deep links.
- [x] Drift de `appId` corregido en `capacitor.config.ts`.
- [x] Scripts sin claves hardcodeadas.
- [x] Offline mode (SW + IDB + cron warm).
- [x] Reglas Firestore recortadas endurecidas.
- [x] Plan de deprecación (este archivo).
- [ ] Implementar Fase 1 real (rewrites en Yapido padre).
- [ ] Cron job de Fase 3 (`301`).
