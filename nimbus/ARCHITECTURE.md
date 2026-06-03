# NimbusChat — Arquitectura Completa

> Memoria evolutiva de la arquitectura de Nimbus.
> **Consultar este archivo SIEMPRE antes de modificar cualquier módulo.**
> Última actualización: 2 de Junio de 2026

---

## 1. Descripción General

**Nimbus** es una plataforma de bienestar mental potenciada por IA, construida con Next.js 15, React 18, Firebase (Auth + Firestore + Storage) y Google Genkit (Gemini). Ofrece un psicólogo virtual multi-rol, análisis de sueños, creación de contenido (cómics y cursos), gimnasio emocional, análisis de código Torah, mercado de terapeutas y un sistema de perfil psicológico versionado con informes evolutivos.

**Stack Técnico:**
- **Framework:** Next.js 15 (App Router, Turbopack)
- **UI:** React 18 + Tailwind CSS + shadcn/ui + Framer Motion
- **Backend:** Firebase Firestore + Firebase Auth (Google) + Firebase Storage
- **IA:** Google Genkit + Gemini 2.5 Flash
- **Puerto dev:** 9004
- **Producción:** `nimbus-sepia-alpha.vercel.app` (multi-zone via `/nimbus`)

---

## 2. Estructura de Directorios

