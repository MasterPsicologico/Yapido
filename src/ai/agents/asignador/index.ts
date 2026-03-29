
'use server';
import { z } from 'genkit';

export async function asignadorAgent(input: any) {
  return { status: 'ready', agent: 'asignador' };
}
