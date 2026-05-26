'use server';
/**
 * @fileOverview A financial AI agent that analyzes spending patterns and provides personalized financial alerts.
 *
 * - generateFinancialAlerts - A function that handles the generation of financial alerts.
 * - SpendingDataInput - The input type for the generateFinancialAlerts function.
 * - FinancialAlertsOutput - The return type for the generateFinancialAlerts function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TransactionSchema = z.object({
  date: z.string().describe('Fecha de la transacción (YYYY-MM-DD).'),
  description: z.string().describe('Descripción del gasto o ingreso.'),
  category: z.string().describe('Categoría del gasto o ingreso (e.g., "Comida", "Transporte", "Sueldo").'),
  amount: z.number().describe('Monto de la transacción. Positivo para ingresos, negativo para gastos.'),
});

const SpendingDataInputSchema = z.object({
  transactions: z.array(TransactionSchema).describe('Lista de transacciones financieras del usuario.'),
  budgetLimits: z.array(z.object({
    category: z.string().describe('Categoría financiera.'),
    limit: z.number().describe('Límite de presupuesto para esta categoría.')
  })).optional().describe('Límites de presupuesto definidos por el usuario para diferentes categorías.'),
  timePeriod: z.string().optional().describe('Período de tiempo que cubren las transacciones (e.g., "último mes", "última semana").'),
  isSurvivalMode: z.boolean().optional().describe('Indica si el saldo libre del usuario es negativo.'),
});
export type SpendingDataInput = z.infer<typeof SpendingDataInputSchema>;

const FinancialAlertsOutputSchema = z.object({
  summary: z.string().describe('Un resumen conciso de los patrones de gasto.'),
  overspendingAreas: z.array(z.object({
    category: z.string().describe('Categoría donde se identificó gasto excesivo.'),
    details: z.string().describe('Detalles sobre por qué se considera gasto excesivo.')
  })).describe('Áreas donde se detecta gasto excesivo.'),
  savingsOpportunities: z.array(z.object({
    opportunity: z.string().describe('Descripción de la oportunidad de ahorro.'),
    suggestion: z.string().describe('Sugerencia específica para aprovechar la oportunidad.')
  })).describe('Sugerencias para oportunidades de ahorro.'),
  behavioralPatterns: z.array(z.object({
    pattern: z.string().describe('Patrón conductual oculto detectado (ej: gastos altos los jueves tarde).'),
    impact: z.string().describe('Impacto porcentual o financiero del patrón.'),
    action: z.string().describe('Acción sugerida para corregir o blindar el presupuesto.')
  })).optional().describe('Patrones de conducta detectados por la IA que el usuario podría no notar.'),
  insights: z.array(z.string()).describe('Cualquier otra información financiera útil o patrón detectado.'),
  survivalSteps: z.array(z.string()).optional().describe('Pasos específicos para salir de la zona de quiebra financiera si el modo supervivencia está activo.'),
});
export type FinancialAlertsOutput = z.infer<typeof FinancialAlertsOutputSchema>;

export async function generateFinancialAlerts(input: SpendingDataInput): Promise<FinancialAlertsOutput> {
  return generateFinancialAlertsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialAlertsPrompt',
  input: { schema: SpendingDataInputSchema },
  output: { schema: FinancialAlertsOutputSchema },
  prompt: `Eres un asistente financiero de élite y un entrenador conductual. Tu tarea es analizar los datos de transacciones financieras proporcionados y detectar lo que el usuario NO ve.

{{#if isSurvivalMode}}
### PROTOCOLO DE EMERGENCIA: MODO SUPERVIVENCIA ACTIVO ###
El usuario tiene un SALDO LIBRE NEGATIVO. Esto significa que sus compromisos superan su capital real.
INSTRUCCIONES DE CRISIS:
1. BLOQUEO DE INVERSIÓN: No sugieras compras, inversiones o gastos "futuros".
2. ENFOQUE EN RECORTE: Identifica gastos no esenciales (ocio, suscripciones, comidas fuera) y exige su eliminación inmediata.
3. RUTA DE ESCAPE: Genera una lista de 'survivalSteps' con acciones quirúrgicas para recuperar el saldo positivo en 7 días.
4. TONO: Sé extremadamente directo, casi marcial. Usa frases como "Tu capital está en riesgo", "Eliminación obligatoria de...".
{{else}}
INSTRUCCIONES CRÍTICAS:
1. DETECCIÓN DE PATRONES CONDUCTUALES: Busca anomalías temporales. ¿Gasta más los jueves después de las 6 PM? ¿Hay micro-gastos recurrentes en 'Ocio' que sumen un impacto alto? 
2. TONO DE ENTRENADOR: Sé directo, técnico y motivador. Usa frases como "He detectado un patrón que erosiona tu ahorro..." o "Tu debilidad parece estar en los fines de semana...".
3. MODO BLINDAJE: Si detectas un patrón de gasto impulsivo en días específicos, sugiere activar un "Modo Blindaje" o "Protocolo de Ahorro" para esos momentos.
{{/if}}

Analiza 'transactions' y 'budgetLimits' para identificar:
- Áreas de gasto excesivo.
- Oportunidades de ahorro.
- Patrones de comportamiento (Días de la semana, horarios, frecuencia).

Datos de transacciones:
{{#each transactions}}
- Fecha: {{{date}}}, Descripción: {{{description}}}, Categoría: {{{category}}}, Monto: {{{amount}}}
{{/each}}

{{#if budgetLimits}}
Límites de presupuesto:
{{#each budgetLimits}}
- Categoría: {{{category}}}, Límite: {{{limit}}}
{{/each}}
{{/if}}

Genera la respuesta en JSON siguiendo el esquema. Todo debe estar en español profesional.`,
});

const generateFinancialAlertsFlow = ai.defineFlow(
  {
    name: 'generateFinancialAlertsFlow',
    inputSchema: SpendingDataInputSchema,
    outputSchema: FinancialAlertsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
        throw new Error('Failed to generate financial alerts.');
    }
    return output;
  }
);