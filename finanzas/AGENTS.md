# Cerebro de Finanzas Inteligentes — AGENTS.md

> Memoria para IA sobre la arquitectura de Finanzas.
> **Consulta obligatoria antes de modificar cualquier archivo en `/finanzas`.**

---

## Identidad del Proyecto

- **Nombre:** Finanzas Inteligentes (Smart Finances)
- **Propósito:** Asistente financiero personal con IA — registro de gastos/ingresos, presupuestos, calendario financiero, alertas y análisis
- **Stack:** Next.js 15, React 19, TypeScript 5, Genkit 1.28 + Gemini 2.5 Flash, Firebase 11, shadcn/ui
- **ID Firebase:** `studio-6573252921-70d23`
- **URL Prod:** `https://finanzas-beige-ten.vercel.app`

---

## Estructura de Directorios

```
finanzas/
├── docs/
│   ├── blueprint.md        — Diseño del producto (Español)
│   └── backend.json        — Esquema Firestore completo
├── src/
│   ├── ai/
│   │   ├── flows/
│   │   │   ├── alertas-financieras-inteligentes.ts  — Alertas personalizadas
│   │   │   ├── chat-creacion-evento-calendario.ts   — Eventos desde chat
│   │   │   ├── chat-registro-financiero.ts          — Registro por chat
│   │   │   └── scan-receipt-flow.ts                — Escaneo de recibos
│   │   ├── genkit.ts       — Configuración Genkit
│   │   └── dev.ts          — Dev server
│   ├── app/
│   │   ├── layout.tsx      — Layout con FirebaseProvider
│   │   ├── page.tsx        — Dashboard financiero (tabs: Transactions, Calendar, Budget, Analysis)
│   │   └── globals.css     — Estilos globales
│   ├── components/
│   │   ├── ui/             — shadcn/ui components (18+ Radix primitives)
│   │   ├── chat-interface.tsx
│   │   ├── transactions-view.tsx
│   │   ├── budget-view.tsx
│   │   ├── calendar-view.tsx
│   │   ├── analysis-view.tsx
│   │   ├── vitality-dashboard.tsx
│   │   ├── calculator-overlay.tsx
│   │   └── notification-manager.tsx
│   ├── features/
│   │   ├── transactions/   — Feature de transacciones
│   │   ├── budget/         — Feature de presupuestos
│   │   ├── calendar/       — Feature de calendario
│   │   └── analysis/       — Feature de análisis
│   ├── firebase/
│   │   ├── config.ts       — Config Firebase
│   │   ├── provider.tsx    — Firebase provider
│   │   └── firestore/      — Hooks Firestore
│   └── hooks/
│       └── use-finance-store.ts — Estado global financiero
├── next.config.ts          — assetPrefix: '/finanzas'
└── apphosting.yaml         — Firebase App Hosting
```

---

## Entidades Firestore (docs/backend.json)

| Entidad | Colección | Propósito |
|---------|-----------|-----------|
| UserProfile | `/users/{userId}` | Perfil, email, moneda preferida |
| Transaction | `/users/{userId}/transactions/{id}` | Ingresos/gastos |
| Category | Sistema + usuario | Categorías (Food, Transport, etc.) |
| CalendarEvent | `/users/{userId}/calendar_events/{id}` | Eventos y recordatorios |
| Budget | `/users/{userId}/budgets/{id}` | Presupuestos mensuales |
| AnalysisResult | `/users/{userId}/analysis/{id}` | Análisis financiero generado por IA |

---

## Flujos de IA (Genkit)

| Flujo | Propósito |
|-------|-----------|
| `chat-registro-financiero` | Registra gastos/ingresos desde lenguaje natural |
| `chat-creacion-evento-calendario` | Crea eventos de calendario desde chat |
| `scan-receipt-flow` | Escanea recibos con IA |
| `alertas-financieras-inteligentes` | Genera alertas personalizadas |

---

## Reglas Específicas

1. **assetPrefix:** `/finanzas` — todas las rutas de assets usan este prefijo
2. **Firebase:** Usa proyecto propio (`studio-6573252921-70d23`) — NO compartir con Yapido
3. **Auth providers:** password, anonymous, google.com
4. **Seguridad:** Firestore rules validan ownership por userId
5. **Multi-zone:** Integrado via rewrites desde Yapido (root)

---

## Comandos de Desarrollo

```bash
npm run dev           # Puerto 9002 (turbopack)
npm run build         # Build producción
npm run genkit:dev    # Iniciar Genkit
npm run typecheck     # TypeScript check
```

---

## Features Pendientes

- [ ] Integrar pasarela de pago real
- [ ] Geofencing automático
- [ ] Refinamiento UX móvil
- [ ] Pruebas de notificaciones push

---

*Última actualización: 29 de Mayo, 2026*
