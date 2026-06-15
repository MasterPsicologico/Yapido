# Memoria Evolutiva — Finanzas Inteligentes

> **Proyecto:** [finanzas.yapido.click](https://finanzas.yapido.click)
> **Última auditoría:** 14 de junio, 2026
> **Versión del stack:** Next.js 15.5.9 · React 19.2.1 · Firebase 11.9 · Genkit 1.28 · Gemini 2.5 Flash
> **Estado:** Producción (funcionando), Auth unificado con el ecosistema Yapido, reglas Firestore fusionadas

---

## 1. Identidad y Propósito

Asistente financiero personal con IA, multi-moneda (COP, USD, EUR, MXN), que permite:

- **Registro por chat en lenguaje natural** ("Compré pan 2K y gané 50K" → 2 transacciones automáticas)
- **Registro por voz** (Web Speech API)
- **Escaneo de recibos** (Gemini Vision)
- **Gestión de presupuestos** con estrategias de fondeo (manual / fijo / porcentaje)
- **Calendario financiero** con eventos y recordatorios (3 etapas: pre / start / post)
- **Análisis IA** con insights, patrones conductuales y oportunidades de ahorro
- **Vitality Score** (0-100): salud financiera del usuario
- **Dashboard de "Cuartel"** (Home militar-themed: Caja de Movimientos, Agenda Inteligente, Arquitectura de Metas, Cuartel de Inteligencia)

**Target:** hispanohablantes, mercado colombiano principalmente (default COP), jóvenes/adultos que manejan finanzas personales informales.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Versión | Notas |
|---|---|---|---|
| **Framework** | Next.js (App Router) | 15.5.9 | Turbopack habilitado, `assetPrefix` removido (deploy standalone) |
| **UI Runtime** | React | 19.2.1 | Server Components + Client Components |
| **Lenguaje** | TypeScript | 5.x | `ignoreBuildErrors: true` (riesgo) |
| **Auth & DB** | Firebase | 11.9.1 | Auth + Firestore (sin Storage) |
| **IA** | Genkit + Google GenAI | 1.28.0 | Gemini 2.5 Flash |
| **UI Kit** | shadcn/ui + Radix UI | — | 30+ primitives, Tailwind, Framer Motion |
| **Charts** | Recharts | 2.15.1 | Usado en Analysis view |
| **Formularios** | react-hook-form + zod | — | Validación tipada |
| **Iconos** | lucide-react | 0.475 | Tree-shakeable |
| **Estilos** | Tailwind + tailwindcss-animate | 3.4 | `cn` helper en `lib/utils.ts` |

---

## 3. Arquitectura de Alto Nivel

```
┌──────────────────────────────────────────────────────────────┐
│                    Browser (Client)                          │
│  ┌────────────────────┐    ┌──────────────────────────────┐  │
│  │  React 19 SPA      │◄──►│  Firebase Auth SDK (cached)  │  │
│  │  - Framer Motion   │    │  - Google OAuth              │  │
│  │  - Web Speech API  │    │  - Anonymous / Email         │  │
│  └─────────┬──────────┘    └──────────────────────────────┘  │
└────────────┼─────────────────────────────────────────────────┘
             │  HTTPS
             ▼
┌──────────────────────────────────────────────────────────────┐
│            Next.js (Vercel) — finanzas.yapido.click         │
│  ┌────────────────────┐    ┌──────────────────────────────┐  │
│  │  App Router        │    │  Genkit Flows (Server)       │  │
│  │  layout.tsx        │    │  - chat-registro-financiero  │  │
│  │  page.tsx          │    │  - chat-creacion-evento      │  │
│  │  + features/*      │    │  - scan-receipt-flow         │  │
│  │  + components/*    │    │  - alertas-financieras       │  │
│  └─────────┬──────────┘    └──────────┬───────────────────┘  │
└────────────┼─────────────────────────┼────────────────────────┘
             │                         │
             ▼                         ▼
   ┌──────────────────┐      ┌─────────────────────┐
   │  Firestore       │      │  Google Gemini 2.5  │
   │  (project shared │      │  Flash (text + vision│
   │   with ecosystem)│      │  + audio)           │
   └──────────────────┘      └─────────────────────┘
```

### Flujo de datos típico (registro de transacción):

```
Usuario escribe en chat
    ↓
ChatInterface.tsx (client)
    ↓
initiateGoogleSignIn / chatRegistroFinanciero() [Server Action]
    ↓
Genkit Flow → Gemini → output Zod-validado
    ↓
items[] → addTransaction() (FinanceProvider)
    ↓
setDocumentNonBlocking → Firestore
    ↓
onSnapshot → re-render reactivo
```

---

## 4. Estructura de Directorios

```
finanzas/
├── docs/                              — blueprint.md, backend.json
├── src/
│   ├── ai/                            — capa de IA (Genkit)
│   │   ├── dev.ts                     — entrypoint Genkit dev
│   │   ├── genkit.ts                  — config (defineModel: gemini-2.5-flash)
│   │   └── flows/
│   │       ├── chat-registro-financiero.ts        ← CORE
│   │       ├── chat-creacion-evento-calendario.ts
│   │       ├── scan-receipt-flow.ts               ← Gemini Vision
│   │       └── alertas-financieras-inteligentes.ts
│   ├── app/
│   │   ├── layout.tsx                 — FirebaseClientProvider + FinanceProvider
│   │   ├── page.tsx                   — Home (Tabs: transactions/calendar/budget/analysis)
│   │   └── globals.css
│   ├── components/                    — 30+ componentes UI
│   │   ├── chat-interface.tsx         ← CORE (input de texto + voz + cámara)
│   │   ├── transactions-view.tsx
│   │   ├── budget-view.tsx
│   │   ├── calendar-view.tsx
│   │   ├── analysis-view.tsx
│   │   ├── calculator-overlay.tsx
│   │   ├── vitality-dashboard.tsx
│   │   ├── notification-manager.tsx
│   │   ├── modal-fixer.tsx
│   │   ├── FirebaseErrorListener.tsx   ← throw errors a Next.js
│   │   └── ui/                         — shadcn primitives
│   ├── features/                       — feature-based architecture
│   │   ├── transactions/
│   │   │   ├── transactions-feature.tsx
│   │   │   └── components/
│   │   ├── budget/                     — 4 sub-componentes
│   │   ├── calendar/
│   │   └── analysis/
│   ├── firebase/
│   │   ├── config.ts                   — projectId: studio-4796645076-6f375
│   │   ├── index.ts                    — initializeFirebase()
│   │   ├── provider.tsx                — context + useUser/useFirestore/useAuth
│   │   ├── client-provider.tsx
│   │   ├── non-blocking-login.tsx      — Google, Email, Anonymous
│   │   ├── non-blocking-updates.tsx    — writes no-bloqueantes
│   │   ├── error-emitter.ts            — pub/sub global
│   │   ├── errors.ts                   — FirestorePermissionError
│   │   └── firestore/
│   │       ├── use-collection.tsx      — listener reactivo
│   │       └── use-doc.tsx
│   ├── hooks/
│   │   ├── use-finance-store.tsx       ← GOD HOOK (411 líneas)
│   │   ├── use-finance-store.ts        — barrel re-export
│   │   ├── use-toast.ts
│   │   └── use-mobile.tsx
│   └── lib/
│       ├── utils.ts                    — `cn` helper
│       └── placeholder-images.ts
├── next.config.ts                      — ignoreBuildErrors: true
├── firebase.json                       — solo firestore rules
├── firestore.rules                     — FUSIONADAS (finanzas + lavadoras)
├── .firebaserc
├── studio.json
├── vercel.json
└── package.json
```

---

## 5. Capa de IA (Genkit)

### Modelo activo
```ts
// src/ai/genkit.ts
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',  // texto
});
```

### Flows implementados

| Flow | Input | Output | Uso |
|---|---|---|---|
| `chatRegistroFinanciero` | `{text, context, currentDate}` | `{items: [{intent, type, amount, ...}]}` | Chat principal (CORE) |
| `chatCreacionEventoCalendario` | `{text, currentDate}` | `{items: [{title, date, time, category}]}` | Crear eventos desde chat |
| `scanReceiptFlow` | `{photoDataUri}` (multipart image) | `{items, total, currency}` | Cámara → recibo |
| `alertasFinancierasInteligentes` | `{transactions, budgets}` | `{alerts[]}` | Banners proactivos |

### Prompt destacado (chatRegistroFinanciero)
Sistema de "reutilización obligatoria" de categorías: antes de crear una nueva, busca en el contexto (transacciones históricas del usuario) si ya existe una que cubra el concepto. Mapeo semántico: desayuno/comida/cena → "Alimentación", gasolina/uber → "Transporte", etc.

---

## 6. Capa de Persistencia (Firestore)

### Modelo de datos
```
/users/{userId}                                    ← perfil (creado por lavadoras)
/users/{userId}/transactions/{txId}                ← ingresos/gastos
/users/{userId}/budgets/{budgetId}                 ← presupuestos mensuales
/users/{userId}/calendar_events/{eventId}          ← eventos financieros
/users/{userId}/analysis/{analysisId}              ← análisis IA
/users/{userId}/ia-vs-ia-sessions/...              ← (Nimbus, no se usa)
/system_categories/{categoryId}                    ← categorías globales
```

### Reglas (firestore.rules — fusionadas)
- `users/{userId}` → `allow read: if isSignedIn();` (de lavadoras)
- `transactions/`, `budgets/`, `calendar_events/`, `analysis/` → `isOwnerLegacy(userId)` (uid match)
- Cubre además: `stores`, `orders`, `machines`, `products`, `cities`, `coupons`, `cinestream_movies`, etc.

### Estrategia de persistencia dual
```ts
if (user && db) {
  // Usuario autenticado → Firestore (sync entre dispositivos)
  onSnapshot(collection(db, 'users', user.uid, 'transactions'), ...)
} else {
  // Sin sesión → localStorage (modo offline)
  const localT = localStorage.getItem('finanzas_transactions');
  if (localT) setTransactions(JSON.parse(localT));
}
```

✅ Fortaleza: el usuario puede usar la app sin autenticarse.
⚠️ Riesgo: si un usuario se desautentica, sus datos locales siguen existiendo con `userId: 'local'`.

---

## 7. Capa de UI

### Sistema de diseño
- **Estilo visual:** "Cyber-Luxe" — gradientes, glassmorphism, animaciones fluidas (framer-motion)
- **Tema militar:** "Cuartel", "Vitrinas", "IA Centralizada", "Sincronización Élite"
- **Mobile-first:** bottom tabs en mobile, top tabs en desktop
- **Modismos colombianos:** "halla$go" con íconos, "vitrinear", "Cuartel"

### Patrones recurrentes
- `useMemoFirebase(() => query(...), [deps])` — patrón obligatorio para queries
- `errorEmitter.emit('permission-error', new FirestorePermissionError(...))` — error tipado
- `FirebaseErrorListener` — throw errors capturados por Next.js error boundary
- Server Actions marcadas con `'use server'` (en flows de Genkit)

---

## 8. Infraestructura

### Deploy
- **Vercel** project: `prj_YxRwshdJJ8ASb6qF6gXxAQCWuHUL`
- **Root Directory:** `finanzas/`
- **Production URL:** `https://finanzas.yapido.click`
- **Vercel alias:** `https://finanzas-beige-ten.vercel.app`
- **Build command:** `npm run build` (definido en `vercel.json`)

### Variables de entorno
| Key | Entorno | Vercel | Notas |
|---|---|---|---|
| `GEMINI_API_KEY` | server | ✅ (production/preview/dev) | Requerido para Genkit |
| `NEXT_PUBLIC_*` | client | — | No se usan actualmente |

### DNS (Hostinger)
```
A      @       → 76.76.21.21           (Vercel)
CNAME  *       → cname.vercel-dns.com  (wildcard)
CNAME  auth    → studio-4796645076-6f375.firebaseapp.com
```

### Firebase
- **Project ID:** `studio-4796645076-6f375` (compartido con Yapido/Lavadoras/Nimbus/CineStream)
- **Auth Domain:** `studio-4796645076-6f375.firebaseapp.com`
- **Auth providers:** Google, Email/Password, Anonymous
- **Authorized domains:** `auth.yapido.click`, `yapido.click`, `www.yapido.click`, `lavadoras.yapido.click`, `nimbus.yapido.click`, `salud.yapido.click`, `objetivos.yapido.click`, `animaciones.yapido.click`, `finanzas-beige-ten.vercel.app`, `localhost`

---

## 9. Decisiones Arquitectónicas Tomadas (en esta sesión)

1. **Unificación Firebase** — finanzas migró de `studio-6573252921-70d23` (aislado) a `studio-4796645076-6f375` (compartido). Razón: usuario quiere que las cuentas sean válidas en todo el ecosistema.
2. **Custom auth domain `auth.yapido.click`** — intentado y revertido. Razón: Firebase Auth estándar (plan Spark) no emite certs Let's Encrypt para custom auth domains. Workaround: usar `firebaseapp.com` (sin SSO cross-subdomain automático).
3. **Firestore rules fusionadas** — antes solo existían las de lavadoras en producción. Ahora son un superset (no se rompe nada, se agregan 5 paths de finanzas).
4. **Deploy via Vercel git integration** — `aff202b` y siguientes se desplegaron automáticamente al pushear a `main`.
5. **`GEMINI_API_KEY` agregada a Vercel** — sin esto, el chat devolvía "ERROR EN PROCESAMIENTO INTELIGENTE" porque el flow no podía inicializar Gemini.

---

## 10. Áreas de Mejora Identificadas

### 🔴 Críticas (afectan funcionalidad o seguridad)

| # | Hallazgo | Impacto | Esfuerzo | Recomendación |
|---|---|---|---|---|
| 1 | `typescript.ignoreBuildErrors: true` en `next.config.ts` | Typecheck no bloquea deploys con errores TS. Ya hay 11+ errores preexistentes detectados | Bajo (1h) | Quitar la flag, corregir los errores en `chat-creacion-evento-calendario.ts`, `scan-receipt-flow.ts`, `use-finance-store.tsx`, `toast.tsx`, etc. |
| 2 | `use-finance-store.tsx` es un **god hook de 411 líneas** que mezcla estado, persistencia, lógica de negocio, UI bindings | Testing imposible, refactoring arriesgado, ciclo de re-renders | Alto (1-2 días) | Dividir en 4 hooks: `useTransactions`, `useBudgets`, `useEvents`, `useAnalysis`. Extraer la lógica de `daysUntilDepletion` y `vitalityScore` a funciones puras testeables |
| 3 | `ignoreDuringBuilds: true` (ESLint) | Linter no corre en build, código con malas prácticas pasa | Bajo (30min) | Activar y resolver warnings |
| 4 | `use-finance-store.ts` solo hace `export * from './use-finance-store.tsx'` con extensión `.tsx` en import (rompe TS strict) | TypeScript strict mode falla con `TS5097` | Trivial (5min) | Renombrar a `.tsx` o usar barrel sin extensión |
| 5 | `chat-registro-financiero.ts` prompt usa `{{CURRENT_DATE}}` en el `prompt` template pero el schema declara `CURRENT_DATE: z.string()` — no es válido en Genkit prompts | Genera error en runtime cuando se llama el flow | Bajo (1h) | Usar el formato correcto de Genkit: prompt con variables `{{{name}}}` que matcheen `input.schema` |
| 6 | `FirebaseErrorListener` **throw error en render** rompe la app entera en lugar de mostrar UI | Cualquier permission-error mata la página (UX horrible) | Medio (3h) | Convertir a error boundary que muestre toast/modal en vez de throw |
| 7 | No hay tests (ni unit, ni integration, ni e2e) | Regresiones no se detectan, refactoring arriesgado | Alto (3-5 días setup + ongoing) | Setup Vitest + Testing Library para unit/integration; Playwright para e2e |

### 🟡 Importantes (afectan mantenibilidad o UX)

| # | Hallazgo | Impacto | Esfuerzo | Recomendación |
|---|---|---|---|---|
| 8 | **Dualidad localStorage/Firestore** con `userId: 'local'` cuando no hay sesión | Datos pueden perderse o duplicarse al hacer login. Sin migración automática | Medio (1 día) | Al hacer login, si hay datos en localStorage, preguntar al usuario si quiere sincronizarlos a su cuenta |
| 9 | No hay rate limiting en Genkit flows | Un usuario puede agotar la cuota de Gemini abusando del chat | Medio (4h) | Implementar rate limit con `@upstash/ratelimit` o similar, persistido en Firestore |
| 10 | No hay observabilidad (logs, métricas, tracing) | Imposible debuggear problemas en producción | Alto (2-3 días) | Integrar Sentry + Vercel Analytics + Logtail para Genkit |
| 11 | `ChatInterface` parece ser 1 solo archivo grande (no medido) que maneja texto + voz + cámara + respuesta | Acoplamiento alto, difícil extender | Medio (1 día) | Separar en `TextChatTab`, `VoiceChatTab`, `ReceiptScanTab` con estado independiente |
| 12 | No hay dark mode | El tema dark existe en tokens pero no hay toggle en UI | Bajo (2h) | Agregar toggle con persistencia en localStorage |
| 13 | Calendario solo tiene eventos (no recurrente, no recordatorios nativos) | Limitado como agenda financiera | Alto (3-5 días) | Integrar con servicio push notifications (FCM) o reminders web |
| 14 | Currency switcher solo cambia símbolo, no convierte montos | Engañoso para usuarios multi-moneda | Medio (1 día) | Integrar API de tipo de cambio (exchangerate-api.com) + cachear en Firestore |
| 15 | Firestore queries sin `limit()` en algunas listas | Potencial de leer miles de docs y agotar cuota | Bajo (1-2h) | Agregar `limit(50)` + paginación cursor-based |
| 16 | No hay migraciones de schema de Firestore | Si cambias un campo, los docs viejos quedan con datos inconsistentes | Medio (ongoing) | Crear sistema de versionado (`schemaVersion` field) + scripts de migración |
| 17 | `eslint.ignoreDuringBuilds: true` + `typescript.ignoreBuildErrors: true` = "build a ciegas" | Bugs latentes | Bajo (1h setup + ongoing fixes) | Activar ambos, corregir lo que aparezca |

### 🟢 Nice-to-have (mejoras de polish)

| # | Hallazgo | Impacto | Esfuerzo |
|---|---|---|---|
| 18 | El `Vitality Score` (fórmula 0-100) está hardcoded en el hook | No se puede calibrar ni A/B testear | Bajo (2h) extraer a una utility function |
| 19 | No hay onboarding para nuevos usuarios | Tasa de abandono alta en primer uso | Medio (1-2 días) crear wizard de 3 pasos |
| 20 | No hay export a PDF/CSV de transacciones | Usuarios power lo piden | Bajo (4h) |
| 21 | No hay sharing/social de "logros" (saldo X, racha Y) | Viralidad baja | Medio (1 día) |
| 22 | `package.json` se llama `"nextn"` (placeholder) | Confuso | Trivial (1min) renombrar a `"finanzas-inteligentes"` |
| 23 | `nextn` no aparece en el `vercel.json` del root (no rewrite) | OK si se accede vía subdominio, pero si se accede por `yapido.click/finanzas` no funciona | Bajo (5min) verificar |
| 24 | No hay service worker / PWA | No se puede instalar como app, no funciona offline | Alto (2-3 días) |
| 25 | No hay accesibilidad (a11y) auditada | Exclusión de usuarios con discapacidad | Medio (2-3 días) auditoría WCAG + fixes |

---

## 11. Deuda Técnica Detectada

### Bugs latentes en typecheck (ignorado por flag)
```
src/ai/flows/chat-creacion-evento-calendario.ts(68,7):
  Object literal may only specify known properties, and 'CURRENT_DATE' does not exist in type '{ text: string; }'

src/ai/flows/scan-receipt-flow.ts(25,31):
  No overload matches this call. 'model' does not exist in 'parts[]'

src/components/transactions-view.tsx(148,26):
  Property 'intent' does not exist on type '{ items: ... }'

src/components/ui/toast.tsx(44,20):
  'ToastPrimitives.Root' refers to a value, but is being used as a type here

src/hooks/use-finance-store.ts(4,15):
  An import path can only end with a '.tsx' extension when 'allowImportingTsExtensions' is enabled

src/hooks/use-finance-store.tsx(339,23) y (368,23):
  Argument of type '...' is not assignable to parameter of type 'SetStateAction<Transaction[]>' (type widening)
```

### Inconsistencias detectadas
- Hay DOS archivos: `use-finance-store.ts` y `use-finance-store.tsx` (uno es barrel re-export)
- `studio.json` + `.firebaserc` + `firebase.json` (3 archivos que definen el mismo proyecto Firebase)
- `next.config.ts` y `vercel.json` tienen duplicación conceptual (build/dev commands)
- `AGENTS.md` tiene info desactualizada (menciona Firebase propio, ya es compartido)

---

## 12. Riesgos y Limitaciones

| Riesgo | Probabilidad | Impacto | Mitigación actual |
|---|---|---|---|
| Cuota de Gemini agotada (Free tier: 15 RPM, 1500 RPD) | Media | Chat caído | Ninguna — usar rate limit (mejora #9) |
| Pérdida de datos por bug en `setDocumentNonBlocking` | Baja | Alta | Firestore writes son idempotentes con merge, pero no hay retry |
| Sesión Firebase cacheada de otro proyecto | Baja | Login incorrecto | SDK usa `app.name` automáticamente, no es problema |
| DNS de Hostinger se cae | Baja | Caída total del ecosistema | Migrar a Cloudflare (recomendado) |
| Build falla por error TS nuevo | Media | Deploy bloqueado | Actualmente bloqueado por `ignoreBuildErrors` |
| Vulnerabilidad XSS via prompt injection en Genkit | Baja | Media | Outputs son Zod-validados, pero falta sanitizar el texto del usuario en UI |

---

## 13. Métricas y KPIs sugeridos

Si tuvieras analytics integrado, estas son las métricas que valdría la pena trackear:

| Métrica | Cómo medirla | Por qué importa |
|---|---|---|
| **Transacciones creadas / día / usuario** | Event en Genkit output | Engagement core |
| **% de registros por chat vs manual** | Flag en `addTransaction` source | Valor del AI feature |
| **Tasa de éxito del flow de Genkit** | Try/catch wrapper | Calidad del prompt |
| **Latencia p95 de chat-registro-financiero** | Vercel Analytics | UX |
| **% de usuarios que activan notificaciones** | `notification-manager` log | Retención |
| **Vitality Score promedio** | Firestore aggregate | Health de la base de usuarios |
| **Errores de permission-denied** | errorEmitter listener | Seguridad / reglas |
| **Conversión visitante → registro** | auth events | Funnel |

---

## 14. Roadmap Sugerido (priorizado)

### Sprint 1 (1-2 semanas) — Higiene crítica
- [ ] Quitar `ignoreBuildErrors` y `ignoreDuringBuilds`
- [ ] Corregir los 11+ errores TS preexistentes
- [ ] Renombrar `nextn` → `finanzas-inteligentes` en package.json
- [ ] Fix bug `CURRENT_DATE` en `chat-creacion-evento-calendario.ts`
- [ ] `FirebaseErrorListener` → error boundary con UI amigable
- [ ] Arreglar `use-finance-store.ts` barrel con `.tsx` extension

### Sprint 2 (2-3 semanas) — Refactor estructural
- [ ] Dividir `use-finance-store.tsx` (411 líneas) en 4 hooks cohesivos
- [ ] Setup Vitest + tests para la lógica de `daysUntilDepletion`, `vitalityScore`, `totals`
- [ ] Implementar rate limiting en Genkit flows
- [ ] Validar `useMemoFirebase` en todos los queries (algunos no lo usan)
- [ ] `limit(50)` + paginación en listas grandes

### Sprint 3 (1 mes) — Features
- [ ] Onboarding wizard de 3 pasos
- [ ] Currency switcher con conversión real
- [ ] Export a PDF/CSV
- [ ] Dark mode toggle
- [ ] Sentry integration

### Backlog
- [ ] PWA + offline mode
- [ ] Push notifications (FCM)
- [ ] Social sharing de logros
- [ ] Accesibilidad WCAG AA
- [ ] Migrar DNS a Cloudflare

---

## 15. Conclusión y Recomendación Final

**El proyecto está en un estado funcional y operativo.** La app carga, autentica, registra transacciones y persiste en Firestore. La integración con el ecosistema Yapido está hecha (Auth pool unificado, reglas fusionadas, deploy en Vercel).

**El mayor riesgo inmediato es la deuda de typecheck acumulada** por las flags `ignoreBuildErrors` e `ignoreDuringBuilds`. Esto es una bomba de tiempo: cualquier cambio importante puede introducir bugs que no se detectan hasta producción. **Recomiendo dedicar el Sprint 1 completo a esto antes de tocar más features.**

**El segundo riesgo es la falta de tests.** El `use-finance-store.tsx` es un god hook con lógica crítica (cálculo de vitality score, daysUntilDepletion, totales) que no tiene cobertura. Cualquier refactor del Sprint 2 sin tests es muy arriesgado.

**Tú decides** si priorizamos:
- **(A) Higiene técnica** (Sprint 1) → más lento ahora, más rápido después
- **(B) Features visibles** (onboarding, export, dark mode) → más rápido ahora, más deuda después
- **(C) Refactor del god hook** (Sprint 2) → preparando el terreno para escalar

Mi voto: **(A) primero**, (B) en paralelo si hay capacidad, (C) justo después de tener tests básicos.

---

*Generado el 14 de junio, 2026 — Auditoría técnica completa del proyecto finanzas.yapido.click*
