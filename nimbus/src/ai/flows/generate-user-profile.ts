
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateUserProfileInputSchema = z.object({
  fullChatHistory: z.string().describe('El historial completo y unificado de todas las conversaciones de chat de un solo usuario.'),
  previousProfilesContext: z.string().optional().describe('Temas clave del análisis anterior.'),
  previousFullProfile: z.string().optional().describe('JSON completo del perfil anterior para comparación evolutiva detallada.'),
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

const textPrompt = ai.definePrompt({
  name: 'generateTextAnalysisPrompt',
  input: { schema: GenerateUserProfileInputSchema },
  output: { schema: textAnalysisSchema },
  prompt: `Eres un psicólogo clínico experto. Analiza el historial de chats para crear un "Cianotipo Psicológico".

**Instrucciones:**
1. Analiza el historial para entender el estado del usuario.
2. Si hay contexto previo o perfil anterior, identifica tendencias, cambios y progresos.
3. Mantén todos los ítems existentes del perfil anterior como referencia.

Genera un informe con:

1. **Diagnóstico Descriptivo**: Estado psicológico actual, evolución si hay análisis previo.
2. **Caracterización de la Personalidad**: Rasgos, estilo cognitivo, emociones frecuentes.
3. **Fortalezas Psicológicas**: Recursos y cualidades positivas.
4. **Sesgos Cognitivos**: Lista de sesgos recurrentes.
5. **Mecanismos de Defensa**: Estrategias de afrontamiento.
6. **Recomendaciones**: Consejos personalizados y accionables.
7. **Arquetipo Central**: El patrón dominante del usuario (title, description, strengths, challenges).
8. **Conflicto Nuclear**: El principal dilema interno.
9. **Bucle del Hábito**: Patrón de comportamiento recurrente (trigger, thought, action, result).

{{#if previousFullProfile}}
10. **Informe de Evolución (evolutionSummary)**: OBLIGATORIO si hay perfil anterior. Escribe un análisis narrativo y descriptivo comparando CADA dimensión del perfil actual con el anterior:
    - ¿Ha cambiado el diagnóstico? ¿Hay mejora o deterioro?
    - ¿Han aparecido nuevos rasgos de personalidad o desaparecido otros?
    - ¿Las fortalezas se han reforzado o debilitado?
    - ¿Los sesgos cognitivos persisten, han cambiado o se han añadido nuevos?
    - ¿Los mecanismos de defensa han evolucionado?
    - ¿El arquetipo es el mismo o ha mutado?
    - ¿El conflicto nuclear se ha resuelto, transformado o intensificado?
    - ¿El bucle del hábito ha cambiado?
    Expresa claramente si hay PROGRESO, RETROCESO o CAMBIO NEUTRO en cada área. Usa un tono empático y constructivo.

**Perfil Anterior Completo (para comparación evolutiva):**
{{{previousFullProfile}}}
{{/if}}

**Temas previos:** {{{previousProfilesContext}}}

**Historial del chat:** {{{fullChatHistory}}}`,
});

const emotionalPrompt = ai.definePrompt({
  name: 'generateEmotionalDataPrompt',
  input: { schema: GenerateUserProfileInputSchema },
  output: { schema: emotionalDataSchema },
  prompt: `Eres un analista emocional experto. Del siguiente historial de chat, extrae datos emocionales estructurados.

**TAREA 1: Línea de Tiempo Emocional (emotionalJourney)**
Para CADA día que aparezca en el historial, crea un punto con:
- date: formato AAAA-MM-DD
- sentiment: número de -1 (muy negativo) a 1 (muy positivo)
- summary: resumen muy breve del día
- keyEvents: 1-3 eventos o emociones clave

**TAREA 2: Constelación Emocional (emotionalConstellation)**
Crea un grafo con:
- nodes: 5-8 temas principales (id = nombre del tema, val = peso/recurrencia del 1 al 15)
- links: conexiones entre temas (source, target, sentiment de -1 a 1)

**Historial del chat:** {{{fullChatHistory}}}`,
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
