# PLAN.md — NimbusChat: Plan Evolutivo Completo

> **Archivo obligatorio.** Consulta este archivo para saber qué existe, qué falta, y hacia dónde va el proyecto.
> Última actualización: 18 Junio 2026

---

## 1. Estado Actual

### 1.1 Lo que FUNCIONA ✅

| Módulo | Estado | Notas |
|--------|--------|-------|
| AI Chat (c/[chatId]) | ✅ Funcional | NVIDIA Minimax 2.7 funcionando |
| Sistema de autenticación Firebase | ✅ Funcional | Misma config que Yapido |
| Almacenamiento local chats | ✅ Funcional | localStorage + Firebase |
| SYI (See Your Insights) | ✅ Funcional | Agente estratégico |
| Torah Code | ✅ Funcional | Análisis de gematría |
| Gimnasio Mental | ✅ Funcional | Simulaciones |
| Grabador de voz (recorder) | ✅ Funcional | Web Audio API |
| Perfil psicológico | ✅ Funcional | Generación de perfiles |
| Dream interpretation | ✅ Funcional | Interpretación de sueños |
| IA vs IA conversation | ✅ Funcional | Agentes Dr. Sharma / Dr. Tanaka |
| Marketplace terapeutas | ✅ Funcional | Lista y detalle de terapeutas |
| Blog | ✅ Funcional | Generación de artículos |
| Aplicación terapeutas (apply) | ✅ Funcional | Formulario de solicitud |
| Creador cómics | ⚠️ Parcial | Errors TS, funcionalidad limitada |
| Creador cursos | ⚠️ Parcial | Depende de comic-creation |
| Página legal (terms, privacy, etc.) | ✅ Funcional | Estáticas |

### 1.2 Lo que NO FUNCIONA ❌

| Módulo | Problema | Prioridad |
|--------|----------|-----------|
| `analyze-audio-recording.ts` | Usa `diarization` (Google-only feature) | Alta |
| `generate-image.ts` | No hay provider de imágenes compatible con NVIDIA | Alta |
| `generate-image-prompt.ts` | Depende de generate-image | Alta |
| `generate-image-x.ts` | Mismo problema | Alta |
| Análisis de sentimiento avanzado | Posibles issues con modelo | Media |
| Transcript con diarización | Feature Google-only | Alta |

### 1.3 Errores TypeScript sin resolver

```
src/ai/flows/analyze-audio-recording.ts(54,46) — 'diarization' no existe
src/ai/flows/blog-flows.ts(18,10) — 'slugify' no existe en utils
src/ai/flows/blog-flows.ts(58,43) — Falta 'expert_role'
src/ai/flows/blog-flows.ts(100,9) — 'transform' no existe
src/ai/flows/comic-creation-flow.ts(60,11) — Expresión siempre truthy
src/ai/flows/comic-creation-flow.ts(215,71) — Type mismatch
src/ai/flows/torah-code-flow.ts(661,85) — 'skipA' no existe
src/ai/flows/torah-code-flow.ts(662,85) — 'skipB' no existe
src/app/apply/page.tsx(21,16) — ChevronLeft JSX component issue
src/app/blog/[category]/[slug]/page.tsx(10,75) — Duplicate identifier 'User'
```

---

## 2. Roadmap de Funcionalidades

### 2.1 Funcionalidades Actuales (Release Actual)

**Core AI:**
- [x] Chat con IA NVIDIA (genkit + llama-3.3-nemotron-70b-instruct)
- [x] 28 flujos de IA especializados
- [x] Sistema de perfiles psicológicos
- [x] Interpretación de sueños
- [x] SYI (See Your Insights) — agente estratégico
- [x] Torah Code — análisis de gematría
- [x] Gimnasio Mental con simulaciones
- [x] Conversaciones IA vs IA (Dra. Sharma + Dr. Tanaka)
- [x] Grabación y análisis de voz
- [x] Generación de artículos de blog

**Social/Professional:**
- [x] Marketplace de terapeutas
- [x] Sistema de solicitudes para terapeutas
- [x] Perfil de terapeuta (detalle)
- [x] Ratings y reseñas

**Infraestructura:**
- [x] Firebase Auth (Google + guest)
- [x] Firestore para persistencia
- [x] Multi-zone routing (Yapido ecosystem)
- [x] PWA-ready (android/ folder existe)
- [x] Tema oscuro/claro

### 2.2 Funcionalidades Pendientes (Próximas Releases)

#### Prioridad ALTA

**AI & Modelos:**
- [ ] Implementar generación de imágenes (evaluar: DALL-E via OpenAI, Stability AI, o Imagen via Vertex AI)
- [ ] Agregar fallback automático cuando NVIDIA falle (usar Groq o Google)
- [ ] Implementar `slugify` en `lib/utils.ts`
- [ ] Resolver errores TypeScript en flows

**UX/UI:**
- [ ] Mejorar responsive design en mobile
- [ ] Optimizar tiempo de carga inicial
- [ ] Implementar service worker para offline
- [ ] Mejorar animaciones de entrada de mensajes

#### Prioridad MEDIA