```
nimbus/src/
├── ai/                          # Flujos de IA (Genkit)
│   ├── genkit.ts                # Configuración de Genkit (AI instance)
│   ├── dev.ts                   # Servidor de desarrollo de Genkit
│   ├── groq-fallback.ts         # Modelo de respaldo Groq
│   └── flows/                   # 29 flujos de IA
│       ├── generate-user-profile.ts     # Perfil psicológico evolutivo ⭐
│       ├── update-psychological-blueprint.ts  # Monólogo interno del chatbot
│       ├── smart-compose-message.ts     # Sugerencias inteligentes de respuesta
│       ├── classify-intent.ts           # Clasificación de intención del usuario
│       ├── classify-strategy.ts         # Clasificación de estrategia terapéutica
│       ├── generate-chat-title.ts       # Generación automática de títulos
│       ├── summarize-chat-history.ts    # Resumen de historial largo
│       ├── initial-prompt-suggestion.ts # Sugerencias iniciales de prompts
│       ├── interpret-dream.ts           # Interpretación de sueños
│       ├── analyze-dream-voice.ts       # Análisis de sueños por voz
│       ├── analyze-voice-message.ts     # Transcripción de voz
│       ├── analyze-audio-recording.ts   # Análisis de grabaciones diagnósticas
│       ├── analyze-sentiment.ts         # Análisis de sentimiento
│       ├── comic-creation-flow.ts       # Creación de cómics con IA
│       ├── course-creation-flow.ts      # Creación de cursos con IA
│       ├── generate-breakdown-exercise.ts  # Ejercicios de ruptura de hábitos
│       ├── generate-image-prompt.ts     # Generación de prompts de imagen
│       ├── generate-image-x.ts          # Generación de imágenes
│       ├── generate-simulation-feedback.ts # Feedback de simulación del gym
│       ├── get-tactical-advice.ts       # Consejos tácticos del gym
│       ├── get-recommended-category.ts  # Categoría recomendada de blog
│       ├── blog-flows.ts                # Flujos del blog (títulos + contenido)
│       ├── ia-conversation-flow.ts      # IA vs IA (debates)
│       ├── ia-voice-input-flow.ts       # Input de voz para IA vs IA
│       ├── emergent-agent-flow.ts       # Agente emergente (Seraph)
│       ├── run-simulation.ts            # Ejecutar simulación del gym
│       ├── speech.ts                    # Síntesis de voz
│       └── torah-code-flow.ts           # Análisis de código Torah (35KB)
│
├── app/                         # Rutas de la aplicación (App Router)
│   ├── page.tsx                 # Landing / redirect
│   ├── layout.tsx               # Layout raíz (providers)
│   ├── loading.tsx              # Loading global animado
│   ├── globals.css              # Estilos globales
│   ├── actions.ts               # Server actions compartidas
│   ├── c/                       # /c/[chatId] — Chat con IA
│   ├── profile/                 # /profile — Perfil psicológico ⭐
│   ├── dreams/                  # /dreams — Análisis de sueños
│   ├── creator/                 # /creator — Creador de cómics/cursos
│   ├── ia-vs-ia/                # /ia-vs-ia — Debates IA vs IA
│   ├── syi/                     # /syi — See Your Insights
│   ├── torah-code/              # /torah-code — Código Torah
│   ├── gym/                     # /gym — Gimnasio mental
│   ├── marketplace/             # /marketplace — Mercado de terapeutas
│   ├── blog/                    # /blog — Blog con artículos IA
│   ├── recorder/                # /recorder — Grabador diagnóstico
│   ├── diagnostic/              # /diagnostic — Vista de diagnósticos
│   ├── apply/                   # /apply — Solicitud de terapeuta
│   ├── admin/                   # /admin — Panel de administración
│   └── legal/                   # /legal — Páginas legales
│
├── components/                  # Componentes React
│   ├── chat/                    # Sistema de chat completo
│   │   ├── chat-layout.tsx      # Layout con sidebar + panel (carga perfil desde Firestore)
│   │   ├── chat-panel.tsx       # Panel de chat (envío de mensajes, IA response)
│   │   ├── chat-messages.tsx    # Lista de mensajes
│   │   ├── chat-message.tsx     # Mensaje individual (Markdown, código)
│   │   ├── chat-input.tsx       # Input con voz, sugerencias, autocomplete
│   │   ├── chat-sidebar.tsx     # Sidebar con lista de chats paginada
│   │   ├── empty-chat.tsx       # Estado vacío con prompts iniciales
│   │   ├── user-button.tsx      # Botón de usuario con dropdown
│   │   ├── user-credits.tsx     # Créditos del usuario
│   │   ├── AuthRequiredPanel.tsx # Panel de login requerido
│   │   └── image-whiteboard.tsx # Pizarra de generación de imagen
│   ├── profile/                 # Componentes del perfil psicológico
│   │   ├── EmotionalChart.tsx   # Gráfico de evolución emocional (Recharts)
│   │   ├── EmotionalConstellation.tsx  # Grafo 3D de temas (react-force-graph)
│   │   ├── BreakdownExerciseGenerator.tsx  # Generador de ejercicios
│   │   ├── ProfileCryptoAnalysis.tsx  # Análisis del oráculo cripto
│   │   ├── TextSizeControl.tsx  # Control de tamaño de texto
│   │   └── psychological-profile.tsx  # Wrapper (legacy)
│   ├── ui/                      # shadcn/ui components
│   ├── shared/                  # Componentes compartidos
│   ├── landing/                 # Componentes del landing
│   ├── dreams/                  # Componentes de sueños
│   ├── creator/                 # Componentes del creador
│   ├── ia-vs-ia/                # Componentes IA vs IA
│   ├── syi/                     # Componentes SYI
│   ├── torah-code/              # Componentes Torah Code
│   ├── gym/                     # Componentes del gimnasio
│   ├── marketplace/             # Componentes del marketplace
│   ├── blog/                    # Componentes del blog
│   ├── recorder/                # Componentes del grabador
│   ├── admin/                   # Componentes de administración
│   └── apply/                   # Componentes de solicitud
│
├── firebase/                    # Capa de Firebase
│   ├── index.ts                 # Hooks: useAuth, useCollection, useFirestore, useDocument
│   ├── provider.tsx             # FirebaseProvider (Auth + Firestore contexto)
│   ├── client-provider.tsx      # Client-side provider wrapper
│   ├── storage.ts               # Firebase Storage helpers
│   ├── use-doc.ts               # Hook useDocument
│   ├── use-memo-compare.ts      # Comparación memoizada de queries
│   ├── error-emitter.ts         # Emisor de eventos de error
│   └── errors.ts                # Tipos de error de permisos
│
├── hooks/                       # Hooks personalizados
│   ├── use-toast.ts             # Sistema de notificaciones toast
│   ├── use-mobile.tsx           # Detección de móvil (breakpoint)
│   ├── use-collection.ts        # Re-export
│   └── use-firebase.tsx         # Re-export
│
├── lib/                         # Utilidades y configuración
│   ├── firebase.ts              # Firebase config (server-side)
│   ├── firebase-admin.ts        # Firebase Admin SDK
│   ├── types.ts                 # Todos los tipos TypeScript + Zod schemas
│   ├── profile-service.ts       # CRUD atómico del perfil con versionamiento ⭐
│   ├── utils.ts                 # cn() utility
│   ├── placeholder-data.ts      # Datos de placeholder
│   ├── placeholder-images.ts    # Imágenes de placeholder
│   ├── placeholder-images.json  # JSON de imágenes
│   ├── suggestions-fallback.ts  # Sugerencias de fallback
│   ├── torah-text.ts            # Texto de la Torah
│   └── torah-utils.ts           # Utilidades para Torah Code
│
├── docs/                        # Documentación
│   └── backend.json             # Esquema completo de Firestore
│
├── globals.css                  # CSS global + design tokens
├── firestore.rules              # Reglas de seguridad de Firestore
├── storage.rules                # Reglas de seguridad de Storage
└── tailwind.config.ts           # Configuración de Tailwind
```

