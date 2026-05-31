import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: "AIzaSyDWyJQ06hZV2j12PUiwDU_aTzg9yXJUTX0",
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});