**AI & Modelos:**
- [ ] Agregar support para tools/function calling en flows
- [ ] Implementar streaming de respuestas
- [ ] Agregar memoria conversacional de largo plazo
- [ ] Soporte para multimodal (imágenes en chat)

**Contenido:**
- [ ] Expandir marketplace con más categorías
- [ ] Sistema de pagos para sesiones con terapeutas
- [ ] Notificaciones push para nuevos mensajes
- [ ] Exportar/importar chats

**Social:**
- [ ] Sistema de comentarios en blog
- [ ] Perfiles de usuario más completos
- [ ] Badges y logros
- [ ] Compartir sueños públicamente

#### Prioridad BAJA (Nice to Have)

- [ ] Gamificación del gimnasio mental
- [ ] Integración con calendario (Google Calendar, Apple Calendar)
- [ ] API pública para developers terceros
- [ ] Integración con wearables (Apple Watch, Fitbit)
- [ ] Modo "focus" para sesiones de terapia
- [ ] Historial de estados de ánimo
- [ ] Weekly/Monthly mood reports

---

## 3. Deuda Técnica

### 3.1 Issues de Tipado

| Archivo | Issue | Dificultad |
|---------|-------|------------|
| `analyze-audio-recording.ts` | `diarization` es feature Google-only | Media |
| `blog-flows.ts` | Falta `slugify`, `expert_role`, `transform` | Baja |
| `comic-creation-flow.ts` | Type mismatches en el flow | Alta |
| `torah-code-flow.ts` | Props `skipA`/`skipB` no existen | Baja |
| `apply/page.tsx` | JSX component type issue con Lucide | Baja |
| `blog/[category]/[slug]/page.tsx` | Duplicate identifier | Baja |

### 3.2 Arquitectura

- [ ] Mover `genkitx-openai` de community plugin a `@genkit-ai/compat-oai` (requiere upgrade genkit a 1.37+)
- [ ] Considerar migración a Vertex AI para tener Gemini + Imagen en mismo provider
- [ ] Separar AI client de la lógica de negocio (actualmente acoplado en flows)

### 3.3 Performance

- [ ] Implementar React Server Components donde sea posible
- [ ] Optimizar bundle size (tree shaking)
- [ ] Lazy load de componentes heavy (Three.js, Recharts)
- [ ] CDN para assets estáticos

### 3.4 Testing

- [ ] Setup de tests unitarios (Jest/Vitest)
- [ ] Tests de integración para flows de AI
- [ ] E2E tests con Playwright
- [ ] Test de carga para endpoints de IA

---

## 4. Variables de Entorno

| Variable | Valor | Estado |
|----------|-------|--------|
| `GOOGLE_GENAI_API_KEY` | `[HIDDEN_KEY]` | ⚠️ Sin créditos |
| `NVIDIA_API_KEY` | `[HIDDEN_KEY]` | ✅ Activo |
| `GROQ_API_KEY` | `[HIDDEN_KEY]` | ✅ Disponible |

---

## 5. Dependencias Clave

| Paquete | Versión | Notas |
|---------|---------|-------|
| `genkit` | 1.20.0 | Actualizable a 1.37+ |
| `@genkit-ai/google-genai` | 1.20.0 | Google está fuera |
| `@genkit-ai/next` | 1.20.0 | Genkit Next.js integration |
| `firebase` | 11.9.1 | Firebase JS SDK |
| `firebase-admin` | 12.2.0 | Firebase Admin SDK |
| `genkitx-groq` | 0.30.0 | Fallback a Groq |
| `genkitx-openai` | 0.30.0 | NVIDIA via OpenAI compat |
| `next` | 15.0.0 | Next.js 15 |
| `react` | 18.3.1 | React 18 |
| `@radix-ui/*` | various | UI primitives |
| `recharts` | 2.15.1 | Gráficos (SYI, profile) |
| `three` | 0.170.0 | 3D en gym/animaciones |
| `framer-motion` | 11.2.10 | Animaciones |

---

## 6. Plan de Migración a Genkit 1.37+

**Por qué:** Para usar `@genkit-ai/compat-oai` (oficial) en lugar de `genkitx-openai` (community).

**Pasos:**
1. Hacer backup de `src/ai/genkit.ts`
2. Eliminar `genkitx-openai` de `package.json`
3. Instalar genkit 1.37+ y `@genkit-ai/compat-oai`
4. Actualizar imports en `genkit.ts`
5. Testear todos los flows

**Riesgos:** Breaking changes en API de genkit. Hacer en branch separado.

---

## 7. Métricas de Éxito

- [ ] Tiempo de respuesta AI < 5 segundos (p95)
- [ ] 0 errores de TypeScript en build
- [ ] Lighthouse performance > 80
- [ ] Chat retention > 30% (usuarios que vuelven en 7 días)
- [ ] NPS > 40

---

## 8. Referencias

- AGENTS.md — Reglas específicas del proyecto
- MEMORY.md — Memoria evolutiva (cambios realizados)
- docs/blueprint.md — Diseño original del producto
- docs/backend.json — Esquema de datos Firestore

---

*Este archivo debe actualizarse cada vez que se completa una funcionalidad o se resuelve un issue de deuda técnica.*