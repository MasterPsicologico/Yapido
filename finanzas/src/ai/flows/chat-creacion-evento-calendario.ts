'use server';
/**
 * @fileOverview Un especialista en calendario que procesa lenguaje natural para crear eventos categorizados.
 *
 * - crearEventoCalendario - Una función que procesa el texto del usuario para extraer detalles de eventos.
 * - CrearEventoCalendarioInput - El tipo de entrada para la función crearEventoCalendario.
 * - CrearEventoCalendarioOutput - El tipo de retorno para la función crearEventoCalendario.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CrearEventoCalendarioInputSchema = z.object({
  text: z.string().describe('El mensaje del usuario describiendo el evento o recordatorio.'),
  CURRENT_DATE: z
    .string()
    .optional()
    .describe('Fecha actual en formato YYYY-MM-DD para resolver referencias relativas como "hoy" o "mañana".'),
});
export type CrearEventoCalendarioInput = z.infer<typeof CrearEventoCalendarioInputSchema>;

const CrearEventoCalendarioOutputSchema = z.object({
  title: z.string().describe('El título del evento o recordatorio.'),
  description: z.string().optional().describe('Una descripción detallada del evento o recordatorio.'),
  date: z.string().describe('La fecha del evento en formato YYYY-MM-DD.'),
  time: z
    .string()
    .optional()
    .describe('La hora del evento en formato HH:MM (24 horas).'),
  allDay: z
    .boolean()
    .optional()
    .describe('Indica si el evento dura todo el día.'),
  category: z.enum(['trabajo', 'finanzas', 'salud', 'personal', 'ocio']).describe('Categoría del evento.'),
});
export type CrearEventoCalendarioOutput = z.infer<typeof CrearEventoCalendarioOutputSchema>;

export async function crearEventoCalendario(
  input: CrearEventoCalendarioInput
): Promise<CrearEventoCalendarioOutput> {
  return crearEventoCalendarioFlow(input);
}

const crearEventoCalendarioPrompt = ai.definePrompt({
  name: 'crearEventoCalendarioPrompt',
  input: {schema: CrearEventoCalendarioInputSchema},
  output: {schema: CrearEventoCalendarioOutputSchema},
  prompt: `Eres un especialista en organización de calendario. Tu tarea es extraer los detalles de eventos o recordatorios del siguiente texto del usuario y categorizarlos inteligentemente.

Extrae el título, descripción, fecha, hora y clasifica el evento en una de estas categorías:
- trabajo: reuniones, entregas, turnos.
- finanzas: pagos, cobros, bancos.
- salud: citas médicas, gimnasio, farmacia.
- ocio: cenas, viajes, cine.
- personal: recordatorios generales, cumpleaños.

Considera la fecha actual como {{CURRENT_DATE}} para las inferencias relativas.

Mensaje del usuario: "{{{text}}}"`,
});

const crearEventoCalendarioFlow = ai.defineFlow(
  {
    name: 'crearEventoCalendarioFlow',
    inputSchema: CrearEventoCalendarioInputSchema,
    outputSchema: CrearEventoCalendarioOutputSchema,
  },
  async input => {
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const {output} = await crearEventoCalendarioPrompt({
      text: input.text,
      CURRENT_DATE: currentDate,
    });
    return output!;
  }
);
