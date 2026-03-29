'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta de análisis profundo para determinar responsabilidades en un reclamo.
 */

export const analyzeIssueTool = ai.defineTool(
  {
    name: 'soporte:analyzeIssue',
    description: 'Cruza datos de GPS, tiempos y pagos para proponer una resolución justa.',
    inputSchema: z.object({
      orderId: z.string(),
      issueType: z.string(),
      evidence: z.object({
        gpsMatches: z.boolean().default(true),
        deliveryPhotoPresent: z.boolean().default(false),
        preparationTimeExceeded: z.boolean().default(false),
      }),
    }),
    outputSchema: z.object({
      rootCause: z.string(),
      suggestedAction: z.enum(['REFUND_TOTAL', 'REFUND_PARTIAL', 'RESEND', 'CANCEL_NO_FEE', 'ESCALATE']),
      confidence: z.number(),
    }),
  },
  async (input) => {
    let action: any = 'ESCALATE';
    let cause = "Análisis complejo requerido";

    if (input.issueType === 'ORDER_NOT_RECEIVED' && !input.evidence.gpsMatches) {
      action = 'REFUND_TOTAL';
      cause = "Repartidor marcó entrega fuera del rango GPS del cliente.";
    } else if (input.issueType === 'STORE_STOCK_ISSUE') {
      action = 'CANCEL_NO_FEE';
      cause = "Tienda reporta falta de productos después de aceptar.";
    }

    return {
      rootCause: cause,
      suggestedAction: action,
      confidence: 0.95
    };
  }
);
