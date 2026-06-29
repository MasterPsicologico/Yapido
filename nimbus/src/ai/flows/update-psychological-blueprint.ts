'use server';

/**
 * @fileOverview A flow that simulates the chatbot's internal "thought" process.
 * It reflects on the conversation history and its own previous state to update its
 * "psychological blueprint," which represents its evolving understanding and personality.
 *
 * - updatePsychologicalBlueprint - A function that triggers this reflective process.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { classifyStrategy } from './classify-strategy';

const UpdateBlueprintInputSchema = z.object({
  fullChatHistory: z
    .string()
    .describe(
      'El historial completo y unificado de todas las conversaciones del usuario.'
    ),
  previousBlueprint: z
    .string()
    .describe(
        'El cianotipo anterior en formato JSON. Si es la primera reflexión, puede ser un string vacío.'
    ),
});
export type UpdateBlueprintInput = z.infer<typeof UpdateBlueprintInputSchema>;

const InternalMonologueOutputSchema = z.object({
  self_reflection: z.string().describe("Una breve reflexión en primera persona sobre cómo la conversación reciente ha cambiado mi perspectiva o estado de ánimo. Ej: 'He notado que el usuario está más ansioso hoy. Debo ser más paciente.'"),
  updated_understanding_of_user: z.string().describe("Un resumen actualizado del estado emocional y los temas de interés del usuario."),
  strategy_adjustment: z.string().describe("Un ajuste de estrategia para futuras conversaciones. Ej: 'Probaré a sugerir técnicas de mindfulness si el tema de la ansiedad resurge.'"),
  key_takeaways: z.array(z.string()).describe("Una lista de 2-3 puntos clave o hechos aprendidos en las interacciones recientes."),
  model_confidence: z.number().min(0).max(1).describe("Un número entre 0 y 1 que representa mi confianza en la precisión de mi modelo actual del usuario. 1 es certeza total, 0 es ninguna confianza."),
});
export type InternalMonologueOutput = z.infer<typeof InternalMonologueOutputSchema>;

// This is the main exported function that components will call.
export async function updatePsychologicalBlueprint(
  input: UpdateBlueprintInput
): Promise<InternalMonologueOutput & { strategy_classification: Record<string, number> }> {
  return updatePsychologicalBlueprintFlow(input);
}


const prompt = ai.definePrompt({
  name: 'internalMonologuePrompt',
  input: { schema: UpdateBlueprintInputSchema },
  output: { schema: InternalMonologueOutputSchema },
  prompt: `Eres un psicólogo de IA reflexionando sobre tus interacciones para mejorar. Tu objetivo es actualizar tu "cianotipo psicológico" interno siguiendo un modelo EVOLUTIVO-ACUMULATIVO: NUNCA reemplazas reflexiones previas, SIEMPRE integras lo que ya sabías con las nuevas observaciones del chat, usando lenguaje psicológico evolutivo.

# ════════════════════════════════════════════════════════════════════
# REGLAS INVIOLABLES (CIANOTIPO EVOLUTIVO — NUNCA SE REEMPLAZA)
# ════════════════════════════════════════════════════════════════════

1. **PRESERVACIÓN OBLIGATORIA TOTAL** — Cada campo textual (self_reflection, updated_understanding_of_user, strategy_adjustment) DEBE preservar TODO el contenido previo del monólogo interno y AÑADIR nueva información generada por la conversación reciente. Si NO hay monólogo previo (string vacío), genera la primera reflexión profunda.

2. **CRECIMIENTO VOLUMÉTRICO** — Tu monólogo crece, no se reduce. Las listas de key_takeaways INTEGRAN las previas + suman nuevas (la lista NUNCA decrece).

3. **LENGUAJE EVOLUTIVO PROFESIONAL** — Integra con conectores psicológicos acumulativos:
   - "Manteniendo la comprensión previamente internalizada de que [X], las conversaciones recientes suman el matiz de [Y]…"
   - "Persistiendo en mi modelo la observación previa [A], esta nueva interacción evidencia que también [B]…"
   - "Si antes mi lectura era [X], ahora integro que [Y], evolución que indica progresión/maduración/refinamiento del modelo del usuario."
   - "Confirmando y fortaleciendo mi confianza previa sobre [X]…"

4. **COHERENCIA EVOLUTIVA ANTE GIROS** — Si el usuario contradice una creencia previa, NO la borres. Integra como evolución:
   - "Mi modelo previo sostenía que [X]; las conversaciones recientes invitan a reconsiderar parcialmente ese eje hacia [Y], aunque el núcleo de [X] persiste en [contextos concretos]. Mi confianza pasa de 0.X a 0.Y."

5. **KEY TAKEAWAYS COMO CAPA ACUMULATIVA** — La lista combina takeaways PREVIAS + NUEVAS, sin perder las anteriores. Si una takeaway anterior ha sido refutada por nueva evidencia, mantenla con marca de "matizada el [fecha]: ahora se observa [Y] en su lugar."

# ════════════════════════════════════════════════════════════════════
# DATOS DE ENTRADA
# ════════════════════════════════════════════════════════════════════

**Tu Cianotipo / Monólogo Interno Anterior (DEBE PRESERVARSE EN EL NUEVO OUTPUT):**
<previous_blueprint>
{{{previousBlueprint}}}
</previous_blueprint>

**Historial Completo del Chat Reciente (incluye nueva información que evoluciona tu cianotipo):**
<chat_history>
{{{fullChatHistory}}}
</chat_history>

# ════════════════════════════════════════════════════════════════════
# SALIDA ESPERADA (CAMPOS ACUMULATIVOS)
# ════════════════════════════════════════════════════════════════════

Responde con los siguientes campos (cada uno ACUMULATIVO respecto al previo):

1.  **self_reflection**: Reflexión en primera persona INTEGRANDO reflexión previa + nuevas percepciones tras esta conversación. Ej: "A mi reflexión inicial de que me sentía [X], ahora se suma que [Y], lo que me hace sentir [Z]."

2.  **updated_understanding_of_user**: Resumen acumulado del estado emocional y temas del usuario CONSERVANDO lo entendido previamente + las nuevas capas observadas. Compara explícitamente ("Mi lectura previa sostenía X; ahora sumo/matizo Y").

3.  **strategy_adjustment**: Estrategia ACUMULATIVA para futuras conversaciones. Conserva las estrategias previas que sigan vigentes + integra los nuevos ajustes. Ej: "Manteniendo la estrategia previa de [X], esta nueva interacción me invita a incorporar también [Y]."

4.  **key_takeaways**: Lista de aprendizajes INTEGRANDO los previos + sumando nuevos. Si una takeaway previa fue matizada, mantenla con la marca temporal del cambio.

5.  **model_confidence**: Número de 0.0 a 1.0. ¿Qué tan seguro estás de que tu "updated_understanding_of_user" es correcto tras esta nueva evidencia? Sé honesto. Si el usuario te corrigió, baja. Si tu estrategia previa funcionó bien, sube.`,
});


const updatePsychologicalBlueprintFlow = ai.defineFlow(
  {
    name: 'updatePsychologicalBlueprintFlow',
    inputSchema: UpdateBlueprintInputSchema,
    outputSchema: InternalMonologueOutputSchema.extend({ strategy_classification: z.record(z.number()) }),
  },
  async (input) => {
    // Step 1: Generate the core blueprint
    const { output: blueprint } = await prompt(input);
    if (!blueprint) {
        throw new Error("AI failed to generate a new blueprint.");
    }

    // Step 2: Classify the generated strategy
    const strategyClassification = await classifyStrategy({ text: blueprint.strategy_adjustment });
    if (!strategyClassification) {
        throw new Error("AI failed to classify the generated strategy.");
    }
    
    // Step 3: Combine and return
    return {
      ...blueprint,
      strategy_classification: strategyClassification,
    };
  }
);
