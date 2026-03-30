'use server';
/**
 * @fileOverview Orquestador de Liberación de Pedidos.
 * Maneja la lógica de abandono de ruta y penalizaciones financieras.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { soporteAgent } from '@/ai/agents/soporte';
import { pagosAgent } from '@/ai/agents/pagos';
import { asignadorAgent } from '@/ai/agents/asignador';
import { notificacionesAgent } from '@/ai/agents/notificaciones';

const ReleaseOrderInputSchema = z.object({
  orderId: z.string(),
  driverId: z.string(),
  reason: z.string(),
  hasProducts: z.boolean().describe('Indica si el repartidor ya recogió los productos en tienda'),
  orderValue: z.number(),
  storeId: z.string(),
  storeName: z.string(),
});

export async function releaseOrder(input: z.infer<typeof ReleaseOrderInputSchema>) {
  return releaseOrderFlow(input);
}

const releaseOrderFlow = ai.defineFlow(
  {
    name: 'releaseOrderFlow',
    inputSchema: ReleaseOrderInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      debtApplied: z.number().optional(),
      message: z.string(),
      agentLogs: z.array(z.string()),
    }),
  },
  async (input) => {
    const logs: string[] = [];
    let debtApplied = 0;

    try {
      // 1. AGENTE SOPORTE: Registro del incidente
      logs.push("Agente Soporte: Registrando deserción de ruta y creando ticket de auditoría...");
      await soporteAgent({
        orderId: input.orderId,
        issueDescription: `Liberación de pedido por el repartidor. Motivo: ${input.reason}. Posesión de productos: ${input.hasProducts}`,
        reporterRole: 'sistema',
        context: { driverId: input.driverId }
      });

      // 2. AGENTE PAGOS: Gestión de Deuda si tiene productos
      if (input.hasProducts) {
        logs.push(`Agente Pagos: Calculando penalización por artículos en posesión ($${input.orderValue})...`);
        debtApplied = input.orderValue;
        // En una implementación real, aquí se actualizaría el balance del driver en Firestore
        await pagosAgent({
          orderId: input.orderId,
          customerId: "SYSTEM",
          totalAmount: input.orderValue,
          deliveryFee: 0,
          paymentMethod: 'digital',
          currentState: 'PAYMENT_PENDING',
          context: { reason: "DEUDA_POR_LIBERACION_CON_CARGA" }
        });
      }

      // 3. AGENTE ASIGNADOR: Reposicionamiento del pedido
      logs.push("Agente Asignador: Devolviendo pedido al pool de rutas disponibles...");
      await asignadorAgent({
        orderId: input.orderId,
        storeLocation: { lat: 0, lng: 0 },
        customerLocation: { lat: 0, lng: 0 },
        orderValue: input.orderValue,
        currentState: 'REASSIGNING'
      });

      // 4. AGENTE NOTIFICACIONES: Alerta a la tienda
      logs.push("Agente Notificaciones: Informando a la tienda sobre el cambio de repartidor...");
      await notificacionesAgent({
        orderId: input.orderId,
        event: "DRIVER_UNASSIGNED",
        status: "searching",
        recipients: [{
          userId: input.storeId,
          role: "tienda",
          name: input.storeName,
          contactInfo: {}
        }],
        priority: "high"
      });

      return {
        success: true,
        debtApplied,
        message: input.hasProducts 
          ? `Pedido liberado. Se ha generado una deuda de $${input.orderValue} en tu cuenta.` 
          : "Pedido liberado exitosamente.",
        agentLogs: logs
      };

    } catch (e: any) {
      return {
        success: false,
        message: "Error en la orquestación de liberación",
        agentLogs: logs
      };
    }
  }
);
