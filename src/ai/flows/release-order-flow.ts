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
      logs.push("Agente Soporte: Registrando deserción de ruta...");
      await soporteAgent({
        orderId: input.orderId,
        issueDescription: `Liberación: ${input.reason}. Carga: ${input.hasProducts}`,
        reporterRole: 'sistema',
        context: { 
          driverId: input.driverId,
          orderData: { value: input.orderValue } 
        }
      });

      // 2. AGENTE PAGOS: Gestión de Deuda
      if (input.hasProducts) {
        logs.push(`Agente Pagos: Calculando penalización...`);
        debtApplied = input.orderValue;
        await pagosAgent({
          orderId: input.orderId,
          customerId: "SYSTEM",
          totalAmount: input.orderValue,
          deliveryFee: 0,
          paymentMethod: 'digital',
          currentState: 'PAYMENT_PENDING',
          context: { 
            reason: `LIBERACION_CON_PRODUCTOS_${input.reason.toUpperCase().replace(/\s/g, '_')}`,
            isCancelled: true 
          }
        });
      }

      // 3. AGENTE ASIGNADOR: Reposicionamiento
      logs.push("Agente Asignador: Devolviendo pedido al pool...");
      await asignadorAgent({
        orderId: input.orderId,
        storeLocation: { lat: 0, lng: 0 },
        customerLocation: { lat: 0, lng: 0 },
        orderValue: input.orderValue,
        currentState: 'REASSIGNING'
      });

      // 4. AGENTE NOTIFICACIONES: Alerta a tienda
      logs.push("Agente Notificaciones: Informando a la tienda...");
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
        priority: "high",
        context: { reason: input.reason }
      });

      return {
        success: true,
        debtApplied,
        message: input.hasProducts 
          ? `Pedido liberado. Deuda aplicada: $${input.orderValue}` 
          : "Pedido liberado exitosamente.",
        agentLogs: logs
      };

    } catch (e: any) {
      console.error("Error en Flow de Liberación:", e);
      return {
        success: false,
        message: "Error en la orquestación de liberación",
        agentLogs: [...logs, `ERROR: ${e.message}`]
      };
    }
  }
);