---

## 3. Módulos — Descripción Detallada

### 3.1 Chat con IA (`/c/[chatId]`)

**Propósito:** Conversación con un psicólogo virtual multi-rol que se adapta al contexto del usuario.

**Cómo funciona:**
1. El usuario envía un mensaje → `chat-panel.tsx` → `handleSendMessage()`
2. El mensaje se guarda en Firestore → `users/{userId}/chats/{chatId}/messages/`
3. Se llama al server action `getAIResponse()` en `app/c/actions.ts`
4. `getAIResponse()` recibe el **perfil psicológico** (desde Firestore), el historial, y el rol actual
5. Se usa `determineAnchorRole()` para seleccionar entre 19+ roles de experto
6. Si el historial > 10 mensajes, se genera un **resumen** con `summarizeChatHistory`
7. La respuesta se genera con el prompt experto que incluye:
   - Identidad del rol (ej: "El Experto en TCC")
   - Directivas conversacionales (validación empática, metáforas, preguntas socráticas)
   - Cianotipo Psicológico completo del usuario
8. Después de responder, se generan sugerencias inteligentes con delay basado en tiempo de lectura
9. Se auto-genera título del chat en la primera interacción

**19 Roles de Experto:**
El Asistente General, TCC, Mindfulness, Coach de Motivación, Terapia Sistémica, Duelo y Pérdida, Filósofo Socrático, Psicología Positiva, Analista de Patrones, Narrador Terapéutico, Especialista en Crisis, Psicoeducación, Psicología Clínica, Organizacional, Sexólogo Clínico, Neuropsicólogo, Terapeuta de Esquemas, Especialista en Trauma, Validador Empático, Experto en Idiomas.

---

### 3.2 Perfil Psicológico (`/profile`) ⭐

**Propósito:** Dashboard de autoconocimiento con análisis IA versionado y evolutivo.

**Cómo funciona:**
1. Al entrar, se carga el perfil desde **Firestore** (`/users/{userId}/profile/main`) → fallback a localStorage
2. Si no hay perfil, se muestra botón "Generar mi perfil ahora"
3. Al generar:
   - Se recolectan los 30 chats más recientes con todos sus mensajes
   - Se carga el perfil anterior completo (si existe) para comparación evolutiva
   - Se envían dos prompts en paralelo (texto + datos emocionales)
   - El resultado se guarda como una **nueva versión** en Firestore (`/profile/main/versions/{version}`)
   - Versionamiento semántico: 1.0 → 1.1 → 1.2...
4. Cada nueva versión incluye un `evolutionSummary` comparativo
5. Si hay nuevos mensajes desde la última generación, se muestra "Actualizar ahora"

**Estructura Firestore:**
```
/users/{userId}/profile/main                → ProfileMain (versión actual + perfil)
/users/{userId}/profile/main/versions/1.0   → ProfileVersion (snapshot v1.0)
/users/{userId}/profile/main/versions/1.1   → ProfileVersion (snapshot v1.1)
```

