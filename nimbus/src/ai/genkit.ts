import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const googleApiKey = process.env.GOOGLE_GENAI_API_KEY;

if (!googleApiKey) {
  throw new Error('GOOGLE_GENAI_API_KEY environment variable is not set. Please configure it in Vercel dashboard.');
}

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: googleApiKey }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
