'use server';
/**
 * @fileOverview Un agente de IA evolucionado para procesar múltiples transacciones financieras en un solo mensaje.
 * Detecta intenciones múltiples, propone categorías dinámicas y entiende fechas relativas.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TransactionItemSchema = z.object({
  intent: z.enum(['crear', 'modificar', 'eliminar']).describe('La intención del usuario para este ítem específico.'),
  targetReference: z.string().optional().describe('Palabra clave ÚNICA para identificar la transacción si es para modificar o eliminar.'),
  type: z.enum(['gasto', 'ingreso']).optional().describe('Tipo de transacción.'),
  amount: z.number().optional().describe('Monto de la transacción.'),
  description: z.string().optional().describe('Descripción clara de lo que se compró o ganó.'),
  category: z.string().optional().describe('Categoría descriptiva de UNA SOLA PALABRA.'),
  date: z.string().optional().describe('Fecha en formato YYYY-MM-DD.'),
});

const ChatRegistroFinancieroOutputSchema = z.object({
  items: z.array(TransactionItemSchema).describe('Lista de todas las transacciones o acciones detectadas en el texto.'),
});

export type ChatRegistroFinancieroOutput = z.infer<typeof ChatRegistroFinancieroOutputSchema>;

export async function chatRegistroFinanciero(input: { text: string, context?: string, currentDate?: string }): Promise<ChatRegistroFinancieroOutput> {
  return chatRegistroFinancieroFlow(input);
}

const prompt = ai.definePrompt({
  name: 'registroFinancieroPrompt',
  input: {schema: z.object({ text: z.string(), CURRENT_DATE: z.string(), context: z.string().optional() })},
  output: {schema: ChatRegistroFinancieroOutputSchema},
  prompt: `Eres un asistente financiero de élite. Tu tarea es extraer TODAS las transacciones mencionadas en el texto del usuario con precisión quirúrgica.

CONTEXTO DEL SISTEMA (Categorías actuales y datos):
{{{context}}}

REGLAS DE ORO DE CATEGORIZACIÓN (ESTRICTO):
1. REUTILIZACIÓN OBLIGATORIA: Antes de crear una categoría, busca en el CONTEXTO si existe una que cubra el concepto. ÚSALA EXACTAMENTE IGUAL (mismas letras y acentos).
2. MAPE SEMÁNTICO: 
   - Desayuno, comida, cena, restaurante, snacks -> "Alimentación" (si existe en contexto).
   - Gasolina, uber, taxi, pasajes -> "Transporte" (si existe en contexto).
   - Sueldo, salario, honorarios -> "Trabajo" (si existe en contexto).
3. PROHIBICIÓN DE SINÓNIMOS: No crees "Comida" si ya existe "Alimentación". No crees "Sueldo" si ya existe "Trabajo".
4. CREACIÓN RESTRINGIDA: Solo propón una categoría nueva de UNA SOLA PALABRA si el concepto es totalmente ajeno a las categorías listadas en el CONTEXTO.

REGLAS DE PROCESAMIENTO:
1. Divide el texto en eventos financieros independientes.
2. Identifica ingresos y gastos.
3. Usa la fecha actual {{CURRENT_DATE}} para resolver términos como "hoy" o "ayer".

Texto del usuario: "{{{text}}}"`,
});

const chatRegistroFinancieroFlow = ai.defineFlow(
  {
    name: 'chatRegistroFinancieroFlow',
    inputSchema: z.object({ text: z.string(), context: z.string().optional(), currentDate: z.string().optional() }),
    outputSchema: ChatRegistroFinancieroOutputSchema,
  },
  async (input) => {
    const dateToUse = input.currentDate || new Date().toISOString().split('T')[0];
    const {output} = await prompt({
      text: input.text,
      CURRENT_DATE: dateToUse,
      context: input.context || 'No hay datos previos.'
    });
    if (!output) {
      throw new Error('No se pudo procesar la instrucción.');
    }
    return output;
  }
);
