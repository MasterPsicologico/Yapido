
'use server';
/**
 * @fileOverview Orquestador de Liberación de Pedidos.
 * Gestiona alarmas para el patrón si el motivo es crítico.
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

    // DETERMINAR SI ES UNA ALARMA CRÍTICA (Basado en palabras clave)
    const isAlarm = ["pinchado", "gasolina", "accidente"].some(k => input.reason.toLowerCase().includes(k));

    try {
      logs.push("Sincronizando agentes especializados...");
      
      const agentPromises = [
        // 1. Soporte: Registro de incidente con flag de Alerta si es necesario
        soporteAgent({
          orderId: input.orderId,
          issueDescription: `LIBERACIÓN URGENTE: ${input.reason}. Con Carga: ${input.hasProducts}`,
          reporterRole: 'repartidor',
          context: { 
            driverId: input.driverId, 
            orderData: { value: input.orderValue }
          }
        }).then(() => isAlarm ? "Agente Soporte: ALARMA ENVIADA AL PATRÓN." : "Agente Soporte: Incidente registrado."),

        // 2. Pagos (Si hay productos o es por falla técnica)
        input.hasProducts ? pagosAgent({
          orderId: input.orderId,
          customerId: "SYSTEM",
          totalAmount: input.orderValue,
          deliveryFee: 0,
          paymentMethod: 'digital',
          currentState: 'PAYMENT_PENDING',
          context: { 
            reason: `LIBERACION_CON_CARGA_${input.reason.toUpperCase().replace(/\s/g, '_')}`,
            isCancelled: true,
            isDelivered: false
          }
        }).then(() => {
          debtApplied = input.orderValue;
          return "Agente Pagos: Saldo de repartidor afectado por productos.";
        }) : Promise.resolve("Agente Pagos: Sin cargos adicionales."),

        // 3. Asignador: Devolver al pool inmediatamente
        asignadorAgent({
          orderId: input.orderId,
          storeLocation: { lat: 0, lng: 0 },
          customerLocation: { lat: 0, lng: 0 },
          orderValue: input.orderValue,
          currentState: 'REASSIGNING',
          isMultiOrder: false,
          demandLevel: 'NORMAL',
          priorityLevel: 1
        }).then(() => "Agente Asignador: Ruta devuelta al pool público."),

        // 4. Notificaciones: Alerta Maestra
        notificacionesAgent({
          orderId: input.orderId,
          event: isAlarm ? "DRIVER_EMERGENCY" : "DRIVER_UNASSIGNED",
          status: "searching",
          recipients: [{
            userId: input.storeId,
            role: "tienda",
            name: input.storeName,
            contactInfo: {}
          }],
          priority: isAlarm ? "urgent" : "high",
          context: { reason: input.reason, eta: "INMEDIATO" }
        }).then(() => "Agente Notificaciones: Patrón notificado con prioridad crítica.")
      ];

      const results = await Promise.all(agentPromises);
      logs.push(...results);

      return {
        success: true,
        debtApplied,
        message: isAlarm ? "Alarma enviada. Tu patrón ha sido notificado." : "Liberación completada.",
        agentLogs: logs
      };

    } catch (e: any) {
      console.error("Error en Flow de Liberación:", e);
      return {
        success: false,
        message: "Error en la orquestación de seguridad",
        agentLogs: [...logs, `ERROR: ${e.message}`]
      };
    }
  }
);
