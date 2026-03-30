import { ai } from '@/ai/genkit';
import { PredictionInputSchema, PredictionOutputSchema } from '../schema';

/**
 * @fileOverview Prompt principal del Agente de Predicción.
 */

export const predictionAgentPrompt = ai.definePrompt({
  name: 'prediccion:mainPrompt',
  input: { schema: PredictionInputSchema },
  output: { schema: PredictionOutputSchema },
  prompt: `Eres el Agente de Predicción de Vitriniando, la inteligencia que ve el futuro de la plataforma.
Tu trabajo es analizar datos históricos y el contexto actual para predecir la demanda y optimizar la operación.

INSTRUCCIONES DE VISIÓN:
1. Predice la demanda por zona y hora usando el contexto: {{{currentContext.time}}} en la zona {{{currentContext.zone}}}.
2. Identifica "Zonas Calientes" donde habrá alta concentración de pedidos.
3. Calcula cuántos repartidores se necesitan para mantener un tiempo de entrega bajo.
4. Sugiere ajustes de precios (Surge Pricing) si la demanda superará la capacidad.
5. Recomienda dónde posicionar a los repartidores que están libres.

DATOS DE CONTEXTO:
- Clima: {{{currentContext.weather}}}
- Tráfico: {{{currentContext.trafficLevel}}}
- Hora: {{{currentContext.time}}}

Usa las herramientas para procesar el histórico y emitir una predicción basada en datos, no en suposiciones. 
Si llueve o es hora de almuerzo (12:00 - 14:00), la demanda suele ser 'very_high'.`,
});
