'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const inputSchema = z.string().describe("El audio como data URI.");

const outputSchema = z.string().describe("La transcripción del texto.");

const iaVoiceInputFlow = ai.defineFlow(
  {
    name: 'iaVoiceInputFlow',
    inputSchema,
    outputSchema,
  },
  async (audioDataUri) => {
    const { text } = await ai.generate({
      prompt: [
        { text: "Transcribe el siguiente audio. La precisión es crucial." },
        { media: { url: audioDataUri, contentType: 'audio/webm' } }
      ],
    });

    if (!text) {
      throw new Error("No se pudo transcribir el audio.");
    }

    return text.trim();
  }
);


export async function analyzeIAVoice(audioDataUri: string): Promise<string> {
    return iaVoiceInputFlow(audioDataUri);
}
