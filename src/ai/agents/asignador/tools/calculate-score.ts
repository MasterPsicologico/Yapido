
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para calcular el Score de un repartidor.
 * Fórmula: Score = (Rating * 0.3) - (Distancia * 0.4) - (CargaActual * 0.3)
 */

export const calculateScoreTool = ai.defineTool(
  {
    name: 'asignador:calculateScore',
    description: 'Calcula la puntuación de idoneidad de un repartidor para un pedido específico.',
    inputSchema: z.object({
      driverId: z.string(),
      distanceKm: z.number(),
      rating: z.number(),
      currentOrders: z.number(),
      vehicleType: z.string(),
    }),
    outputSchema: z.object({
      score: z.number(),
      rank: z.string(),
    }),
  },
  async (input) => {
    // Pesos del algoritmo
    const wRating = 30;
    const wDistance = 40;
    const wLoad = 30;

    // Normalización básica
    const ratingScore = input.rating * 20; // 5 estrellas = 100 pts
    const distancePenalty = Math.min(input.distanceKm * 20, 100); // Penales por cada KM
    const loadPenalty = input.currentOrders * 50; // Gran penalización por carga

    const totalScore = (ratingScore * (wRating/100)) - (distancePenalty * (wDistance/100)) - (loadPenalty * (wLoad/100));

    return {
      score: totalScore,
      rank: totalScore > 70 ? 'EXCELENTE' : totalScore > 40 ? 'BUENO' : 'POCO_RECOMENDABLE'
    };
  }
);
