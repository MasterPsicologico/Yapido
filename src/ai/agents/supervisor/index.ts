'use server';
/**
 * @fileOverview Agente Supervisor - La Torre de Control Global.
 */
import { supervisorAgentPrompt } from './prompts/main';
import { SupervisorAgentInput, SupervisorAgentOutput } from './schema';

export async function supervisorAgent(input: SupervisorAgentInput): Promise<SupervisorAgentOutput> {
  const { output } = await supervisorAgentPrompt(input);
  return output!;
}
