
'use server';
/**
 * @fileOverview Agente Supervisor - La Torre de Control Global.
 */
import { ai } from '@/ai/genkit';
import { supervisorAgentPrompt } from './prompts/main';
import { calculateSystemStateTool } from './tools/calculate-system-state';
import { monitorSystemTool } from './tools/monitor-system';

export async function supervisorAgent(input: any) {
  const result = await ai.generate({
    prompt: supervisorAgentPrompt(input),
    tools: [
      calculateSystemStateTool,
      monitorSystemTool
    ],
    config: {
      temperature: 0.1, // Precisión absoluta para mando y control
    }
  });

  return result.output as any;
}
