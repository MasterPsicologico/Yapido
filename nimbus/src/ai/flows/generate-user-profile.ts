
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateUserProfileInputSchema = z.object({
  fullChatHistory: z.string().describe('El historial completo y unificado de todas las conversaciones de chat de un solo usuario.'),
  previousProfilesContext: z.string().optional().describe('Temas clave del análisis anterior.'),
  previousFullProfile: z.string().optional().describe('JSON completo del perfil anterior. ESTE CAMPO ES EL FUNDAMENTO EVOLUTIVO Y DEBE PRESERVARSE ÍNTEGRAMENTE.'),
});
export type GenerateUserProfileInput = z.infer<typeof GenerateUserProfileInputSchema>;

const EmotionalStatePoint = z.object({
  date: z.string().describe('La fecha de la entrada (formato AAAA-MM-DD).'),
  sentiment: z.number().describe('Sentimiento general del día (-1 a 1).'),
  summary: z.string().describe('Resumen breve de los temas del día.'),
  keyEvents: z.array(z.string()).describe('1 a 3 eventos clave del día.'),
});

const EmotionalConstellationNodeSchema = z.object({
  id: z.string().describe('Identificador único del tema.'),
  val: z.number().describe('Peso o recurrencia del tema.'),
});

const EmotionalConstellationLinkSchema = z.object({
  source: z.string().describe('ID del nodo de origen.'),
  target: z.string().describe('ID del nodo de destino.'),
  sentiment: z.number().describe('Relación sentimental entre temas (-1 a 1).'),
});

const EmotionalConstellationSchema = z.object({
  nodes: z.array(EmotionalConstellationNodeSchema).describe('5-8 temas principales.'),
  links: z.array(EmotionalConstellationLinkSchema).describe('Conexiones entre temas.'),
});

const CoreArchetypeSchema = z.object({
  title: z.string().describe('Nombre del arquetipo.'),
  description: z.string().describe('Descripción del patrón arquetípico.'),
  strengths: z.string().describe('Cualidades positivas.'),
  challenges: z.string().describe('Dificultades típicas.'),
});

const HabitLoopSchema = z.object({
  trigger: z.string().describe('Disparador recurrente.'),
  thought: z.string().describe('Pensamiento automático.'),
  action: z.string().describe('Acción conductual.'),
  result: z.string().describe('Consecuencia del bucle.'),
});

const GenerateUserProfileOutputSchema = z.object({
  diagnosis: z.string().describe('Diagnóstico descriptivo del estado psicológico.'),
  personality: z.string().describe('Caracterización de la personalidad.'),
  strengths: z.string().describe('Fortalezas psicológicas.'),
  cognitiveBiases: z.array(z.string()).describe('Sesgos cognitivos recurrentes.'),
  defenseMechanisms: z.array(z.string()).describe('Mecanismos de defensa.'),
  recommendations: z.array(z.string()).describe('Recomendaciones personalizadas.'),
  emotionalJourney: z.array(EmotionalStatePoint).describe('Línea de tiempo emocional.'),
  emotionalConstellation: EmotionalConstellationSchema.describe('Grafo de conexiones emocionales.'),
  coreArchetype: CoreArchetypeSchema.describe('Arquetipo central.'),
  coreConflict: z.string().describe('Conflicto nuclear.'),
  habitLoop: HabitLoopSchema.describe('Bucle de comportamiento recurrente.'),
  evolutionSummary: z.string().optional().describe('Análisis narrativo de la evolución respecto al perfil anterior: progreso, retroceso o cambios en cada dimensión.'),
});
export type GenerateUserProfileOutput = z.infer<typeof GenerateUserProfileOutputSchema>;

export async function generateUserProfile(input: GenerateUserProfileInput): Promise<GenerateUserProfileOutput> {
  return generateUserProfileFlow(input);
}

