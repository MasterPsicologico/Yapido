
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * @fileOverview Herramienta para generar cupones en el sistema.
 */

export const createCouponTool = ai.defineTool(
  {
    name: 'marketing:createCoupon',
    description: 'Genera un nuevo código de descuento en la base de datos.',
    inputSchema: z.object({
      code: z.string(),
      discountType: z.enum(['percentage', 'fixed']),
      value: z.number(),
      minOrderValue: z.number().default(0),
      expiresInDays: z.number().default(7),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      couponId: z.string(),
      summary: z.string(),
    }),
  },
  async (input) => {
    // Simulación de escritura en Firestore collection('coupons')
    const couponId = `CPN-${input.code}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    return {
      success: true,
      couponId,
      summary: `Cupón ${input.code} creado: ${input.value}${input.discountType === 'percentage' ? '%' : ' COP'} de descuento.`
    };
  }
);
