# Cerebro Central del Repositorio — Misty Mountain

> Memoria evolutiva para IA sobre la arquitectura completa del monorepo.
> **Consulta este archivo SIEMPRE antes de modificar cualquier proyecto.**

---

## Estructura del Monorepo

```
/
├── Yapido (app principal)       — Multi-rol comercio/logística con 20 agentes AI
├── finanzas/                    — Gestión financiera personal con IA
├── nimbus/                      — Plataforma de chat y herramientas potenciada por IA
├── public/peliculas/            — CineStream: streaming de películas (vanilla JS)
├── public/objetivos/            — Panel de objetivos / OKR del ecosistema (vanilla JS)
├── public/animaciones/          — Motor 3D procedimental (Vite + Three.js + GSAP)
├── public/lavadoras/            — Next.js app para alquiler de lavadoras
├── public/salud/                — Radar de Suplementos: biohacking + longevidad (vanilla JS)
├── public/z/                    — Yapido Premium Zone (landing editorial del ecosistema)
├── docs/                        — Documentación de Yapido (blueprint, backend, responsive)
├── scripts/                     — Utilidades (setup, superadmin, fetch data)
└── resources/                   — Assets adicionales
```

> **Convención:** las apps autocontenidas en `public/<slug>/` se despliegan como
> subdominios de `yapido.click` (`objetivos.yapido.click`, `animaciones.yapido.click`,
> `lavadoras.yapido.click`). Las apps multi-zone siguen viviendo en paths
> (`/finanzas`, `/nimbus`).

---

## 1. Yapido (App Principal)

**Ruta raíz** — Next.js 15 + React 19 + Firebase + Genkit (20 agentes AI)

**Propósito:** Plataforma multi-rol de comercio y logística (lavandería, alquiler de lavadoras, delivery).

**Firebase (compartido con el ecosistema):** proyecto `studio-4796645076-6f375` con custom auth domain `auth.yapido.click` — una sola sesión activa se comparte entre `yapido.click`, `lavadoras.yapido.click`, `finanzas.yapido.click` y todos los subdominios del ecosistema.

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

## 4. CineStream (`/peliculas`)

**App cliente.** — Streaming de películas (Firebase + vanilla JS)

**Propósito:** Plataforma de streaming con búsqueda, filtros por género/año/tipo, reproductor de video personalizado con control de calidad y volumen.

**Ruta:** `/peliculas` — Catálogo y reproductor de películas

**Stack:** Vanilla JavaScript (app.js), Firebase Firestore (firestore-service.js), CSS modular (public/peliculas/css/), Font Awesome

**Datos:** Firebase Firestore (`cinestream_movies` collection) + anime movies data JSON

**Producción:** `https://peliculas.yapido.click`

---

## 5. Objetivos (`/objetivos`) — Panel de OKR del ecosistema

**App cliente.** — Panel de objetivos semanales (vanilla JS + Firebase opcional)

**Propósito:** Sistema táctico para definir, seguir y marcar como completados objetivos semanales por proyecto. Privado (gate con `?k=TOKEN`), localStorage por defecto, Firestore opcional para sync entre dispositivos.

**Ruta:** `/objetivos`

**Stack:** Vanilla JavaScript, CSS modular, Firebase compat (app + firestore) cargado por CDN

**Características clave:**
- 12 tipos de objetivo predefinidos (integration_partner, user_acquisition, content_publish, feature_release, app_store_setup, marketing_campaign, ai_improvement, data_migration, finance, operational, bug_fix, generic) — cada uno genera su propio formulario de "completado"
- Gate de acceso vía token en query string (`?k=...`)
- Mobile-first con bottom nav, sidebar en desktop
- Import/Export JSON, sync Firebase opcional

**Producción:** `https://objetivos.yapido.click`

---

## 6. Animaciones (`/animaciones`) — Motor 3D procedimental

**App cliente.** — Motor integrado de escenas 3D

**Propósito:** A partir de una descripción en lenguaje natural, genera y renderiza escenas 3D con geometría procedural + assets Blender, anima la cámara y la materia con scroll, y permite exportar el resultado (WebM, PNG, JSON receta).

**Ruta:** `/animaciones`

**Stack:** Vite + TypeScript + Three.js (0.169) + GSAP (3.13) + Anime.js (3.2)
- `src/core/` — motor procedural
- `src/ui/` — capa de interfaz
- `src/utils/` — exporters y helpers

**Características clave:**
- Escena WebGL fullscreen con overlay de scan/bars animado
- Kinetic typography sincronizada con scroll (ScrollTrigger)
- Exporta a WebM (canvas capture), PNG (frame estático), JSON (receta procedural reproducible)
- Scroll-driven 3D: hacer scroll altera la geometría/material de la escena

**Puerto dev:** Vite default (5173), configurado para correr standalone

**Producción:** `https://animaciones.yapido.click`

---

## 7. Lavadoras (`/lavadoras`) — Next.js app standalone

**Next.js 15 + React 19 + Firebase + Capacitor** — App dedicada al alquiler de lavadoras.

**Propósito:** Superficie operativa para el módulo de alquiler de lavadoras. Reservas, calendario, tracking de equipos, panel logístico. Es la versión "standalone" del módulo `/washer` de Yapido, pensada como APK móvil vía Capacitor.

**Ruta:** `/lavadoras`

**Stack:** Next.js 15 + React 19 + Radix UI + Tailwind + shadcn/ui + framer-motion + Firebase + Genkit + Mapbox + Recharts + Capacitor 8 (Android)

**Diferencia con `/washer` de Yapido:** Este es un proyecto Next.js independiente (con su propio `package.json` y `next.config.ts`) que replica y extiende la lógica de lavadoras. El módulo `/washer` de Yapido es la versión embebida dentro del monorepo principal.

