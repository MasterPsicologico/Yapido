import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { groq } from 'genkitx-groq';

const plugins: any[] = [];

if (process.env.GROQ_API_KEY) {
  plugins.push(groq({ apiKey: process.env.GROQ_API_KEY }));
}

if (process.env.GOOGLE_GENAI_API_KEY) {
  plugins.push(googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY }));
}

const defaultModel = process.env.GROQ_API_KEY
  ? 'groq/llama-3.3-70b-versatile'
  : 'googleai/gemini-2.5-flash';

export const ai = genkit({
  plugins,
  model: defaultModel,
});

export async function generateWithFallback(options: { prompt: string; model?: string; config?: any }): Promise<string> {
  const models = [
    'groq/llama-3.3-70b-versatile',
    ...(process.env.GOOGLE_GENAI_API_KEY ? ['googleai/gemini-2.5-flash'] : []),
  ];

  for (const model of models) {
    try {
      const { text } = await ai.generate({
        prompt: options.prompt,
        model,
        ...(options.config ? { config: options.config } : {}),
      });
      if (text) return text;
    } catch (error: any) {
      console.warn(`[Nimbus] Model ${model} failed:`, error?.message?.substring(0, 200));
      continue;
    }
  }

  throw new Error('All AI models failed to generate a response');
}

export async function generateWithGroqOnly(options: { prompt: string; config?: any }): Promise<string> {
  const { text } = await ai.generate({
    prompt: options.prompt,
    model: 'groq/llama-3.3-70b-versatile',
    ...(options.config ? { config: options.config } : {}),
  });
  return text || '';
}