'use server';

import { unstable_noStore as noStore } from 'next/cache';
import { generateUserProfile as generateUserProfileFlow } from '@/ai/flows/generate-user-profile';
import { generateBreakdownExercise as generateBreakdownExerciseFlow } from '@/ai/flows/generate-breakdown-exercise';
import type { GenerateBreakdownExerciseInput, GenerateBreakdownExerciseOutput, GenerateUserProfileInput } from '@/lib/types';


/**
 * This is the main server action for generating the profile.
 * It now receives the full chat history and an optional context string from the client.
 */
export async function updatePsychologicalBlueprint(input: GenerateUserProfileInput) {
  noStore();

  if (!input.fullChatHistory.trim()) {
    throw new Error('El historial de chat está vacío. No se puede generar un perfil.');
  }

  try {
    const result = await generateUserProfileFlow(input);

    if (!result) {
      throw new Error('La generación del perfil falló en el servidor de IA.');
    }
    return result;
  } catch (error) {
    console.error('Error during profile generation flow:', error);
    // Re-throw the error to be caught by the client-side fetch.
    throw error;
  }
}

export async function generateBreakdownExerciseAction(input: GenerateBreakdownExerciseInput): Promise<GenerateBreakdownExerciseOutput> {
    return generateBreakdownExerciseFlow(input);
}