**Puerto dev:** 9002 (mismo que Yapido raíz — corre como instancia paralela)

**Producción:** `https://lavadoras.yapido.click`

---

## 8. Premium Zone (`/z`) — Landing editorial del ecosistema

**App cliente.** — Landing page que presenta los 7 productos del ecosistema como manifiesto editorial.

**Propósito:** Vitrina pública del ecosistema. Es la "portada" del monorepo y la primera impresión para nuevos usuarios. No es una app productiva, es una pieza de marca.

**Ruta:** `/z`

**Stack:** HTML5 + CSS3 + Vanilla JS (sin build, todo en CDN)
- **GSAP 3.13** + **ScrollTrigger** — coreografía de scroll, split chars, parallax
- **Lenis 1.1** — smooth scroll
- Fuentes: Archivo Black (display), Inter (body), JetBrains Mono (mono)

**Estilo visual:** Editorial Brutalism. Tipografía extrema, números como elementos de diseño, reglas horizontales gruesas, paleta paper/ink/acid yellow. Cursor custom, loader sequence con contador, marquees, número animado de stats, tabla técnica del stack, long-form manifesto.

**Estructura de archivos:**
- `public/z/index.html` — markup completo
- `public/z/styles.css` — sistema de tokens + secciones
- `public/z/app.js` — interacciones
- `public/z/.gitignore`

**Producción:** `https://yapido.click/z`

---

## 9. Salud (`/salud`) — Radar de Suplementos

**App cliente.** — Analizador de stacks de suplementación con motor de reglas local.

**Propósito:** SPA que analiza la rutina de suplementos del usuario en 8 pasos (edad, género, objetivos, estado, lifestyle, suplementos actuales, medicaciones, presupuesto), detecta interacciones peligrosas, genera un horario óptimo de 24h y recomienda un stack personalizado. Monetiza vía afiliación Amazon/iHerb + email marketing.

**Ruta:** `/salud` → subdominio `salud.yapido.click`

**Stack:** HTML5 + CSS3 + Tailwind CDN + Vanilla JS (sin build step)
- `index.html` — SPA principal (3 vistas: hero / wizard / report)
- `styles.css` — Custom CSS (chips, sliders, gauge, timeline, print)
- `app.js` — UI controller: wizard, transiciones, render del reporte
- `engine.js` — Motor de reglas LOCAL (análisis instantáneo, sin API)
- `ai.js` — Wrapper IA opcional (Gemini / OpenAI-compatible)
- `affiliate.js` — Generador de URLs Amazon/iHerb con tags
- `data/supplements.js` — 36+ suplementos curados
- `data/interactions.js` — 40+ interacciones peligrosas
- `data/goals.js` — 13 objetivos de salud mapeados

**Características clave:**
- Motor de reglas 100% local (sin backend, sin API keys requeridas)
- IA opcional vía `ai-config.js` (no commitear — está en .gitignore)
- Gauge SVG animado con Stack Score
- Timeline de 24h con pills de timing
- Email gate + affiliate disclosure FTC-compliant
- Print/PDF mode con CSS @media print

**Producción:** `https://salud.yapido.click`

---

## Arquitectura Multi-Zone

```
                        ┌──────────────────────┐
                        │   Yapido (root)      │
                        │   puerto 9002         │
                        │   yapido.click        │
                        └──┬────────┬──────┬────┘
                           │        │      │
              ┌────────────┘        │      └────────────┐
              ▼                     ▼                   ▼
       ┌─────────────┐      ┌─────────────┐     ┌─────────────┐
       │  Finanzas   │      │   Nimbus    │     │ CineStream  │
       │ /finanzas   │      │  /nimbus    │     │ peliculas.  │
       │  p. 9003    │      │  p. 9004    │     │ yapido.click│
       │ (path)      │      │  (path)     │     │  (subdom)   │
       └─────────────┘      └─────────────┘     └─────────────┘

       ┌─────────────┐      ┌─────────────┐     ┌─────────────┐
       │  Objetivos  │      │ Animaciones │     │  Lavadoras  │
       │ objetivos.  │      │ animaciones.│     │  lavadoras. │
       │ yapido.click│      │ yapido.click│     │ yapido.click│
       │  (subdom)   │      │  (subdom)   │     │  (subdom)   │
       └─────────────┘      └─────────────┘     └─────────────┘

       ┌─────────────┐      ┌─────────────────────────────┐
       │   Salud     │      │   Premium Zone (landing)    │
       │  salud.     │      │   yapido.click/z            │
       │ yapido.click│      │   editorial brutalism       │
       │  (subdom)   │      └─────────────────────────────┘
       └─────────────┘
```

- **Dev:** rewrites en `next.config.ts` apuntan a puertos locales
- **Prod:** rewrites en `vercel.json` apuntan a subdominios / paths
- **Middleware:** excluye `/finanzas`, `/nimbus` de procesamiento

---

## Convenios de Desarrollo

1. **Consultar este archivo** antes de cualquier modificación a nivel repo
2. **Cada subproyecto tiene su propio AGENTS.md** — consultar antes de modificar
3. **No mezclar dependencias** entre proyectos — cada uno tiene su propio `package.json`
4. **Commits descriptivos** — usar convención de prefijos: `feat:`, `fix:`, `chore:`, `docs:`
5. **Pull request a `main`** — mantener la rama principal estable
6. **Subdominios de `yapido.click`:** `objetivos`, `animaciones`, `lavadoras`, `finanzas`, `nimbus`, `salud`
7. **Paths legados:** `/finanzas`, `/nimbus`, `/p` se mantienen por retrocompatibilidad

---

*Última actualización: 7 de Junio, 2026*
