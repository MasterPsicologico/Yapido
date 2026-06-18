# MEMORY.md — NimbusChat Evolutionary Memory

> **Archivo obligatorio.** Consulta este archivo para entender todo sobre el proyecto Nimbus.
> Última actualización: 18 Junio 2026

---

## 1. Identidad del Proyecto

- **Nombre:** NimbusChat / nextn / "Remix: birn"
- **Versión actual:** 0.1.0
- **Stack:** Next.js 15, React 18, TypeScript 5.4, Genkit 1.20, Firebase 11
- **Puerto dev:** 9004 (`npm run dev`)
- **ID Firebase:** `studio-4796645076-6f375` (compartido con Yapido ecosystem)
- **URLs:**
  - Dev: `localhost:9004/nimbus`
  - Prod: `https://nimbus-sepia-alpha.vercel.app/nimbus` (Vercel)
  - Alias: `https://nimbus.yapido.click`

---

## 2. Configuración AI — CAMBIO IMPORTANTE (Junio 2026)

### Situación Anterior (ROTO)
- **Provider:** Google Gemini 2.5 Flash (`googleai/gemini-2.5-flash`)
- **Plugin:** `@genkit-ai/google-genai`
- **Error:** Los créditos de la API de Google se agotaron → todas las queries de IA fallan con error 429/RESOURCE_EXHAUSTED

### Situación Actual (ACTIVO)
- **Provider principal:** NVIDIA Minimax 2.7
- **Modelo:** `nvidia/llama-3.3-nemotron-70b-instruct`
- **Plugin:** `genkitx-openai` (OpenAI-compatible API)
- **Endpoint:** `https://integrate.api.nvidia.com/v1`
- **API Key:** `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`
- **Variable de entorno:** `NVIDIA_API_KEY`

### Configuración en `src/ai/genkit.ts`
```typescript
openAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
  models: [{ name: 'nvidia/llama-3.3-nemotron-70b-instruct', ... }],
}),
model: 'nvidia/llama-3.3-nemotron-70b-instruct'
```

### Providers secundarios (mantenidos para fallback)
- **Google AI:** `GOOGLE_GENAI_API_KEY` (apagado por créditos agotados)
- **Groq:** `GROQ_API_KEY` (funciona pero más lento)

---

## 3. Estructura de Directorios

```
nimbus/
├── docs/
│   ├── blueprint.md        — Diseño original del producto
│   └── backend.json        — Esquema Firestore (258 líneas)
├── src/
│   ├── ai/                 — Genkit + flujos de IA
│   │   ├── genkit.ts       — Configuración de plugins y modelo default
│   │   ├── dev.ts          — Registro de flows para genkit dev
│   │   ├── groq-fallback.ts — Utilidad fallback para Groq
│   │   └── flows/          — 28 flujos especializados de IA
│   ├── app/                — Next.js App Router
│   │   ├── c/[chatId]/     — Chat con IA
│   │   ├── dreams/         — Análisis de sueños
│   │   ├── creator/        — Creador de cómics/cursos
│   │   ├── ia-vs-ia/       — Batallas IA vs IA
│   │   ├── syi/            — See Your Insights (agente estratégico)
│   │   ├── torah-code/     — Código Torah
│   │   ├── gym/            — Gimnasio mental
│   │   ├── profile/        — Perfil psicológico
│   │   ├── marketplace/    — Mercado de terapeutas
│   │   ├── blog/           — Blog
│   │   ├── admin/          — Panel admin
│   │   ├── apply/          — Solicitudes de terapeuta
│   │   ├── recorder/       — Grabación de voz
│   │   ├── legal/          — Páginas legales
│   │   └── diagnostic/     — Diagnóstico
│   ├── components/
│   │   ├── ui/             — shadcn/ui (45+ componentes)
│   │   ├── chat/           — Componentes de chat
│   │   ├── dreams/         — Componentes de sueños
│   │   ├── creator/        — Creador cómics/cursos
│   │   ├── ia-vs-ia/       — IA vs IA
│   │   ├── marketplace/    — Mercado
│   │   ├── profile/        — Perfil psicológico
│   │   ├── syi/            — SYI
│   │   ├── blog/           — Blog
│   │   ├── gym/            — Gimnasio
│   │   ├── torah-code/     — Torah
│   │   ├── recorder/       — Grabación
│   │   ├── shared/         — Compartidos
│   │   └── ThemeToggle.tsx + theme-provider.tsx
│   ├── firebase/           — Provider + hooks de Firebase
│   ├── hooks/              — Custom hooks (use-mobile, use-toast, etc.)
│   └── lib/                — Utils, types, firebase-admin
├── AGENTS.md               — Este archivo (obligatorio consultar)
├── MEMORY.md               — Esta memoria evolutiva
├── PLAN.md                 — Plan evolutivo completo
├── .env.local              — Variables de entorno (NO commitear)
└── package.json            — Deps: genkit 1.20, firebase 11, next 15, etc.
```

---

