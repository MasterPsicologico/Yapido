
'use server';

/**
 * @fileOverview Classifies a chatbot's strategy into key therapeutic tactics.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ClassifyStrategyInputSchema = z.object({
  text: z.string().describe("El texto de la estrategia del chatbot a clasificar."),
});

const TACTIC_CATEGORIES = [
    'Validación Empática', 'Pregunta Socrática', 'Reencuadre Cognitivo',
    'Sugerencia de Acción', 'Metáfora/Analogía', 'Psicoeducación'
] as const;

// Create a Zod object schema with explicit keys from the categories array.
const tacticSchemaObject = TACTIC_CATEGORIES.reduce((acc, tactic) => {
    acc[tactic] = z.number().min(0).max(1).describe(`La puntuación de relevancia (0 a 1) para la táctica: ${tactic}.`);
    return acc;
}, {} as Record<(typeof TACTIC_CATEGORIES)[number], z.ZodNumber>);

const ClassifyStrategyOutputSchema = z.object(tacticSchemaObject);


export async function classifyStrategy(input: z.infer<typeof ClassifyStrategyInputSchema>): Promise<z.infer<typeof ClassifyStrategyOutputSchema>> {
  return classifyStrategyFlow(input);
}


const prompt = ai.definePrompt({
    name: 'classifyStrategyPrompt',
    input: { schema: ClassifyStrategyInputSchema },
    output: { schema: ClassifyStrategyOutputSchema },
    prompt: `Eres un experto en análisis de técnicas terapéuticas. Tu tarea es analizar la siguiente "estrategia de ajuste" de un chatbot y puntuar qué tan relevante es cada una de las siguientes tácticas conversacionales para esa estrategia.

**Estrategia a Analizar:**
"{{{text}}}"

**Tácticas a Puntuar:**
${TACTIC_CATEGORIES.map(t => `- ${t}`).join('\n')}

**Instrucciones:**
Devuelve un objeto JSON donde cada clave es una de las tácticas listadas y el valor es un número de 0.0 a 1.0.
- **1.0** significa que la estrategia es un ejemplo perfecto de esa táctica.
- **0.5** significa que la estrategia está relacionada o incluye parcialmente esa táctica.
- **0.0** significa que la estrategia no tiene ninguna relación con esa táctica.

Sé estricto en tu puntuación. La suma de todas las puntuaciones no tiene por qué ser 1. Una estrategia puede combinar varias tácticas.

**Ejemplo de Salida:**
{
  "Validación Empática": 0.9,
  "Pregunta Socrática": 0.2,
  "Reencuadre Cognitivo": 0.0,
  "Sugerencia de Acción": 0.7,
  "Metáfora/Analogía": 0.0,
  "Psicoeducación": 0.1
}
`,
});


const classifyStrategyFlow = ai.defineFlow(
  {
    name: 'classifyStrategyFlow',
    inputSchema: ClassifyStrategyInputSchema,
    outputSchema: ClassifyStrategyOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      // Return a zeroed-out object in case of failure
      return TACTIC_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: 0 }), {} as z.infer<typeof ClassifyStrategyOutputSchema>);
    }
    return output;
  }
);
