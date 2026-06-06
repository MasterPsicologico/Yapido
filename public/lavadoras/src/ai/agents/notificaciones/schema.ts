import { z } from 'genkit';

/**
 * @fileOverview Esquemas de datos para el Agente de Notificaciones.
 */

export const NotificationChannelSchema = z.enum([
  'push',
  'sms',
  'email',
  'whatsapp',
  'in_app'
]);

export const NotificationPrioritySchema = z.enum([
  'low',
  'medium',
  'high',
  'urgent'
]);

export const NotificationRecipientSchema = z.object({
  userId: z.string(),
  role: z.enum(['cliente', 'tienda', 'repartidor', 'soporte']),
  name: z.string(),
  contactInfo: z.object({
    pushToken: z.string().optional(),
    phoneNumber: z.string().optional(),
    email: z.string().optional(),
  }),
});

export const NotificacionesAgentInputSchema = z.object({
  orderId: z.string(),
  event: z.string().describe('El evento que dispara la notificación (ej: ORDER_CREATED, DRIVER_NEAR)'),
  status: z.string(),
  recipients: z.array(NotificationRecipientSchema),
  priority: NotificationPrioritySchema.default('medium'),
  context: z.object({
    productName: z.string().optional(),
    eta: z.string().optional(),
    reason: z.string().optional(),
    amount: z.number().optional(),
  }).optional(),
});

export const NotificacionesAgentOutputSchema = z.object({
  notificationsSent: z.array(z.object({
    recipientId: z.string(),
    channel: NotificationChannelSchema,
    status: z.enum(['sent', 'failed']),
    message: z.string(),
  })),
  summary: z.string(),
  requiresFallback: z.boolean().default(false),
});

export type NotificacionesAgentInput = z.infer<typeof NotificacionesAgentInputSchema>;
export type NotificacionesAgentOutput = z.infer<typeof NotificacionesAgentOutputSchema>;
