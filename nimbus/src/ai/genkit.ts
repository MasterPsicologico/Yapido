import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { groq } from 'genkitx-groq';
import openAI from 'genkitx-openai';
import { GenerationCommonConfigSchema } from 'genkit';
import { ModelInfo } from 'genkit/model';

// Hack for genkitx-openai to use NVIDIA API key
if (process.env.NVIDIA_API_KEY && !process.env.OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = process.env.NVIDIA_API_KEY;
}

const nvidiaModelInfo: ModelInfo = {
  versions: ['1.0'],
  label: 'NVIDIA Minimax 2.7',
  supports: {
    multiturn: true,
    tools: true,
    media: false,
    systemRole: true,
    output: ['json', 'text'],
  },
};

const nvidiaConfigSchema = GenerationCommonConfigSchema.extend({});

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY }),
    groq({ apiKey: process.env.GROQ_API_KEY }),
    openAI({
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: 'https://integrate.api.nvidia.com/v1',
      models: [
        {
          name: 'nvidia/llama-3.3-nemotron-70b-instruct',
          info: nvidiaModelInfo,
          configSchema: nvidiaConfigSchema,
        },
      ],
    }),
  ],
  model: 'openai/nvidia/llama-3.3-nemotron-70b-instruct',
});
