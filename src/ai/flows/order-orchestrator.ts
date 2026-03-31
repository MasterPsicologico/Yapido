
'use server';
/**
 * @fileOverview Orquestador Maestro de Órdenes.
 * Este flujo coordina la ejecución secuencial de los agentes para procesar un pedido.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { clienteAgent } from '@/ai/agents/cliente';
import { fraudeAgent } from '@/ai/agents/fraude';
import { preciosAgent } from '@/ai/agents/precios';
import { rutasAgent } from '@/ai/agents/rutas';
import { asignadorAgent } from '@/ai/agents/asignador';
import { notificacionesAgent } from '@/ai/agents/notificaciones';

const OrderOrchestratorInputSchema = z.object({
  userId: z.string(),
  cartItems: z.array(z.any()),
  address: z.string(),
  paymentMethod: z.enum(['cash', 'digital']),
  storeId: z.string(),
  totalPrice: z.number(),
  customerName: z.string(),
  customerPhone: z.string().optional(),
});

export type OrderOrchestratorInput = z.infer<typeof OrderOrchestratorInputSchema>;

export async function orchestrateOrder(input: OrderOrchestratorInput) {
  return orchestrateOrderFlow(input);
}

const orchestrateOrderFlow = ai.defineFlow(
  {
    name: 'orchestrateOrderFlow',
    inputSchema: OrderOrchestratorInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      orderId: z.string().optional(),
      error: z.string().optional(),
      agentLogs: z.array(z.string()),
      data: z.any().optional(),
    }),
  },
  async (input) => {
    const logs: string[] = [];
    
    try {
      // 1. AGENTE CLIENTE: Validación inicial
      logs.push("Agente Cliente: Validando coherencia del pedido...");
      const clienteRes = await clienteAgent({
        userId: input.userId,
        query: "Procesar mi pedido actual",
        currentState: 'CONFIRM',
        context: {
          cartItems: input.cartItems,
          address: input.address,
          storeId: input.storeId,
          paymentMethod: input.paymentMethod
        }
      });

      if (clienteRes.error) throw new Error(clienteRes.error);

      // 2. AGENTE ANTIFRAUDE: Análisis de riesgo
      logs.push("Agente Antifraude: Escaneando perfiles y métodos de pago...");
      const fraudRes = await fraudeAgent({
        orderId: "PENDING",
        customerId: input.userId,
        orderValue: input.totalPrice,
        paymentMethod: input.paymentMethod,
        location: { lat: 0, lng: 0 },
        currentState: 'ANALYZING'
      });

      if (fraudRes.riskLevel === 'VERY_HIGH') {
        throw new Error("Pedido rechazado por protocolos de seguridad: " + fraudRes.reason);
      }

      // 3. AGENTE RUTAS Y PRECIOS: Cálculo de logística y tarifa
      logs.push("Agente Rutas: Calculando trayectoria óptima...");
      const routingRes = await rutasAgent({
        orderId: "PENDING",
        driverLocation: { lat: 0, lng: 0 },
        storeLocation: { lat: 0, lng: 0 },
        customerLocation: { lat: 0, lng: 0 },
        context: { weather: 'clear', trafficLevel: 1.0 }
      });

      logs.push("Agente Precios: Ajustando tarifa dinámica por demanda...");
      const pricingRes = await preciosAgent({
        orderId: "PENDING",
        distanceKm: routingRes.distanceKm,
        estimatedTimeMin: routingRes.estimatedTravelTimeMinutes,
        availableDrivers: 5,
        orderValue: input.totalPrice,
        weather: 'clear'
      });

      // 4. AGENTE ASIGNADOR: Preparando matchmaking
      logs.push("Agente Asignador: Buscando el mejor repartidor disponible...");
      const asignadorRes = await asignadorAgent({
        orderId: "PENDING",
        storeLocation: { lat: 0, lng: 0 },
        customerLocation: { lat: 0, lng: 0 },
        orderValue: input.totalPrice,
        currentState: 'SEARCHING_DRIVER'
      });

      // 5. AGENTE NOTIFICACIONES: SINCRONIZACIÓN REAL
      logs.push("Agente Notificaciones: Despachando alertas críticas...");
      
      // Llamada real al Agente de Notificaciones para alertar al vendedor
      await notificacionesAgent({
        orderId: "PENDING",
        event: "ORDER_CREATED",
        status: "pending",
        recipients: [
          {
            userId: input.storeId,
            role: "tienda",
            name: "Dueño de Negocio",
            contactInfo: {
              pushToken: "TOKEN_PLACEHOLDER"
            }
          }
        ],
        priority: "high",
        context: {
          productName: input.cartItems[0]?.name || "Pedido nuevo",
          amount: input.totalPrice
        }
      });
      
      return {
        success: true,
        agentLogs: logs,
        data: {
          riskScore: fraudRes.riskScore,
          eta: routingRes.estimatedTravelTimeMinutes,
          fare: pricingRes.totalDeliveryFare,
          suggestedDriver: asignadorRes.selectedDriverId
        }
      };

    } catch (e: any) {
      console.error("Error en Orquestación:", e);
      return {
        success: false,
        error: e.message,
        agentLogs: logs
      };
    }
  }
);
