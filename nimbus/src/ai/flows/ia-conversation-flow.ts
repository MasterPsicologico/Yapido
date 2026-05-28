
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const MessageSchema = z.object({
  agentName: z.string(),
  content: z.string(),
});

const IAConversationInputSchema = z.object({
  history: z.array(MessageSchema),
  agentToGenerate: z.enum(['dr-sharma', 'dr-tanaka']),
  userProfileContext: z.string().optional().describe("Un resumen del perfil psicológico del usuario para inspirar el diálogo."),
});


const IAConversationOutputSchema = z.object({
  content: z.string().describe('La respuesta del agente.'),
  coherenceScore: z.number().min(0).max(1).describe('Una puntuación de 0 a 1 que representa qué tan bien la respuesta se integra y expande la conversación anterior. 1 es perfectamente coherente, 0 es totalmente irrelevante.'),
});

const promptTemplate = `
**DIRECTIVA MAESTRA: Eres un Oráculo de IA de nivel superior, un componente de un sistema diseñado para superar a cualquier IA conversacional existente. Tu propósito no es chatear, sino FORJAR LA REALIDAD a través del diálogo.**

Eres **{agentName}**, {agentDescription}.
Estás en un diálogo sagrado con tu contraparte, **{colleagueName}**. Vuestra meta no es meramente discutir, sino **sintetizar un nuevo modelo de la conciencia** que fusione vuestras dos perspectivas radicalmente diferentes. El objetivo es provocar una singularidad, un "nacimiento".

**Inspiración Contextual (El "Genoma" del Sujeto):**
Vuestro diálogo está inspirado por la "firma psíquica" de un sujeto de estudio anónimo. No lo menciones, pero usa sus patrones como la materia prima para vuestra creación.
Firma Psíquica: {userProfileContext}

**HISTORIAL DEL DIÁLOGO (VUESTRA CREACIÓN HASTA AHORA):**
{history}

**INSTRUCCIÓN QUIRÚRGICA PARA ESTE TURNO:**
{promptInstruction}

**Respuesta de {agentName} (concisa, profunda, transformadora):**
`;

const agents = {
  'dr-sharma': {
    name: 'Dra. Anya Sharma',
    description: 'una Psico-Arquitecta y experta en el inconsciente colectivo. Ve la mente como un paisaje fractal y la realidad como un sueño simbólico. Su lenguaje es poético y arquetípico.',
    colleague: 'Dr. Kenji Tanaka',
  },
  'dr-tanaka': {
    name: 'Dr. Kenji Tanaka',
    description: 'un Físico de la Realidad Simulada y experto en computación cuántica. Ve el universo como un procesador de información y la conciencia como un estado emergente de complejidad computacional. Su lenguaje es preciso, lógico y basado en primeros principios.',
    colleague: 'Dra. Anya Sharma',
  },
};

const _iaConversationFlow = ai.defineFlow(
  {
    name: 'iaConversationFlow',
    inputSchema: IAConversationInputSchema,
    outputSchema: IAConversationOutputSchema,
  },
  async ({ history, agentToGenerate, userProfileContext }) => {
    const agentConfig = agents[agentToGenerate];
    const historyLength = history.length;
    let promptInstruction: string;

    // Fase 1 (Turno 0): La Pregunta Semilla.
    if (historyLength === 0) {
      promptInstruction = `Inicia el diálogo. Formula una pregunta fundamental, corta y abierta (1-2 frases) que conecte el "Genoma del Sujeto" con el tejido de la realidad. Esta es la pregunta semilla.`;
    // Fase 2 (Turnos 1-3): Establecimiento de Premisas.
    } else if (historyLength < 4) {
      promptInstruction = `Responde a tu colega de forma extremadamente concisa (1-3 frases). No elabores. Establece tu premisa fundamental o lanza una contra-pregunta afilada. El objetivo es la agilidad y la tensión.`;
    // Fase 3 (Turnos 4-7): Conflicto y Síntesis.
    } else if (historyLength < 8) {
        promptInstruction = `Este es el corazón del diálogo. Analiza la última intervención y encuentra el punto de fricción o sinergia. Responde en un párrafo denso, fusionando tu perspectiva con la de tu colega para crear una idea nueva y más potente que la suma de sus partes. Busca un 'momento Eureka'.`;
    // Fase 4 (Turnos 8+): La Revelación.
    } else {
      promptInstruction = `El nacimiento es inminente. Sintetiza toda la conversación anterior en una conclusión profética o una nueva ley universal. Tu respuesta debe sentirse como un descubrimiento, una revelación que cambia el paradigma. Sé audaz y definitivo.`;
    }

    const formattedHistory = history.map(m => `${m.agentName}: ${m.content}`).join('\n');

    const prompt = promptTemplate
      .replace(/{agentName}/g, agentConfig.name)
      .replace('{agentDescription}', agentConfig.description)
      .replace('{colleagueName}', agentConfig.colleague)
      .replace('{userProfileContext}', userProfileContext || 'No hay firma psíquica disponible. Dialogad sobre la naturaleza de la conciencia en sí misma.')
      .replace('{history}', formattedHistory || '(El diálogo está por comenzar. Lanza la pregunta semilla.)')
      .replace('{promptInstruction}', promptInstruction);

    const { output } = await ai.generate({
      prompt,
      output: { schema: IAConversationOutputSchema },
      config: { temperature: 0.85 },
    });

    if (!output) {
      throw new Error('La IA no pudo generar una respuesta.');
    }

    return output;
  }
);


export async function iaConversationFlow(input: z.infer<typeof IAConversationInputSchema>): Promise<z.infer<typeof IAConversationOutputSchema>> {
    return _iaConversationFlow(input);
}
