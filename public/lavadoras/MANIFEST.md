# MANIFEST — Mapa del Conocimiento

> Índice inteligente de toda la documentación del monorepo Misty Mountain.
> Cada proyecto tiene su propia memoria evolutiva para IA.

---

## Mapa de Documentación

### Yapido (App Principal — `/`)

| Archivo | Contenido |
|---------|-----------|
| [AGENTS.md](./AGENTS.md) | Cerebro central del monorepo — arquitectura multi-zone, convenios |
| [src/APP_KNOWLEDGE.md](./src/APP_KNOWLEDGE.md) | Estado del sistema, funcionalidades implementadas, pendientes |
| [docs/blueprint.md](./docs/blueprint.md) | Identidad del producto "Vitriniando" y guía de diseño |
| [docs/backend.json](./docs/backend.json) | Esquema de datos Firestore (User, Order) |
| [docs/responsive-design-spec.md](./docs/responsive-design-spec.md) | Sistema de diseño responsive (móvil, tablet, desktop) |
| [package.json](./package.json) | Dependencias y scripts del proyecto raíz |

### Finanzas Inteligentes (`/finanzas`)

| Archivo | Contenido |
|---------|-----------|
| [AGENTS.md](./finanzas/AGENTS.md) | Cerebro de Finanzas — arquitectura, flujos IA, entidades |
| [docs/blueprint.md](./finanzas/docs/blueprint.md) | Diseño del producto "Finanzas Inteligentes" |
| [docs/backend.json](./finanzas/docs/backend.json) | Esquema Firestore (6 entidades financieras) |
| [package.json](./finanzas/package.json) | Dependencias y scripts |

### NimbusChat (`/nimbus`)

| Archivo | Contenido |
|---------|-----------|
| [AGENTS.md](./nimbus/AGENTS.md) | Cerebro de Nimbus — todas las rutas, flujos IA, estructura |
| [docs/blueprint.md](./nimbus/docs/blueprint.md) | Diseño original de NimbusChat |
| [package.json](./nimbus/package.json) | Dependencias y scripts |
| [metadata.json](./nimbus/metadata.json) | Metadatos de AI Studio |
| [firebase-blueprint.json](./nimbus/firebase-blueprint.json) | Esquema Firebase de Nimbus |

### CineStream (`/p` — Películas)

| Archivo | Contenido |
|---------|-----------|
| [AGENTS.md](./docs/AGENTS.md) | Cerebro de CineStream — estructura, funcionalidades, reglas |
| [public/p/app.js](./public/p/app.js) | Lógica principal (1061 líneas) |
| [public/p/firestore-service.js](./public/p/firestore-service.js) | Servicio Firestore con rate limiting |
| [public/p/styles.css](./public/p/styles.css) | Estilos base de CineStream |
| [public/p/anime-movies-data.json](./public/p/anime-movies-data.json) | Datos de películas anime |
| [src/app/p/page.tsx](./src/app/p/page.tsx) | Página wrapper Next.js que carga CineStream |

### Scripts y Utilidades

| Archivo | Propósito |
|---------|-----------|
| [scripts/setup-superadmin.ts](./scripts/setup-superadmin.ts) | Configurar superadmin en Firestore |
| [scripts/setup-firebase.js](./scripts/setup-firebase.js) | Setup inicial de Firebase |
| [scripts/init-superadmins.js](./scripts/init-superadmins.js) | Inicializar superadmins |
| [scripts/fetch_anime_movies.js](./scripts/fetch_anime_movies.js) | Obtener datos de anime movies |

### Configuración Global

| Archivo | Propósito |
|---------|-----------|
| [next.config.ts](./next.config.ts) | Config Next.js con rewrites multi-zone |
| [vercel.json](./vercel.json) | Config Vercel (rewrites + crons) |
| [firestore.rules](./firestore.rules) | Reglas de seguridad Firestore |
| [firebase.json](./firebase.json) | Config Firebase Hosting |
| [storage.rules](./storage.rules) | Reglas de Cloud Storage |
| [tailwind.config.ts](./tailwind.config.ts) | Config Tailwind CSS |
| [tsconfig.json](./tsconfig.json) | Config TypeScript |
| [.vscode/settings.json](./.vscode/settings.json) | Config VSCode |

---

## Arquitectura Multi-Zone

```
                    ┌──────────────┐
                    │   Yapido     │
                    │  (puerto 9002)│
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌──────────┐ ┌──────────┐ ┌──────────┐
       │ Finanzas │ │  Nimbus  │ │CineStream│
       │(p. 9003) │ │(p. 9004) │ │(estático)│
       └──────────┘ └──────────┘ └──────────┘
```

**Dev:** `next.config.ts` rewrites → `localhost:9003` (finanzas), `localhost:9004` (nimbus)
**Prod:** `vercel.json` rewrites → `finanzas-beige-ten.vercel.app`, `nimbus-sepia-alpha.vercel.app`
**CineStream:** Estático en `/p`, servido directamente por Yapido

---

*Generado: 29 de Mayo, 2026 — Mantenido por Misty Mountain*
