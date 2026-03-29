
'use server';
import { z } from 'genkit';

export async function repartidorAgent(input: any) {
  return { status: 'ready', agent: 'repartidor' };
}
