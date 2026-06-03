import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { groq } from 'genkitx-groq';

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY }),
    groq({ apiKey: process.env.GROQ_API_KEY }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
