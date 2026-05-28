'use server';

import {
  iaConversationFlow,
} from '@/ai/flows/ia-conversation-flow';
import { emergentAgentFlow, type EmergentAgentInput, type EmergentAgentOutput } from '@/ai/flows/emergent-agent-flow';
import { analyzeIAVoice as analyzeIAVoiceFlow } from '@/ai/flows/ia-voice-input-flow';
import { generateSpeech as generateSpeechFlow } from '@/ai/flows/speech';

interface NextMessageInput {
    history: { agentName: string; content: string }[];
    agentToGenerate: 'dr-sharma' | 'dr-tanaka';
    userProfileContext: string;
}

interface NextMessageOutput {
    content: string;
    coherenceScore: number;
}

export async function generateNextIAMessage(input: NextMessageInput): Promise<NextMessageOutput> {
  const response = await iaConversationFlow({
    history: input.history,
    agentToGenerate: input.agentToGenerate,
    userProfileContext: input.userProfileContext,
  });
  
  return {
    content: response.content,
    coherenceScore: response.coherenceScore,
  };
}


export async function getEmergentResponse(input: EmergentAgentInput): Promise<EmergentAgentOutput> {
    return await emergentAgentFlow(input);
}

export async function analyzeIAVoice(audioDataUri: string): Promise<string> {
    return await analyzeIAVoiceFlow(audioDataUri);
}

export async function getSeraphVoice(text: string): Promise<string> {
    const { media } = await generateSpeechFlow(text);
    return media;
}
