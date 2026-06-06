
'use server';
/**
 * @fileOverview Agente Tienda - Gestiona la relación con el vendedor.
 */
import { z } from 'genkit';

export async function tiendaAgent(input: any) {
  return { status: 'ready', agent: 'tienda' };
}