## 4. Flujos de IA (28 flujos)

| Flujo | Archivo | Descripción |
|-------|---------|-------------|
| Analyze Dream Voice | `analyze-dream-voice.ts` | Análisis de sueños con voz |
| Analyze Audio Recording | `analyze-audio-recording.ts` | Transcripción + informe diagnóstico |
| Analyze Sentiment | `analyze-sentiment.ts` | Análisis de sentimiento |
| Analyze Voice Message | `analyze-voice-message.ts` | Mensajes de voz |
| Blog Flows | `blog-flows.ts` | Generación de contenido blog |
| Classify Intent | `classify-intent.ts` | Clasificación de intención |
| Classify Strategy | `classify-strategy.ts` | Clasificación de estrategia |
| Comic Creation | `comic-creation-flow.ts` | Creación de cómics con IA |
| Course Creation | `course-creation-flow.ts` | Creación de cursos |
| Emergent Agent | `emergent-agent-flow.ts` | Agente emergente IA vs IA |
| Generate Chat Title | `generate-chat-title.ts` | Títulos automáticos de chat |
| Generate Image | `generate-image.ts` | Generación de imágenes |
| Generate Image Prompt | `generate-image-prompt.ts` | Prompts para imágenes |
| Generate Image X | `generate-image-x.ts` | Imágenes alternativa |
| Generate Simulation Feedback | `generate-simulation-feedback.ts` | Feedback de simulaciones |
| Generate User Profile | `generate-user-profile.ts` | Perfiles psicológicos |
| Get Recommended Category | `get-recommended-category.ts` | Recomendación de categorías |
| Get Tactical Advice | `get-tactical-advice.ts` | Consejos tácticos |
| IA Conversation | `ia-conversation-flow.ts` | Conversación entre IAs |
| IA Voice Input | `ia-voice-input-flow.ts` | Entrada de voz para IA |
| Initial Prompt Suggestion | `initial-prompt-suggestion.ts` | Sugerencias de prompt |
| Interpret Dream | `interpret-dream.ts` | Interpretación de sueños |
| Run Simulation | `run-simulation.ts` | Simulaciones |
| Smart Compose Message | `smart-compose-message.ts` | Composición inteligente |
| Speech | `speech.ts` | Procesamiento de voz |
| Summarize Chat History | `summarize-chat-history.ts` | Resumen de chats |
| Torah Code Flow | `torah-code-flow.ts` | Análisis de código Torah |
| Update Psychological Blueprint | `update-psychological-blueprint.ts` | Actualización de perfil |
| Generate Breakdown Exercise | `generate-breakdown-exercise.ts` | Ejercicios de desglose |

---

## 5. Reglas de Desarrollo

1. **assetPrefix:** `/nimbus` — todas las rutas de assets deben considerar este prefijo en prod
2. **Firebase:** Usa la misma instancia que Yapido (`studio-4796645076-6f375`)
3. **Chat:** Las conversaciones se almacenan localmente y en Firebase por usuario
4. **No modificar** configuración de multi-zone routing sin coordinar con Yapido
5. **Todas las páginas** son `'use client'` dado el uso intensivo de Firebase
6. **API Keys:** Nunca hacer commit de `.env.local` — ya está en `.gitignore`

---

## 6. Errores Conocidos (TypeScript)

Hay errores TypeScript pre-existentes en el proyecto:

- `analyze-audio-recording.ts:54` — usa `diarization` (feature Google-only)
- `blog-flows.ts` — falta `slugify` en `@/lib/utils`
- `comic-creation-flow.ts` — type mismatches con el flow
- `torah-code-flow.ts` — propiedades `skipA`/`skipB` no existen
- `apply/page.tsx` — `ChevronLeft` incompatible como JSX
- `blog/[category]/[slug]/page.tsx` — `Duplicate identifier 'User'`

**Acción:** Estos errores deben resolverse. Por ahora no bloquean el build en dev.

---

## 7. Comandos de Desarrollo

```bash
npm run dev           # Next.js dev server en puerto 9004
npm run genkit:dev    # Iniciar Genkit dev server
npm run genkit:watch  # Genkit con watch mode
npm run build         # Build producción
npm run start         # Start producción
npm run lint          # Lint
npm run typecheck     # TypeScript check
```

---

## 8. Historial de Cambios

### 2026-06-18 — Integración NVIDIA Minimax 2.7
- **Problema:** API key de Google Gemini agotada (error 429 RESOURCE_EXHAUSTED)
- **Solución:** Migración a NVIDIA AI API (`genkitx-openai`)
- **Modelo nuevo:** `nvidia/llama-3.3-nemotron-70b-instruct`
- **Endpoint:** `https://integrate.api.nvidia.com/v1`
- **Archivo modificado:** `src/ai/genkit.ts`, `.env.local`, `.env.example`
- **Paquete agregado:** `genkitx-openai@0.30.0`

---

*Este archivo debe consultarse siempre antes de modificar el proyecto. Para el plan evolutivo completo, ver PLAN.md.*