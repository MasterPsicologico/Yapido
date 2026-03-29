'use server';
import { z } from 'genkit';

/**
 * @fileOverview Esquemas de datos para el Agente Antifraude.
 */

export const RiskLevelSchema = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'VERY_HIGH'
]);

export const FraudStateSchema = z.enum([
  'COLLECTING',
  'ANALYZING',
  'SAFE',
  'FLAGGED',
  'VERIFICATION_REQUIRED',
  'BLOCKED',
  'PAYMENT_FROZEN'
]);

export const FraudAgentInputSchema = z.object({
  orderId: z.string(),
  customerId: z.string(),
  driverId: z.string().optional(),
  orderValue: z.number(),
  paymentMethod: z.string(),
  location: z.object({
    lat: z.number(),
    lng: z.number()
  }),
  history: z.object({
    customerRefunds: z.number().default(0),
    customerCancellations: z.number().default(0),
    driverCancellations: z.number().default(0),
    accountAgeDays: z.number().default(0)
  }).optional(),
  currentState: FraudStateSchema.default('COLLECTING'),
});

export const FraudAgentOutputSchema = z.object({
  riskScore: z.number().min(0).max(100),
  riskLevel: RiskLevelSchema,
  nextState: FraudStateSchema,
  recommendedAction: z.enum(['NONE', 'MONITOR', 'REQUEST_PIN', 'REQUEST_PHOTO', 'BLOCK_ACCOUNT', 'FREEZE_PAYMENT']),
  reason: z.string(),
  requiresHumanReview: z.boolean().default(false)
});

export type FraudAgentInput = z.infer<typeof FraudAgentInputSchema>;
export type FraudAgentOutput = z.infer<typeof FraudAgentOutputSchema>;
