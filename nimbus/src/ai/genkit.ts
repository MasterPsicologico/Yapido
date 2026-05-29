import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: "AIzaSyBZ8Fb5yAo1D5k2m6C7PYKy9Qehfw3u0aM",
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
