import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: "AIzaSyBc9VdoGCPji276s5X9lHVtrIZc9khf5TQ",
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
