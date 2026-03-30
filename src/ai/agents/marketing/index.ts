
'use server';
/**
 * @fileOverview Agente Marketing - El Motor de Crecimiento.
 */
import { ai } from '@/ai/genkit';
import { marketingAgentPrompt } from './prompts/main';
import { createCouponTool } from './tools/create-coupon';
import { segmentCustomersTool } from './tools/segment-customers';
import { calculateROITool } from './tools/calculate-roi';

export async function marketingAgent(input: any) {
  const result = await ai.generate({
    prompt: marketingAgentPrompt(input),
    tools: [
      createCouponTool,
      segmentCustomersTool,
      calculateROITool
    ],
    config: {
      temperature: 0.4, // Un toque de creatividad estratégica
    }
  });

  return result.output as any;
}
