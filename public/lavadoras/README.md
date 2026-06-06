# Misty Mountain — Monorepo

> Ecosistema multi-aplicación: comercio/logística, finanzas inteligentes, chat AI, y streaming de películas.

## Proyectos

| App | Ruta | Puerto | Stack | Descripción |
|-----|------|--------|-------|-------------|
| **Yapido** | `/` | 9002 | Next.js 15 + React 19 + Firebase + Genkit | Plataforma multi-rol de comercio y logística con 20 agentes AI |
| **Finanzas** | `/finanzas` | 9003 | Next.js 15 + React 19 + Genkit + Gemini | Gestión financiera personal con IA |
| **Nimbus** | `/nimbus` | 9004 | Next.js 15 + React 18 + Genkit + Firebase | Chat AI, sueños, cómics, cursos, IA vs IA |
| **CineStream** | `/p` | — | Vanilla JS + Firebase Firestore | Streaming de películas con búsqueda y reproductor |

## Documentación

| Documento | Propósito |
|-----------|-----------|
| [AGENTS.md](./AGENTS.md) | Cerebro central del monorepo — memoria para IA |
| [docs/blueprint.md](./docs/blueprint.md) | Diseño del producto Yapido |
| [docs/backend.json](./docs/backend.json) | Esquema Firestore de Yapido |
| [docs/responsive-design-spec.md](./docs/responsive-design-spec.md) | Sistema de diseño responsive |
| [src/APP_KNOWLEDGE.md](./src/APP_KNOWLEDGE.md) | Estado del sistema y funcionalidades de Yapido |
| [finanzas/docs/blueprint.md](./finanzas/docs/blueprint.md) | Diseño de Finanzas Inteligentes |
| [finanzas/docs/backend.json](./finanzas/docs/backend.json) | Esquema Firestore de Finanzas |
| [finanzas/AGENTS.md](./finanzas/AGENTS.md) | Cerebro de Finanzas para IA |
| [nimbus/docs/blueprint.md](./nimbus/docs/blueprint.md) | Diseño de NimbusChat |
| [nimbus/AGENTS.md](./nimbus/AGENTS.md) | Cerebro de Nimbus para IA |
| [docs/AGENTS.md](./docs/AGENTS.md) | Cerebro de CineStream para IA |

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

- **Dev:** Rewrites en `next.config.ts` → servidores locales
- **Prod:** Rewrites en `vercel.json` → URLs de Vercel

## Desarrollo Local

```bash
git clone <repo>
cd misty-mountain

# Yapido (root)
npm install
npm run dev              # http://localhost:9002

# Finanzas
cd finanzas && npm install && npm run dev   # http://localhost:9003

# Nimbus
cd nimbus && npm install && npm run dev     # http://localhost:9004

# CineStream
# Estático — solo abrir /p en el navegador
```

---

*Monorepo mantenido por Misty Mountain · 29 de Mayo, 2026*
