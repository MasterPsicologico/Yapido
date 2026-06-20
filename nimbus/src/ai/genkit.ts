import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })],
  model: 'googleai/gemini-2.5-flash',
});

export async function generateWithFallback(options: { prompt: string; model?: string; config?: any }): Promise<string> {
  const { text } = await ai.generate({
    prompt: options.prompt,
    model: 'googleai/gemini-2.5-flash',
    ...(options.config ? { config: options.config } : {}),
  });
  return text || '';
}
