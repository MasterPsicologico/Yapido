
'use server';

/**
 * @fileOverview Interpreta un sueño en el contexto del perfil psicológico del usuario y desde una perspectiva elegida.
 */

import { ai, getFallbackChain } from '@/ai/genkit';
import { DreamInterpretationInputSchema, type InterpretDreamInput } from '@/lib/types';
import { z } from 'zod';

function withTimeout(promise: Promise<any>, ms: number, label: string): Promise<any> {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms)
    ),
  ]);
}


// Esquema de salida del FLOW, no del prompt de la IA.
const FlowOutputSchema = z.object({
    interpretationText: z.string().describe("La interpretación completa del sueño, formateada como un texto Markdown bien estructurado."),
});


// Define y exporta el flujo principal.
const interpretDreamFlow = ai.defineFlow(
  {
    name: 'interpretDreamFlow',
    inputSchema: DreamInterpretationInputSchema,
    outputSchema: FlowOutputSchema, 
  },
  async (input) => {
    
    // Construimos el prompt manualmente para máxima robustez.
    const fullPrompt = `Eres un experto analista de sueños. Tu tarea es analizar la descripción de un sueño y ofrecer una interpretación rica y perspicaz, conectándola con el perfil psicológico del usuario.

Adoptarás la siguiente perspectiva para tu análisis:
**Perspectiva del Especialista:** ${input.perspective}

**Contexto del Usuario (Perfil Psicológico):**
${input.userProfile}

**Descripción del Sueño:**
${input.dreamDescription}

**Tu Tarea:**
Genera una interpretación completa del sueño como un único texto en formato **Markdown**. La estructura debe ser clara y fácil de leer.

**Estructura Requerida del Markdown:**

# [Genera aquí un título poético y evocador para el sueño]

**Atmósfera Dominante:** [Describe la emoción o sentimiento principal del sueño]

## Interpretación Narrativa
[Explica la trama del sueño como una metáfora del viaje psicológico del usuario, basándote en su perfil y desde la perspectiva elegida.]

## Símbolos Clave y su Significado
[Crea una lista de 3 a 5 símbolos importantes. Para cada uno, usa el siguiente formato:]
- **[Símbolo]** ([Emoji]):
  - **Significado Universal:** [Explica el significado arquetípico]
  - **Significado Personal:** [Conecta el símbolo directamente con el perfil del usuario]

## Pregunta para tu Reflexión
[Concluye con una única pregunta final, poderosa y abierta, diseñada para que el usuario reflexione sobre el mensaje del sueño.]

---
Mantén un tono empático, sabio y coherente con la perspectiva del especialista elegido. Tu objetivo es empoderar al usuario para que vea sus sueños como un diálogo con su propio subconsciente.
NO incluyas ninguna otra frase introductoria o de cierre. Empieza directamente con el título del sueño.
`;
    
    const chain = getFallbackChain();
    if (chain.length === 0) {
      throw new Error('No hay ningún modelo de IA configurado. Configura GOOGLE_GENAI_API_KEY o GROQ_API_KEY.');
    }

    const TIMEOUT_PER_MODEL = 70_000;
    let lastError: any = null;

    for (const model of chain) {
      try {
        const { text } = await withTimeout(
          ai.generate({ model, prompt: fullPrompt }),
          TIMEOUT_PER_MODEL,
          `interpretDreamFlow(${model})`
        );
        if (text) {
          console.log(`[Nimbus] interpretDreamFlow succeeded via ${model}`);
          return { interpretationText: text };
        }
      } catch (e: any) {
        lastError = e;
        console.warn(`[Nimbus] interpretDreamFlow ${model} failed: ${e?.message?.substring(0, 200)}`);
        if (/429|rate.?limit|quota|exhausted|timeout|timed.?out|503|502|500|UNAVAILABLE/i.test(e?.message || '')) {
          continue;
        }
        throw e;
      }
    }

    throw lastError || new Error('La IA no pudo generar una interpretación del sueño.');
  }
);


// La acción del servidor ahora devolverá el objeto simplificado.
export async function interpretDream(input: InterpretDreamInput): Promise<z.infer<typeof FlowOutputSchema>> {
  return interpretDreamFlow(input);
}