**Secciones del Dashboard:**
- **Resumen:** Diagnóstico descriptivo, Arquetipo central, Conflicto nuclear, Bucle del hábito
- **Evolución:** Informe evolutivo comparativo (solo si hay versiones previas)
- **Métricas:** Gráfico de evolución emocional + Constelador emocional 3D
- **Análisis Profundo:** Personalidad, Fortalezas, Sesgos cognitivos, Mecanismos de defensa, Recomendaciones
- **Oráculo:** Análisis cripto basado en el perfil

---

### 3.3 Sueños (`/dreams`)

**Propósito:** Análisis de sueños con grabación de voz y múltiples perspectivas interpretativas.

**Cómo funciona:**
1. El usuario describe su sueño (texto o voz)
2. Elige un especialista: Psicológico, Simbólico, Espiritual o Shamánico
3. Se envía al flow `interpret-dream.ts` junto con el perfil psicológico del usuario
4. La interpretación se guarda en Firestore (`/users/{userId}/dreams/`)
5. Se puede ver historial de interpretaciones

---

### 3.4 Creador de Contenido (`/creator`)

**Propósito:** Generación de cómics y cursos educativos con IA.

**Cómics:** El usuario describe una historia → la IA genera character sheets, escenas, diálogos y descriptions → se generan imágenes para cada panel.

**Cursos:** El usuario elige un tema → la IA genera estructura de módulos y capítulos → el contenido se genera capítulo por capítulo bajo demanda.

---

### 3.5 IA vs IA (`/ia-vs-ia`)

**Propósito:** Debates entre dos agentes de IA con opiniones opuestas.

**Cómo funciona:** Dos personas (Dra. Anya Sharma y Dr. Kenji Tanaka) debaten sobre un tema elegido por el usuario. Cada turno tiene un `coherenceScore` que se rastrea para medir la calidad del debate.

---

### 3.6 SYI — See Your Insights (`/syi`)

**Propósito:** Agente estratégico que analiza la vida del usuario y genera insights accionables.

---

### 3.7 Torah Code (`/torah-code`)

**Propósito:** Búsqueda de patrones en el texto de la Torah con 6 modos de análisis:
- **Clásico:** Búsqueda de ELS (Equidistant Letter Sequences) con matrices
- **Resonancia:** Análisis armónico de segmentos del texto
- **Temporal:** Análisis de hilos temporales
- **Armónico:** Análisis de resonancia por libros
- **Destino:** Matriz de cruce entre dos conceptos
- **Futuro:** Análisis predictivo

---

### 3.8 Gimnasio Mental (`/gym`)

**Propósito:** Simulaciones de escenarios sociales/emocionales con feedback de IA.

**Cómo funciona:** El usuario elige un escenario (ej: "Conversación difícil con tu jefe") → la IA adopta el rol de la otra persona → al final, recibe feedback táctico y evaluación.

---

### 3.9 Marketplace (`/marketplace`)

**Propósito:** Mercado de terapeutas verificados con perfiles públicos.

**Datos:** Nombre, foto, rating, especialidades, precio, idiomas, verificación, credenciales, bio.

---

### 3.10 Blog (`/blog`)

**Propósito:** Artículos generados por IA con sistema de créditos y ratings.

**Cómo funciona:** Los usuarios pueden generar artículos (consume créditos), leer artículos existentes y dejar ratings de 1-5 estrellas.

---

### 3.11 Grabador Diagnóstico (`/recorder`)

**Propósito:** Transcripción de grabaciones de audio con generación de informes diagnósticos estructurados (formato DSM-5-TR).

---

### 3.12 Landing & Admin

**Landing (`/`):** Página de inicio con animación y redirección al chat.
**Admin (`/admin`):** Panel para gestionar terapeutas, aplicaciones, artículos.

---

## 4. Estilos Visuales

### Design Tokens
- **Colores:** Definidos en CSS custom properties (`globals.css`)
  - `--background`, `--foreground`, `--card`, `--primary`, `--accent`, `--muted`, `--border`
  - `--chart-1` a `--chart-5` para gráficos
  - Soporte dark/light mode via `ThemeProvider`