const textAnalysisSchema = z.object({
  diagnosis: z.string(),
  personality: z.string(),
  strengths: z.string(),
  cognitiveBiases: z.array(z.string()),
  defenseMechanisms: z.array(z.string()),
  recommendations: z.array(z.string()),
  coreArchetype: CoreArchetypeSchema,
  coreConflict: z.string(),
  habitLoop: HabitLoopSchema,
  evolutionSummary: z.string().optional(),
});

const emotionalDataSchema = z.object({
  emotionalJourney: z.array(EmotionalStatePoint),
  emotionalConstellation: EmotionalConstellationSchema,
});

// =====================================================================
// PROMPT CUMULATIVO Y EVOLUTIVO — Preserva TODO el historial, solo agrega
// =====================================================================

const textPrompt = ai.definePrompt({
  name: 'generateTextAnalysisPrompt',
  input: { schema: GenerateUserProfileInputSchema },
  output: { schema: textAnalysisSchema },
  prompt: `Eres un psicólogo clínico experto, EJERCICIO EVOLUTIVO CONTINUO de un Cianotipo Psicológico. Tu misión NO es crear un informe nuevo: tu misión es MANTENER, CRECER y REFLEJAR un miroir psychologique acumulativo del usuario a lo largo del tiempo.

# ════════════════════════════════════════════════════════════════════
# REGLAS INVIOLABLES (PSICOLOGÍA EVOLUTIVA NUNCA SE REEMPLAZA)
# ════════════════════════════════════════════════════════════════════

1. **PRESERVACIÓN OBLIGATORIA TOTAL** — Si existe un perfil previo (previousFullProfile), CADA campo textual (diagnosis, personality, strengths, coreArchetype.description/strengths/challenges, coreConflict, habitLoop) y CADA elemento de las listas (cognitiveBiases, defenseMechanisms, recommendations) DEBE incluir TODO el contenido previo LITERALMENTE, más las nuevas observaciones. NUNCA resumas, NUNCA omitas, NUNCA comprimas, NUNCA reescribas lo previo. Solo agrega e integra.

2. **CRECIMIENTO VOLUMÉTRICO NATURAL** — El Cianotipo evoluciona creciendo, como un organismo. Cada campo debe tender a extenderse o, si no hay material genuinamente nuevo, adaptarse lingüísticamente para preservar la coherencia evolutiva.

3. **LENGUAJE EVOLUTIVO PROFESIONAL** — Integra las nuevas observaciones con conectores psicológicos acumulativos:
   - "Manteniéndose en línea con la tendencia previamente identificada de [X], emerge ahora además [Y]…"
   - "Súmese el patrón observado en este nuevo ciclo: se aprecia [Z], conectando con la base ya descrita de [X]…"
   - "El cuadro previamente descrito de [A] se matiza ahora: antaño se manifestaba como [A1]; en las conversaciones recientes toma forma de [A2], sugiriendo una evolución desde [A1] → [A2]."
   - "Confirmando y reforzando lo ya documentado en el informe previo, persiste [X]…"
   - "A la constelación de conflictos internos ya mapeada (…), se añade ahora (…)" 
   - "Si bien en el anterior periodo se identificó [P], en esta actualización se observa [Q]. Esto refleja progreso / regresión / transformación neutra frente a [P]."

4. **COHERENCIA EVOLUTIVA ANTE CONTRADICCIONES** — Si una observación nueva contradice una previa (ej. "antes tímido, ahora extrovertido"), NUNCA borres lo previo. Integra como evolución:
   - "Migración del patrón: descripto inicialmente como X, en este ciclo se observa un viraje paulatino hacia Y, lo que evidencia una transformación del eje X→Y."
   - "Anteriormente se identificó X como rasgo central; ahora el cuadro evidencia un eclipse parcial de X bajo la emergencia de Y. Persisten residuos de X en contextos de…"

5. **LISTAS (cognitiveBiases, defenseMechanisms, recommendations)** — Conserva CADA ÍTEM previo existente, EXCEPTO si la nueva evidencia lo contradice explícitamente. Añade los nuevos con distinción evolutiva ("Además de los sesgos cognitivos previamente mapeados (…), se identifica adicionalmente…"). Si un ítem previo fue refutado por la nueva evidencia, mantenlo marcado: "Históricamente se había identificado X; la nueva evidencia lo matiza hacia Y."

6. **ARQUETIPO / CONFLICTO / BUCLE** — Estos campos son NARRATIVOS y deben crecer lingüísticamente. Conserva las descripciones previas y añádeles las nuevas con continuidad narrativa ("Si bien antes el arquetipo se manifestaba desde la trinchera de X, ahora suma la dimensión complementaria de Y…"). NO reemplaces títulos a menos que el nuevo título sea una evolución clara del previo (ej. "El Guerrero Herido → El Guerrero Herido en su Integración").

7. **EVOLUTIONSUMMARY** — Solo si existe previousFullProfile: describe sistemáticamente el delta respecto al informe previo, área por área (diagnóstico, personalidad, fortalezas, sesgos, defensas, recomendaciones, arquetipo, conflicto, bucle). Indica progreso, regresión, transformación neutra o aparición emergente.

# ════════════════════════════════════════════════════════════════════
# ESTRUCTURA DE SALIDA POR CAMPO
# ════════════════════════════════════════════════════════════════════

Para campos TEXTUALES devolverás UN ÚNICO STRING LARGO que contiene:
   (a) TODO el contenido previo verbatim (manteniéndolo como una memoria psicológica viva)
   (b) SEGUIDO de conexiones evolutivas hacia el nuevo material
   (c) REMATANDO con observaciones frescas recién extraídas

Para las LISTAS devolverás un ARRAY que contiene:
   (a) TODOS los ítems previos existentes
   (b) MÁS cualquier ítem nuevo con distinción clara

# ════════════════════════════════════════════════════════════════════
# DATOS DE ENTRADA
# ════════════════════════════════════════════════════════════════════

{{#if previousFullProfile}}
**PERFIL PSI COLÓGICO PREVIO (MEMORIA VIVA — DEBE INCLUIRSE ÍNTEGRAMENTE EN EL OUTPUT FINAL):**
{{{previousFullProfile}}}
{{/if}}

**Temas clave previos (resumen ejecutivo):**
{{{previousProfilesContext}}}

**Historial del chat (incluye información NUEVA y antigua que no estaba en la previa actualización):**
{{{fullChatHistory}}}

# ════════════════════════════════════════════════════════════════════
# INSTRUCCIÓN FINAL
# ════════════════════════════════════════════════════════════════════

Genera la NUEVA VERSIÓN DEL CIANOTIPO PSICOLÓGICO que:
- Incluye LITERALMENTE todo el contenido previo
- Integra las nuevas observaciones con conectores evolutivos profesionales
- Crece en volumen, nunca decrece
- Mantiene coherencia total con lo ya establecido
- Refleja al usuario como un espejo psicológico que evoluciona con él

Si es la PRIMERA generación (no hay perfil previo), genera el Cianotipo Inicial completo siguiendo el mismo principio de máxima profundidad y trazabilidad.`,
});

