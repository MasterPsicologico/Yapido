
'use server';
import { z } from 'genkit';

export async function rutasAgent(input: any) {
  return { status: 'ready', agent: 'rutas' };
}
