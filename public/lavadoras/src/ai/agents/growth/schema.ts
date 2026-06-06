import { z } from 'genkit';

/**
 * @fileOverview Esquemas de datos para el Agente Growth.
 */

export const ExpansionPrioritySchema = z.enum(['BAJA', 'MEDIA', 'ALTA', 'CRITICA']);

export const BusinessCategorySchema = z.enum([
  'RESTAURANTES',
  'FARMACIAS',
  'SUPERMERCADOS',
  'LICORERIAS',
  'MENSAJERIA',
  'DARK_KITCHENS',
  'MASCOTAS'
]);

export const GrowthAgentInputSchema = z.object({
  currentCoverage: z.object({
    activeZones: z.array(z.string()),
    activeCities: z.array(z.string()),
  }),
  analyticsData: z.object({
    topProfitableZones: z.array(z.string()),
    underservedZones: z.array(z.string()),
    averageTicketByZone: z.record(z.number()),
  }),
  budget: z.number().describe('Presupuesto para inversión en expansión'),
  strategy: z.enum(['PENETRACION', 'EXPANSION_GEOGRAFICA', 'NUEVOS_SERVICIOS', 'B2B']).default('EXPANSION_GEOGRAFICA'),
});

export const GrowthAgentOutputSchema = z.object({
  expansionPlan: z.array(z.object({
    targetArea: z.string(),
    strategy: z.string(),
    priority: ExpansionPrioritySchema,
    expansionScore: z.number().min(0).max(100),
    recommendedHires: z.number(),
    targetBusinessTypes: z.array(BusinessCategorySchema),
  })),
  alliances: z.array(z.object({
    partnerType: z.string(),
    benefit: z.string(),
    estimatedImpact: z.string(),
  })),
  investmentRecommendation: z.object({
    amount: z.number(),
    allocation: z.record(z.number()),
    expectedROI: z.string(),
  }),
  message: z.string().describe('Resumen estratégico para el Supervisor'),
});

export type GrowthAgentInput = z.infer<typeof GrowthAgentInputSchema>;
export type GrowthAgentOutput = z.infer<typeof GrowthAgentOutputSchema>;
