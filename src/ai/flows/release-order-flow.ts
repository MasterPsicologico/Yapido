'use server';
/**
 * @fileOverview Orquestador de Liberación de Pedidos.
 * Ejecuta agentes en paralelo para máxima velocidad de respuesta.
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
    const logs: string[] = ["Protocolo de liberación activado"];
    let debtApplied = 0;

    try {
      // EJECUCIÓN EN PARALELO PARA VELOCIDAD MÁXIMA (GENKIT 1.x)
      logs.push("Sincronizando agentes especializados en paralelo...");
      
      const agentPromises = [
        // 1. Soporte
        soporteAgent({
          orderId: input.orderId,
          issueDescription: `Liberación: ${input.reason}. Carga: ${input.hasProducts}`,
          reporterRole: 'sistema',
          context: { driverId: input.driverId, orderData: { value: input.orderValue } }
        }).then(() => "Agente Soporte: Incidente registrado."),

        // 2. Pagos (Si hay productos)
        input.hasProducts ? pagosAgent({
          orderId: input.orderId,
          customerId: "SYSTEM",
          totalAmount: input.orderValue,
          deliveryFee: 0,
          paymentMethod: 'digital',
          currentState: 'PAYMENT_PENDING',
          context: { 
            reason: `LIBERACION_CON_PRODUCTOS`,
            isCancelled: true 
          }
        }).then(() => {
          debtApplied = input.orderValue;
          return "Agente Pagos: Penalización aplicada.";
        }) : Promise.resolve("Agente Pagos: Sin deuda pendiente."),

        // 3. Asignador
        asignadorAgent({
          orderId: input.orderId,
          storeLocation: { lat: 0, lng: 0 },
          customerLocation: { lat: 0, lng: 0 },
          orderValue: input.orderValue,
          currentState: 'REASSIGNING'
        }).then(() => "Agente Asignador: Pedido devuelto al pool."),

        // 4. Notificaciones
        notificacionesAgent({
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
        }).then(() => "Agente Notificaciones: Tienda alertada.")
      ];

      const results = await Promise.all(agentPromises);
      logs.push(...results);

      return {
        success: true,
        debtApplied,
        message: "Liberación completada exitosamente.",
        agentLogs: logs
      };

    } catch (e: any) {
      console.error("Error en Flow de Liberación:", e);
      return {
        success: false,
        message: "Error en la orquestación",
        agentLogs: [...logs, `ERROR: ${e.message}`]
      };
    }
  }
);