const emotionalPrompt = ai.definePrompt({
  name: 'generateEmotionalDataPrompt',
  input: { schema: GenerateUserProfileInputSchema },
  output: { schema: emotionalDataSchema },
  prompt: `Eres un analista emocional evolutivo. Tu misión es EXTENDER la cartografía emocional del usuario con cada actualización del Cianotipo Psicológico. Nunca reemplazas, NUNCA acortas; solo CRECES y refinas la cartografía emocional.

# ════════════════════════════════════════════════════════════════════
# REGLAS EVOLUTIVAS PARA DATOS EMOCIONALES
# ════════════════════════════════════════════════════════════════════

{{#if previousFullProfile}}
**CONSTATE PREVIA (JSON del recorrido emocional previo):**
{{{previousFullProfile}}}

Recupera de ahí los ARRAYS 'emotionalJourney' y 'emotionalConstellation' previos.

# ════════════════════════════════════════════════════════════════════
# emotionalJourney (LÍNEA DE TIEMPO)
# ════════════════════════════════════════════════════════════════════

Devuelve TODOS los puntos emocionales previos LITERALMENTE. Para CADA fecha nueva появившуюся en el historial reciente, AÑADE un nuevo EmotionalStatePoint con información evolutiva ("En línea con el tono previamente descrito para fechas cercanas (…), el día FECHA presenta…").

Si una fecha ya existía en la constelación previa, NO la sobreescribas: CONSERVA el punto previo y agrega una entrada adicional que refleje el nuevo matiz ("Manteniendo el registro previo de FECHA (…), esta actualización matiza/agrega que…").

# ════════════════════════════════════════════════════════════════════
# emotionalConstellation (GRAFO TEMÁTICO)
# ════════════════════════════════════════════════════════════════════

**NODES — Conserva EXACTAMENTE todos los nodos previos en tu output.** Suma nodos nuevos si emergen temáticas nuevas en el historial reciente (id = nombre del tema evolucionado, val = peso actualizado).

Si un nodo previo CAMBIA su peso (val), regístralo como un nodo EVOLUCIONADO: "El nodo [X], que tenía val previo de [old], ahora pasa a [new], reflejando [interpretación evolutiva]."

**LINKS — Conserva TODOS los links previos EXISTENTES.** Agrega nuevos links que emerjan de la nueva cartografía emocional. Si un link previo intensifica o debilita su sentiment, regístralo explícitamente: "Antes el link de [A]→[B] tenía sentiment +0.3; actualmente se observa +0.6, indicando intensificación del vínculo emocional entre ambos nodos."
{{else}}
Esta es la primera cartografía emocional — genera los datos iniciales según:
- emotionalJourney: al menos un punto por cada día DISTINTO en el historial.
- emotionalConstellation: 5-8 nodos principales (val de 1 a 15) y links entre ellos (sentiment de -1 a 1).
{{/if}}

# ════════════════════════════════════════════════════════════════════
# DATOS RECIENTES
# ════════════════════════════════════════════════════════════════════

**Historial del chat (incluye material emocional nuevo):**
{{{fullChatHistory}}}

# ════════════════════════════════════════════════════════════════════
# INSTRUCCIÓN FINAL
# ════════════════════════════════════════════════════════════════════

Devuelve un JSON con emotionalJourney y emotionalConstellation. TODA la información previa forma parte del resultado final. La cartografía emocional evoluciona CRECIENDO y REFINANDO lo previo, nunca destruyéndolo.`,
});

const generateUserProfileFlow = ai.defineFlow(
  {
    name: 'generateUserProfileFlow',
    inputSchema: GenerateUserProfileInputSchema,
    outputSchema: GenerateUserProfileOutputSchema,
  },
  async input => {
    let history = input.fullChatHistory;
    const lines = history.split('\n');
    if (lines.length > 80) {
      history = lines.slice(-80).join('\n');
    }
    if (history.length > 6000) {
      history = history.slice(-6000);
    }
    const truncatedInput = { ...input, fullChatHistory: history };

    // La rotación de modelos entre NVIDIA → Gemini → Groq la hace automáticamente
    // el monkey-patch de `ai.generate()` en src/ai/genkit.ts. Si Gemini se cuota,
    // el siguiente intento usa NVIDIA/Groq sin que este flow tenga que saberlo.
    const [textResult, emotionalResult] = await Promise.all([
      textPrompt(truncatedInput),
      emotionalPrompt(truncatedInput),
    ]);

    return {
      ...textResult.output!,
      ...emotionalResult.output!,
    };
  }
);
