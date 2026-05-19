import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { paymentGateway, PaymentMethod, type PaymentResponse } from '@/lib/payment-gateway';

const PAYMENT_GATEWAY_ENABLED = process.env.PAYMENT_GATEWAY_ENABLED === 'true';
const PAYMENT_GATEWAY_TYPE = process.env.PAYMENT_GATEWAY_TYPE || 'mock';
const PAYMENT_GATEWAY_API_KEY = process.env.PAYMENT_GATEWAY_API_KEY;
const PAYMENT_GATEWAY_URL = process.env.PAYMENT_GATEWAY_URL;

const isProduction = process.env.NODE_ENV === 'production';

async function verifyWithRealGateway(
  transactionId: string
): Promise<PaymentResponse> {
  if (!PAYMENT_GATEWAY_ENABLED || !PAYMENT_GATEWAY_API_KEY) {
    return {
      success: false,
      status: 'failed',
      errorMessage: 'Pasarela de pago no configurada. Configure PAYMENT_GATEWAY_ENABLED, PAYMENT_GATEWAY_TYPE y PAYMENT_GATEWAY_API_KEY en .env.local'
    };
  }

  try {
    const response = await fetch(`${PAYMENT_GATEWAY_URL}/verify/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYMENT_GATEWAY_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Gateway error: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: data.success,
      transactionId: data.transactionId,
      status: data.status,
      errorMessage: data.errorMessage,
    };
  } catch (error) {
    return {
      success: false,
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Error al verificar con pasarela'
    };
  }
}

export const verifyPaymentTool = ai.defineTool(
  {
    name: 'pagos:verifyPayment',
    description: 'Verifica con el procesador de pagos si el monto fue capturado exitosamente. Para pagos en efectivo (cash), se verifica automáticamente. Para métodos digitales, requiere que la pasarela esté configurada.',
    inputSchema: z.object({
      orderId: z.string(),
      amount: z.number(),
      method: z.enum(['cash', 'digital', 'nequi', 'daviplata', 'pse', 'card']),
      customerId: z.string().optional(),
      customerPhone: z.string().optional(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      transactionId: z.string().optional(),
      status: z.string(),
      errorCode: z.string().optional(),
      message: z.string(),
      isSimulated: z.boolean(),
      gatewayType: z.string(),
    }),
  },
  async (input) => {
    if (input.method === 'cash') {
      return {
        success: true,
        status: 'completed',
        message: 'Pago contra entrega - el cliente paga al recibir el producto. No se requiere verificación de pasarela.',
        isSimulated: false,
        gatewayType: 'cash_on_delivery',
      };
    }

    if (!PAYMENT_GATEWAY_ENABLED) {
      const result = await paymentGateway.processPayment({
        orderId: input.orderId,
        amount: input.amount,
        method: input.method as PaymentMethod,
        customerId: input.customerId || 'unknown',
        customerPhone: input.customerPhone,
      });

      return {
        success: result.success,
        transactionId: result.transactionId,
        status: result.status,
        errorCode: result.errorCode,
        message: result.success 
          ? `Pago procesado exitosamente. Método: ${input.method}. Transaction ID: ${result.transactionId}`
          : `Pago falló: ${result.errorMessage}. Configure PAYMENT_GATEWAY_ENABLED=true para usar pasarela real.`,
        isSimulated: !isProduction,
        gatewayType: PAYMENT_GATEWAY_TYPE,
      };
    }

    const gatewayResult = await verifyWithRealGateway(input.orderId);

    return {
      success: gatewayResult.success,
      transactionId: gatewayResult.transactionId,
      status: gatewayResult.status,
      errorCode: gatewayResult.errorCode,
      message: gatewayResult.success
        ? `Pago verificado con pasarela ${PAYMENT_GATEWAY_TYPE}`
        : `Verificación fallida: ${gatewayResult.errorMessage}`,
      isSimulated: false,
      gatewayType: PAYMENT_GATEWAY_TYPE,
    };
  }
);

export const processPaymentTool = ai.defineTool(
  {
    name: 'pagos:processPayment',
    description: 'Procesa un nuevo pago. Para efectivo, se marca como completado. Para métodos digitales, procesa a través de la pasarela configurada.',
    inputSchema: z.object({
      orderId: z.string(),
      amount: z.number(),
      method: z.enum(['cash', 'digital', 'nequi', 'daviplata', 'pse', 'card']),
      customerId: z.string(),
      customerPhone: z.string().optional(),
      customerEmail: z.string().optional(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      transactionId: z.string().optional(),
      status: z.string(),
      errorCode: z.string().optional(),
      errorMessage: z.string().optional(),
      requiresAction: z.boolean(),
      actionMessage: z.string().optional(),
    }),
  },
  async (input) => {
    if (input.method === 'cash') {
      return {
        success: true,
        transactionId: `COD-${input.orderId}-${Date.now()}`,
        status: 'pending',
        requiresAction: true,
        actionMessage: 'El cliente pagará en efectivo al recibir el pedido. El repartidor debe cobrar y confirmar.',
      };
    }

    if (!PAYMENT_GATEWAY_ENABLED) {
      const result = await paymentGateway.processPayment({
        orderId: input.orderId,
        amount: input.amount,
        method: input.method as PaymentMethod,
        customerId: input.customerId,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail,
      });

      return {
        success: result.success,
        transactionId: result.transactionId,
        status: result.status,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
        requiresAction: result.status === 'pending',
        actionMessage: result.status === 'pending' ? 'Pago en procesamiento. Esperando confirmación.' : undefined,
      };
    }

    return {
      success: false,
      status: 'failed',
      errorMessage: 'Pasarela no configurada. Configure PAYMENT_GATEWAY_ENABLED=true',
      requiresAction: false,
      actionMessage: undefined,
    };
  }
);