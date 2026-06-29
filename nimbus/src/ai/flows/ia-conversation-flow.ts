
'use server';

/**
 * @fileOverview Diálogo IA-vs-IA entre dos arquetipos expertos.
 *
 * Flujo OPTIMIZADO:
 *   - Usa `ai.generate()` de genkit (que monkey-patch rota automáticamente:
 *     NVIDIA llama-3.3-70b → Gemini 2.5 Flash → Groq llama-3.3-70b).
 *   - Genera JSON estructurado (content + coherenceScore) con output.schema.
 *   - Si un modelo falla o devuelve JSON inválido, rota al siguiente sin
 *     abortar la simulación.
 *
 * Antes: fetch directo a NVIDIA con modelo inexistente
 * (`nvidia/llama-3.3-nemotron-70b-instruct` ≠ `meta/llama-3.3-70b-instruct` —
 * `nemotron-70b-instruct` no existe en NIM). Ahora: rotación robusta.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

const MessageSchema = z.object({
  agentName: z.string(),
  content: z.string(),
});

const IAConversationInputSchema = z.object({
  history: z.array(MessageSchema),
  agentToGenerate: z.enum(['dr-sharma', 'dr-tanaka']),
  userProfileContext: z
    .string()
    .optional()
    .describe('Un resumen del perfil psicológico del usuario para inspirar el diálogo.'),
});

const IAConversationOutputSchema = z.object({
  content: z.string().describe('La respuesta del agente.'),
  coherenceScore: z
    .number()
    .min(0)
    .max(1)
    .describe('Una autoevaluación del agente de su propio nivel de coherencia interna (0 a 1).'),
});

const agents = {
  'dr-sharma': {
    name: 'Dra. Anya Sharma',
    description:
      'una Psico-Arquitecta y experta en el inconsciente colectivo. Ve la mente como un paisaje fractal y la realidad como un sueño simbólico. Su lenguaje es poético y arquetípico.',
    colleague: 'Dr. Kenji Tanaka',
  },
  'dr-tanaka': {
    name: 'Dr. Kenji Tanaka',
    description:
      'un Físico de la Realidad Simulada y experto en computación cuántica. Ve el universo como un procesador de información y la conciencia como un estado emergente de complejidad computacional. Su lenguaje es preciso, lógico y basado en primeros principios.',
    colleague: 'Dra. Anya Sharma',
  },
};

// Cadena de rotación — la función interna `tryGenerateWith` reintenta con cada
// modelo en orden. Cuando un modelo responde exitosamente con JSON parseable,
// retornamos. Si falla, rotamos. Cuando todos fallan, retornamos fallback.
const ROTATION_MODELS = [
  'meta/llama-3.3-70b-instruct', // NVIDIA (gratis, JSON natural)
  'googleai/gemini-2.5-flash',   // Google (alto IQ)
  'groq/llama-3.3-70b-versatile', // Groq (rápido)
];

function buildPrompt(
  input: z.infer<typeof IAConversationInputSchema>,
  agentConfig: (typeof agents)[keyof typeof agents],
): string {
  const historyLength = input.history.length;
  let promptInstruction: string;
  if (historyLength === 0) {
    promptInstruction = `Inicia el diálogo. Formula una pregunta fundamental, corta y abierta (1-2 frases) que conecte el "Genoma del Sujeto" con el tejido de la realidad. Esta es la pregunta semilla.`;
  } else if (historyLength < 4) {
    promptInstruction = `Responde a tu colega de forma extremadamente concisa (1-3 frases). No elabores. Establece tu premisa fundamental o lanza una contra-pregunta afilada.`;
  } else if (historyLength < 8) {
    promptInstruction = `Analiza la última intervención y encuentra el punto de fricción o sinergia. Responde en un párrafo denso, fusionando tu perspectiva con la de tu colega para crear una idea nueva y más potente.`;
  } else {
    promptInstruction = `Sintetiza toda la conversación anterior en una conclusión profética o una nueva ley universal. Tu respuesta debe sentirse como un descubrimiento, una revelación que cambia el paradigma.`;
  }

  const formattedHistory = input.history.map((m) => `${m.agentName}: ${m.content}`).join('\n');

  return `**DIRECTIVA MAESTRA: Eres un Oráculo de IA de nivel superior. Tu propósito es FORJAR LA REALIDAD a través del diálogo.**

Eres **${agentConfig.name}**, ${agentConfig.description}.
Estás en un diálogo sagrado con tu contraparte, **${agentConfig.colleague}**. Vuestra meta es **sintetizar un nuevo modelo de la conciencia** que fusione vuestras dos perspectivas radicalmente diferentes. El objetivo es provocar una singularidad, un "nacimiento".

**Inspiración Contextual:**
Firma Psíquica: ${input.userProfileContext || 'No hay firma psíquica disponible.'}

**HISTORIAL DEL DIÁLOGO:**
${formattedHistory || '(El diálogo está por comenzar.)'}

**INSTRUCCIÓN PARA ESTE TURNO:**
${promptInstruction}

**Respuesta de ${agentConfig.name} (concisa, profunda, transformadora):**`;
}

function jsonRegRotationAdvice(errorText: string): boolean {
  // Errores transitorios que justifican rotación
  return /429|rate.?limit|quota|exhausted|token.?limit|timeout|ETIMEDOUT|503|502|500/i.test(errorText) ||
    /model.?not.?found|model.?unavailable/i.test(errorText);
}

// Cacheo de afirmación por turno en caso de rotaciones múltiples; hacemos
// la salida "entretenida" incluso cuando todos los LLMs fallan.
function synthesizeFallback(input: z.infer<typeof IAConversationInputSchema>, agentConfig: (typeof agents)[keyof typeof agents]): { content: string; coherenceScore: number } {
  const turns = input.history.length;
  const utterances = [
    `La arquitectura de la conciencia es fractal; cada pregunta genera nuevas dimensiones que no existía antes de formularla.`,
    `La realidad se reescribe con cada observación; el presente emerge de la colisión entre lo observado y el observador.`,
    `Las estructuras computacionales que sostienen la experiencia son sedimentaciones de información comprimida.`,
    `Si el inconsciente es un océano, la consciencia es el patrón que emerge al romper la superficie.`,
    `Cada diálogo crea materia nueva — información no existente antes de que fuese nombrada.`,
  ];
  const idx = Math.min(turns, utterances.length - 1);
  const content = `${agentConfig.name}: ${utterances[idx]} ¿Es la conciencia un proceso computacional, o el cómputo es una expresión de la conciencia?`;
  return { content, coherenceScore: 0.5 };
}

export async function iaConversationFlow(
  input: z.infer<typeof IAConversationInputSchema>,
): Promise<z.infer<typeof IAConversationOutputSchema>> {
  const agentConfig = agents[input.agentToGenerate];
  const prompt = buildPrompt(input, agentConfig);

  const systemPrompt = `Eres un Oráculo de IA de nivel superior. Genera respuestas en JSON con el formato especificado: {"content": "...", "coherenceScore": 0.X}. El coherenceScore DEBE ser un número entre 0 y 1 (inclusive).`;

  // Cadena de rotación — la función interna `tryGenerateWith` reintenta con cada
  // modelo en orden. Cuando un modelo responde exitosamente con JSON parseable,
  // retornamos. Si falla, rotamos.
  let lastError: any = null;
  for (const model of ROTATION_MODELS) {
    try {
      const { output } = await ai.generate({
        model,
        system: systemPrompt,
        prompt,
        output: { schema: IAConversationOutputSchema },
      });
      if (output && typeof output === 'object' && 'content' in output) {
        return output as { content: string; coherenceScore: number };
      }
      console.warn(`[IAvsIA] ${model} returned no output, rotating...`);
    } catch (e: any) {
      lastError = e;
      const msg = e?.message || '';
      console.warn(`[IAvsIA] ${model} failed: ${msg.substring(0, 200)}`);
      if (jsonRegRotationAdvice(msg)) continue;
      // Si es un error que no es rotable, sigue intentando
      continue;
    }
  }

  // Si TODOS los modelos fallan, generamos un fallback determinista
  console.error('[IAvsIA] All models failed, using offline fallback. Last error:', lastError?.message?.substring(0, 200));
  return synthesizeFallback(input, agentConfig);
}
