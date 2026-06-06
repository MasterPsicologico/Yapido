# Cerebro Central del Repositorio — Misty Mountain

> Memoria evolutiva para IA sobre la arquitectura completa del monorepo.
> **Consulta este archivo SIEMPRE antes de modificar cualquier proyecto.**

---

## Estructura del Monorepo

```
/
├── Yapido (app principal)  — Multi-rol comercio/logística con 20 agentes AI
├── finanzas/               — Gestión financiera personal con IA
├── nimbus/                 — Plataforma de chat y herramientas potenciada por IA
├── public/p/ + src/app/p/  — CineStream: app de streaming de películas
├── docs/                   — Documentación de Yapido (blueprint, backend, responsive)
├── scripts/                — Utilidades (setup, superadmin, fetch data)
└── resources/              — Assets adicionales
```

---

## 1. Yapido (App Principal)

**Ruta raíz** — Next.js 15 + React 19 + Firebase + Genkit (20 agentes AI)

**Propósito:** Plataforma multi-rol de comercio y logística (lavandería, alquiler de lavadoras, delivery).

**Rutas principales:**
- `/` — Dashboard multi-rol (Cliente/Admin/Repartidor)
- `/stores` — Catálogo de tiendas
- `/admin` — Panel de administración
- `/delivery` — Zona de repartidores
- `/washer` — Alquiler de lavadoras

**Puerto dev:** 9002 (turbopack)

**Documentación clave:**
- `docs/blueprint.md` — Diseño del producto
- `docs/backend.json` — Esquema Firestore
- `docs/responsive-design-spec.md` — Sistema de diseño responsive
- `src/APP_KNOWLEDGE.md` — Estado del sistema y funcionalidades

---

## 2. Finanzas Inteligentes (`/finanzas`)

**Next.js 15** — Gestión financiera personal con AI (Genkit + Gemini 2.5 Flash)

**Propósito:** Asistente financiero con chat inteligente, registro de gastos/ingresos, presupuestos, calendario financiero y análisis con IA.

**Rutas:**
- `/finanzas` — Dashboard financiero con tabs: Transacciones, Calendario, Presupuestos, Análisis

**Integración:** Multi-zone routing via Vercel rewrites (producción: `finanzas-beige-ten.vercel.app`) y Next.js rewrites (dev: `localhost:9003`)

**Puerto dev:** 9003

**Documentación:** `finanzas/docs/blueprint.md`, `finanzas/docs/backend.json`

---

## 3. NimbusChat (`/nimbus`)

**Next.js 15 + React 18 + Genkit** — Plataforma AI multi-herramienta

**Propósito:** Chat con IA, análisis de sueños, creación de cómics/cursos, IA vs IA, perfil psicológico, mercado de terapeutas, código Torah, gimnasio mental, y más.

**Rutas principales:**
- `/nimbus` — Landing page
- `/nimbus/c/[chatId]` — Chat con IA
- `/nimbus/dreams` — Análisis de sueños con grabación de voz
- `/nimbus/creator` — Creador de cómics y cursos
- `/nimbus/ia-vs-ia` — Batallas de IA vs IA
- `/nimbus/profile` — Perfil psicológico y análisis emocional
- `/nimbus/syi` — "See Your Insights" — agente de estrategia
- `/nimbus/torah-code` — Código Torah
- `/nimbus/gym` — Gimnasio mental con simulaciones
- `/nimbus/marketplace` — Mercado de terapeutas
- `/nimbus/blog` — Blog con categorías
- `/nimbus/apply` — Solicitud de ingreso

**Integración:** Multi-zone routing con `assetPrefix: '/nimbus'` (producción: `nimbus-sepia-alpha.vercel.app`, dev: `localhost:9004`)

**Puerto dev:** 9004

---

## 4. CineStream (`/p`)

**App cliente.** — Streaming de películas (Firebase + vanilla JS)

**Propósito:** Plataforma de streaming con búsqueda, filtros por género/año/tipo, reproductor de video personalizado con control de calidad y volumen.

**Ruta:** `/p` — Catálogo y reproductor de películas

**Stack:** Vanilla JavaScript (app.js), Firebase Firestore (firestore-service.js), CSS modular (public/p/css/), Font Awesome

**Datos:** Firebase Firestore (`cinestream_movies` collection) + anime movies data JSON

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

- **Dev:** rewrites en `next.config.ts` apuntan a puertos locales
- **Prod:** rewrites en `vercel.json` apuntan a URLs de Vercel
- **Middleware:** excluye `/finanzas`, `/nimbus` de procesamiento

---

## Convenios de Desarrollo

1. **Consultar este archivo** antes de cualquier modificación a nivel repo
2. **Cada subproyecto tiene su propio AGENTS.md** — consultar antes de modificar
3. **No mezclar dependencias** entre proyectos — cada uno tiene su propio `package.json`
4. **Commits descriptivos** — usar convención de prefijos: `feat:`, `fix:`, `chore:`, `docs:`
5. **Pull request a `main`** — mantener la rama principal estable

---

*Última actualización: 29 de Mayo, 2026*
