/**
 * Nequi API Client (Mock/Simulator)
 * 
 * Esta clase simula la integración real con la API de Nequi.
 * Permite enviar una solicitud de pago (push) al celular del cliente y
 * consultar el estado de esa transacción.
 * 
 * Cuando se tengan las llaves reales de producción, se reemplazarán los 
 * métodos internos con llamadas HTTP reales (fetch a la API de Nequi AWS API Gateway).
 */

export type NequiPaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FAILED';

export interface NequiPaymentRequest {
  phoneNumber: string;
  value: number;
  reference: string; // Order ID
}

export interface NequiPaymentResponse {
  transactionId: string;
  status: NequiPaymentStatus;
  message: string;
}

class NequiClientSimulator {
  // Simula el envío de la notificación Push al celular del cliente
  async requestPayment(data: NequiPaymentRequest): Promise<NequiPaymentResponse> {
    console.log(`[NEQUI SIMULATOR] Solicitando pago de $${data.value} al número ${data.phoneNumber}...`);
    
    // Simula latencia de red
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generamos un ID de transacción falso pero único
    const transactionId = `NQ-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    return {
      transactionId,
      status: 'PENDING',
      message: 'Notificación push enviada al usuario. Esperando confirmación en su app Nequi.'
    };
  }

  // Simula la consulta del estado de la transacción
  async checkPaymentStatus(transactionId: string): Promise<NequiPaymentStatus> {
    console.log(`[NEQUI SIMULATOR] Consultando estado de Tx: ${transactionId}...`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Lógica de simulación: 
    // Para propósitos de desarrollo, digamos que 80% de las veces se aprueba,
    // 10% sigue pendiente, y 10% se rechaza.
    const random = Math.random();
    
    if (random > 0.3) {
      return 'APPROVED';
    } else if (random > 0.1) {
      return 'PENDING';
    } else {
      return 'REJECTED';
    }
  }
}

export const nequiClient = new NequiClientSimulator();
