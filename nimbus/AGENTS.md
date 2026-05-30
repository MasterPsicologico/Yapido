# Cerebro de Nimbus — AGENTS.md

> Memoria para IA sobre la arquitectura de NimbusChat.
> **Consulta obligatoria antes de modificar cualquier archivo en `/nimbus`.**

---

## Identidad del Proyecto

- **Nombre:** NimbusChat / nextn / "Remix: birn"
- **Propósito:** Plataforma AI multi-herramienta con chat, análisis de sueños, creador de cómics/cursos, IA vs IA, perfil psicológico, gimnasio mental, Torah code, y más
- **Stack:** Next.js 15, React 18, TypeScript 5.4, Genkit 1.20, Firebase 11
- **ID Firebase:** `studio-4796645076-6f375`
- **URL Prod:** `https://nimbus-sepia-alpha.vercel.app/nimbus`

---

## Estructura de Directorios

```
nimbus/
├── docs/blueprint.md        — Diseño original del producto
├── src/
│   ├── ai/                  — Flujos de IA (Genkit + Gemini)
│   │   ├── flows/           — 25+ flujos especializados
│   │   └── genkit.ts        — Configuración de Genkit
│   ├── app/                 — App Router de Next.js
│   │   ├── c/[chatId]/      — Chat con IA
│   │   ├── dreams/          — Análisis de sueños
│   │   ├── creator/         — Creador de cómics y cursos
│   │   ├── ia-vs-ia/        — Batallas IA vs IA
│   │   ├── syi/             — See Your Insights
│   │   ├── torah-code/      — Código Torah
│   │   ├── gym/             — Gimnasio mental
│   │   ├── profile/         — Perfil psicológico
│   │   ├── marketplace/     — Mercado de terapeutas
│   │   ├── blog/            — Blog
│   │   ├── admin/           — Admin panel
│   │   ├── apply/           — Solicitudes
│   │   ├── recorder/        — Grabación de voz
│   │   ├── legal/           — Páginas legales
│   │   └── diagnostic/      — Diagnóstico
│   ├── components/          — Componentes React
│   │   ├── ui/              — shadcn/ui (Radix primitives)
│   │   ├── chat/            — Componentes del chat
│   │   ├── dreams/          — Componentes de sueños
│   │   ├── creator/         — Componentes de creación
│   │   ├── ia-vs-ia/        — Componentes IA vs IA
│   │   ├── marketplace/     — Componentes mercado
│   │   ├── profile/         — Componentes perfil
│   │   ├── syi/             — Componentes SYI
│   │   ├── blog/            — Componentes blog
│   │   ├── gym/             — Componentes gimnasio
│   │   ├── torah-code/      — Componentes Torah
│   │   └── recorder/        — Componentes grabación
│   ├── firebase/            — Conexión Firebase
│   ├── hooks/               — Custom hooks
│   └── lib/                 — Utilidades y tipos
├── metadata.json            — Metadatos AI Studio
├── next.config.js           — Config con assetPrefix: '/nimbus'
└── firebase-blueprint.json  — Esquema Firestore
```

---

## Flujos de IA (Genkit)

| Flujo | Archivo | Propósito |
|-------|---------|-----------|
| Analyze Dream Voice | `analyze-dream-voice.ts` | Analiza voz grabada sobre sueños |
| Analyze Audio Recording | `analyze-audio-recording.ts` | Análisis general de audio |
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

---

## Reglas Específicas

1. **assetPrefix:** `/nimbus` — todas las rutas de assets deben considerar este prefijo
2. **Firebase:** Usa la misma instancia que Yapido (`studio-4796645076-6f375`)
3. **Chat:** Las conversaciones se almacenan localmente y en Firebase por usuario
4. **No modificar** la configuración de multi-zone routing sin coordinar con Yapido
5. **Todas las páginas** son `'use client'` dado el uso intensivo de Firebase

---

## Comandos de Desarrollo

```bash
npm run dev           # Next.js dev server
npm run build         # Build producción
npm run genkit:dev    # Iniciar Genkit
npm run typecheck     # TypeScript check
```

---

*Última actualización: 29 de Mayo, 2026*
