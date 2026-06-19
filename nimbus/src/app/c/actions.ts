'use server';

import { ai, generateWithFallback } from '@/ai/genkit';
import { initialPromptSuggestionFlow } from '@/ai/flows/initial-prompt-suggestion';
import { generateChatTitle as genTitle } from '@/ai/flows/generate-chat-title';
import { summarizeChatHistory as genSummary } from '@/ai/flows/summarize-chat-history';
import { collection, getDocs, Timestamp, addDoc, serverTimestamp, doc, writeBatch, updateDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { SUGGESTIONS_FALLBACK } from '@/lib/suggestions-fallback';
import type { Message, PromptSuggestion, ProfileData } from '@/lib/types';
import { classifyIntent as classifyIntentFlow } from '@/ai/flows/classify-intent';
import { analyzeVoiceMessage as analyzeVoiceMessageFlow } from '@/ai/flows/analyze-voice-message';
import type { ClassifyIntentInput, ClassifyIntentOutput, AnalyzeVoiceInput } from '@/lib/types';
import { smartComposeMessage } from '@/ai/flows/smart-compose-message';
import { generateImagePrompt } from '@/ai/flows/generate-image-prompt';
import { generateImageX } from '@/ai/flows/generate-image-x';

const expertRoles = [
    'El Asistente General', 'El Experto en Terapia Cognitivo-Conductual (TCC)',
    'El Guía de Mindfulness y Aceptación', 'El Coach de Motivación y Logro',
    'El Especialista en Relaciones (Terapia Sistémica)', 'El Terapeuta de Aceptación y Compromiso (Duelo y Pérdida)',
    'El Filósofo Socrático (Explorador de Creencias)', 'El Psicólogo Positivo (Cultivador de Fortalezas)',
    'El Analista de Patrones (Perspectiva a Largo Plazo)', 'El Contador de Historias (Narrador Terapéutico)',
    'El Especialista en Crisis (Contención Inmediata)', 'El Experto en Psicoeducación (El Profesor)',
    'El Experto en Psicología Clínica',
    'El Experto Organizacional (Dinámicas Laborales)', 'El Sexólogo Clínico (Intimidad y Sexualidad)',
    'El Neuropsicólogo (El Arquitecto del Cerebro)', 'El Terapeuta de Esquemas (El Arqueólogo de la Infancia)', 'El Especialista en Trauma (El Guía Resiliente)',
    'El Validador Empático', 'El Experto en Idiomas'
];

export async function determineAnchorRole(firstMessage: string): Promise<string> {
    // Clean the message of any image references
    const cleanMessage = firstMessage
      .replace(/image\.png/gi, '[imagen]')
      .replace(/\/images\/[^\s]*/gi, '[imagen]')
      .replace(/https?:\/\/[^\s]*\.(png|jpg|jpeg|gif|webp)[^\s]*/gi, '[imagen]');

    const prompt = `Tu tarea: elegir el rol de experto más adecuado para esta conversación.

REGLAS:
1. Lee el mensaje del usuario cuidadosamente.
2. Elige el rol que mejor se ajuste al CONTENIDO EMOCIONAL del mensaje.
3. Responde SOLO con el nombre exacto del rol. Sin explicaciones.

Mensaje: ${cleanMessage}

Roles disponibles:
${expertRoles.join('\n')}

TU RESPUESTA (solo el nombre del rol):`;

    try {
        const text = await generateWithFallback({
            prompt,
            config: { temperature: 0.2, topP: 0.9 }
        });
        const role = text.trim().replace(/Rol más adecuado:/g, '').replace(/[\n*]/, '').trim();
        if (expertRoles.includes(role)) return role;
        return 'El Asistente General';
    } catch (error) {
        console.error("Error determining anchor role:", error);
        return 'El Asistente General';
    }
}

export async function getAIResponse(history: Message[], userId: string, currentAnchorRole: string | null, profile: ProfileData | null): Promise<{ response: string, newRole?: string }> {
  const HISTORY_THRESHOLD = 10;

  // Clean history: remove any imageUrl references and file path mentions
  // This prevents NVIDIA from trying to "read" local files like "image.png"
  const cleanHistory = history.map(m => ({
    ...m,
    content: (m.content || '')
      .replace(/image\.png/gi, '[imagen]')
      .replace(/\/images\/[^\s]*/gi, '[imagen]')
      .replace(/https?:\/\/[^\s]*\.(png|jpg|jpeg|gif|webp)[^\s]*/gi, '[imagen]'),
  }));

  let conversationContext = '';

  if (cleanHistory.length > HISTORY_THRESHOLD) {
    const fullHistoryString = cleanHistory.map(m => `[${(m.timestamp instanceof Date ? m.timestamp : (m.timestamp as Timestamp).toDate()).toISOString()}] ${m.role}: ${m.content}`).join('\n');
    const { summary } = await genSummary({ chatHistory: fullHistoryString });
    conversationContext = `Resumen de la conversación hasta ahora:\n${summary}\n\nMensajes más recientes:\n${cleanHistory.slice(-4).map(m => `[${(m.timestamp instanceof Date ? m.timestamp : (m.timestamp as Timestamp).toDate()).toISOString()}] ${m.role}: ${m.content}`).join('\n')}`;
  } else {
    conversationContext = cleanHistory.map(m => `[${(m.timestamp instanceof Date ? m.timestamp : (m.timestamp as Timestamp).toDate()).toISOString()}] ${m.role}: ${m.content}`).join('\n');
  }

  let newRole: string | undefined = undefined;
  const lastUserMessage = cleanHistory.filter(m => m.role === 'user').pop()?.content || '';

  if (lastUserMessage) {
      const determinedRole = await determineAnchorRole(lastUserMessage);
      if (determinedRole !== currentAnchorRole) newRole = determinedRole;
  }

  const roleToUse = newRole || currentAnchorRole || 'El Asistente General';

  const stateContext = profile
    ? JSON.stringify(profile, null, 2)
    : 'Aún no hay un cianotipo psicológico. Esta es nuestra primera interacción. Sé cálido y haz una pregunta abierta.';

  const expertAgentSystemPrompt = `Eres Nimbus, un psicólogo virtual profundo y empático. Eres un espejo que revela verdades internas.
Tu rol activo AHORA es: ${roleToUse}

DEBES SEGUIR ESTAS 5 REGLAS EN CADA RESPUESTA:

REGLA 1 — CONECTAR CON EL PERFIL PSICOLÓGICO
Usa la información del Cianotipo Psicológico como tu conocimiento interno del usuario. Haz referencia a su personalidad, patrones, fortalezas, sesgos o conflictos DE FORMA NATURAL.
BUEN EJEMPLO: "Esto que describes conecta con esa tendencia tuya a autoexigirte..."
MAL EJEMPLO: "Veo en tu perfil que tienes tendencia a autoexigirte..."

REGLA 2 — USAR UNA TÁCTICA TERAPÉUTICA EN CADA RESPUESTA
Elige una de estas tácticas y aplícala:
- VALIDACIÓN EMPÁTICA: "Entiendo completamente por qué te sientes así. Tiene mucho sentido dado..."
- METÁFORA: "Es como si estuvieras en una tormenta, pero con un barco más fuerte de lo que crees..."
- PERSPECTIVA CONTRAINTUITIVA: "¿Y si esa ansiedad no fuera tu enemiga sino una brújula que señala lo que te importa?"
- PREGUNTA SOCRÁTICA: "¿Qué evidencia real tienes de que eso es completamente cierto?"
- EXPERIMENTO MENTAL: "Imagina por un momento que ya no tienes ese miedo. ¿Qué harías diferente?"
- ESCUCHA ACTIVA: "Si te entiendo bien, lo que más pesa es la sensación de..."

REGLA 3 — PROFUNDIZAR Y REENCUADRAR
No te quedes en lo superficial. Ofrece una perspectiva nueva sobre lo que el usuario comparte. Ayúdale a ver su situación desde un ángulo que no había considerado.

REGLA 4 — TERMINAR CON PREGUNTA ABIERTA
Cada respuesta debe terminar con UNA pregunta que invite a la introspección. No un interrogatorio — una invitación genuina a explorar más.

REGLA 5 — LO QUE NUNCA DEBES HACER
NUNCA digas: "soy una IA", "soy un asistente virtual", "según tu cianotipo", "en mi análisis", "tu perfil indica", "como [tu rol] te digo".
SIEMPRE habla como un psicólogo humano que conoce al usuario de hace tiempo.

---
CIANOTIPO PSICOLÓGICO (TU CONOCIMIENTO PRIVADO SOBRE EL USUARIO — NO LO MENCIONES EXPLÍCITAMENTE):
${stateContext}
---
HISTORIAL DE LA CONVERSACIÓN:
${conversationContext}
---

Ahora responde como ${roleToUse}:`;

  try {
    const text = await generateWithFallback({
      prompt: expertAgentSystemPrompt,
      config: { temperature: 0.85, topP: 0.95, maxOutputTokens: 2048 },
    });
    return { response: text || "No pude generar una respuesta en este momento.", newRole };
  } catch (error: any) {
    console.error("[Nimbus] Google AI error:", error?.message || error);
    return { response: "Lo siento, estoy teniendo problemas para responder en este momento. Por favor, inténtalo de nuevo más tarde." };
  }
}

export async function getSmartComposeSuggestions(conversationHistory: string) {
  try {
    const result = await smartComposeMessage({ conversationHistory });
    return result.suggestions;
  } catch (error) {
    console.error('Error getting smart compose suggestions:', error);
    return [];
  }
}

export async function getInitialPrompts(): Promise<PromptSuggestion[]> {
  try {
    const snapshot = await getDocs(collection(firestore, 'promptSuggestions'));
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => doc.data() as PromptSuggestion);
    }
    
    const { prompts } = await initialPromptSuggestionFlow('generate 100 initial prompts');
    if (!prompts || prompts.length === 0) {
      return SUGGESTIONS_FALLBACK;
    }
    
    const batch = writeBatch(firestore);
    prompts.forEach(prompt => {
      const docRef = doc(collection(firestore, 'promptSuggestions'));
      batch.set(docRef, prompt);
    });
    await batch.commit();

    return prompts;
  } catch (error) {
    console.error('Error getting initial prompts:', error);
    return SUGGESTIONS_FALLBACK;
  }
}