- **Tipografía:** System font stack + Google Fonts (configurado en layout)
- **Espaciado:** Tailwind scale (p-4, p-6, p-8, etc.)
- **Bordes:** `border-border/50` (semitransparentes) + `rounded-lg`/`rounded-xl`

### Patrones Visuales
- **Glassmorphism:** `bg-card/50`, `bg-background/50`, `backdrop-blur-sm`
- **Gradientes:** `bg-gradient-to-br from-chart-5 via-chart-1 to-chart-2` para headings
- **Animaciones:** Framer Motion para transiciones y micro-animaciones
- **Cards:** `bg-card/50 border-border/50` como patrón estándar

### Responsive Design

| Breakpoint | Ancho | Adaptaciones |
|---|---|---|
| **Móvil** | < 640px | Sidebar colapsable con trigger, grid 1 col, tabs con texto reducido (10px), padding p-4 |
| **Tablet** | 640-1024px | Grid 2 cols para cards, sidebar visible, padding p-6 |
| **PC** | > 1024px | Max-width 5xl, grid 2-4 cols, padding p-8, tabs con texto completo |

---

## 5. Esquema de Base de Datos (Firestore)

### Colecciones Principales
```
/users/{userId}                              → User profile
/users/{userId}/chats/{chatId}               → Chat sessions
/users/{userId}/chats/{chatId}/messages/     → Messages
/users/{userId}/chatbotState/main            → IA internal state
/users/{userId}/profile/main                 → ProfileMain (latest + version pointer)
/users/{userId}/profile/main/versions/{v}    → ProfileVersion (snapshots)
/users/{userId}/gymSessions/{sessionId}      → Gym sessions
/users/{userId}/dreams/{dreamId}             → Dream interpretations
/users/{userId}/torahCodeHistory/{recordId}  → Torah Code analyses
/therapists/{therapistId}                    → Public therapist profiles
/therapistApplications/{applicationId}       → Therapist applications
/articles/{articleSlug}                      → Blog articles
/articles/{articleSlug}/ratings/{userId}     → Article ratings
/suggestedArticleTitles/{titleId}            → AI-generated title suggestions
/promptSuggestions/{suggestionId}            → Initial chat prompt suggestions
```

### Reglas de Seguridad
- **Datos de usuario** (`/users/{userId}/{document=**}`): Solo el propietario puede leer/escribir
- **Terapeutas** (`/therapists/`): Lectura pública, escritura solo admin
- **Artículos** (`/articles/`): Lectura y creación por autenticados, edición solo admin
- **Aplicaciones** (`/therapistApplications/`): Crear el aplicante, leer/actualizar admin

---

## 6. Flujo de Datos del Perfil Psicológico (Diagrama)

```
┌────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  Chat UI   │────▷│  chat-layout.tsx  │────▷│  Firestore        │
│ (mensajes) │     │  (carga perfil)  │     │  /profile/main    │
└────────────┘     └───────┬──────────┘     └────────┬──────────┘
                           │                         │
                           ▼                         │
                   ┌───────────────┐                 │
                   │  chat-panel   │◁────────────────┘
                   │ (pasa perfil  │   perfil como contexto
                   │  a getAI...)  │
                   └───────┬───────┘
                           │
                           ▼
                   ┌───────────────────┐
                   │  Server Action    │
                   │  getAIResponse()  │
                   │  (usa perfil en   │
                   │   el prompt)      │
                   └───────────────────┘

┌────────────┐     ┌──────────────────┐     ┌───────────────────┐
│ Profile UI │────▷│  profile/page.tsx │────▷│  AI Flow          │
│ "Generar"  │     │  (genera perfil) │     │  generate-user-   │
└────────────┘     └───────┬──────────┘     │  profile.ts       │
                           │                └────────┬──────────┘
                           │                         │
                           ▼                         ▼
                   ┌───────────────────┐     ┌───────────────────┐
                   │ profile-service   │────▷│  Firestore        │
                   │ saveProfileVer()  │     │  /profile/main    │
                   │ (v1.0 → v1.1)    │     │  /versions/1.1    │
                   └───────────────────┘     └───────────────────┘
```

---

*Este archivo se genera y actualiza automáticamente. Consultar antes de cualquier modificación.*
