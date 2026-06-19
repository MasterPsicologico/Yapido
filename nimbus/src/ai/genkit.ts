import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { groq } from 'genkitx-groq';

// Build plugins list dynamically — only add plugins with valid keys
const plugins: any[] = [];

if (process.env.GROQ_API_KEY) {
  plugins.push(groq({ apiKey: process.env.GROQ_API_KEY }));
}

if (process.env.GOOGLE_GENAI_API_KEY) {
  plugins.push(googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY }));
}

// Determine default model: prefer Groq (generous free tier), fallback to Google
const defaultModel = process.env.GROQ_API_KEY
  ? 'groq/llama-3.3-70b-versatile'
  : 'googleai/gemini-2.5-flash';

export const ai = genkit({
  plugins,
  model: defaultModel,
});

/**
 * Generate text with automatic fallback.
 * Primary: Groq (high quota, fast)
 * Fallback: Google Gemini (low free-tier quota)
 */
export async function generateWithFallback(options: { prompt: string; model?: string }): Promise<string> {
  const models = [
    'groq/llama-3.3-70b-versatile',
    ...(process.env.GOOGLE_GENAI_API_KEY ? ['googleai/gemini-2.5-flash'] : []),
  ];

  for (const model of models) {
    try {
      const { text } = await ai.generate({ prompt: options.prompt, model });
      if (text) return text;
    } catch (error: any) {
      console.warn(`[Nimbus] Model ${model} failed:`, error?.message?.substring(0, 150));
      continue;
    }
  }

  throw new Error('All AI models failed to generate a response');
}