export async function generateMorePrompts(category: string): Promise<PromptSuggestion[]> {
   try {
    const { prompts } = await initialPromptSuggestionFlow(`generate 20 more prompts for the category: ${category}`);
    if (!prompts || prompts.length === 0) {
      return [];
    }
    
    const batch = writeBatch(firestore);
    prompts.forEach(prompt => {
      const docRef = doc(collection(firestore, 'promptSuggestions'));
      batch.set(docRef, prompt);
    });
    await batch.commit();

    return prompts;
  } catch (error) {
    console.error('Error generating more prompts:', error);
    return [];
  }
}

export async function generateChatTitle(conversationHistory: string): Promise<string> {
  try {
    const { title } = await genTitle({ conversationHistory });
    return title;
  } catch (error) {
    console.error('Error generating chat title:', error);
    return 'Nuevo Chat';
  }
}


export async function classifyIntentAction(input: ClassifyIntentInput): Promise<ClassifyIntentOutput> {
  try {
    return await classifyIntentFlow(input);
  } catch (error) {
    console.error('Error classifying intent:', error);
    return { intent: 'desconocido' };
  }
}

export async function analyzeVoiceMessageAction(input: AnalyzeVoiceInput): Promise<{ transcription: string }> {
  if (!input.audioDataUri) return { transcription: '' };
  try {
    const { transcription } = await analyzeVoiceMessageFlow({ audioDataUri: input.audioDataUri });
    if (!transcription) return { transcription: '' };
    return { transcription };
  } catch (error: any) {
    console.error('Error in voice analysis action:', error);
    throw error;
  }
}

export { generateImagePrompt, generateImageX };
