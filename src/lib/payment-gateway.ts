export type PaymentMethod = 'cash' | 'digital' | 'nequi' | 'daviplata' | 'pse' | 'card';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export interface PaymentTransaction {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
  customerId: string;
  customerPhone?: string;
  transactionReference?: string;
  failureReason?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentRequest {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  customerId: string;
  customerPhone?: string;
  customerEmail?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  status: PaymentStatus;
  errorCode?: string;
  errorMessage?: string;
  redirectUrl?: string;
}

export type PaymentGatewayType = 'mock' | 'mercadopago' | 'payu' | 'nequi' | 'stripe';

interface GatewayConfig {
  type: PaymentGatewayType;
  isProduction: boolean;
  apiKey?: string;
  merchantId?: string;
}

const DEFAULT_CONFIG: GatewayConfig = {
  type: 'mock',
  isProduction: false,
};

class PaymentGatewayService {
  private config: GatewayConfig;
  private transactions: Map<string, PaymentTransaction> = new Map();

  constructor(config: GatewayConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  private generateTransactionId(): string {
    return `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  }

  private generateReference(orderId: string): string {
    return `REF-${orderId}-${Date.now()}`;
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const transactionId = this.generateTransactionId();
    const reference = this.generateReference(request.orderId);

    console.log(`[PaymentGateway] Processing payment:`, {
      transactionId,
      orderId: request.orderId,
      amount: request.amount,
      method: request.method,
      gateway: this.config.type
    });

    const transaction: PaymentTransaction = {
      id: transactionId,
      orderId: request.orderId,
      amount: request.amount,
      method: request.method,
      status: 'processing',
      createdAt: new Date(),
      updatedAt: new Date(),
      customerId: request.customerId,
      customerPhone: request.customerPhone,
      transactionReference: reference,
    };

    this.transactions.set(transactionId, transaction);

    try {
      const result = await this.executeGatewayPayment(transaction);

      transaction.status = result.status;
      transaction.updatedAt = new Date();
      
      if (result.success) {
        transaction.transactionReference = result.transactionId || reference;
      } else {
        transaction.failureReason = result.errorMessage;
      }

      this.transactions.set(transactionId, transaction);

      console.log(`[PaymentGateway] Payment result:`, {
        transactionId,
        success: result.success,
        status: result.status
      });

      return {
        success: result.success,
        transactionId,
        status: result.status,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
      };
    } catch (error) {
      transaction.status = 'failed';
      transaction.failureReason = error instanceof Error ? error.message : 'Unknown error';
      transaction.updatedAt = new Date();
      this.transactions.set(transactionId, transaction);

      console.error(`[PaymentGateway] Payment failed:`, error);

      return {
        success: false,
        transactionId,
        status: 'failed',
        errorMessage: transaction.failureReason,
      };
    }
  }

  private async executeGatewayPayment(transaction: PaymentTransaction): Promise<{
    success: boolean;
    status: PaymentStatus;
    transactionId?: string;
    errorCode?: string;
    errorMessage?: string;
  }> {
    switch (this.config.type) {
      case 'mock':
        return this.mockPayment(transaction);
      
      case 'mercadopago':
        return this.mercadopagoPayment(transaction);
      
      case 'payu':
        return this.payuPayment(transaction);
      
      case 'nequi':
        return this.nequiPayment(transaction);
      
      case 'stripe':
        return this.stripePayment(transaction);
      
      default:
        return this.mockPayment(transaction);
    }
  }

  private async mockPayment(transaction: PaymentTransaction): Promise<{
    success: boolean;
    status: PaymentStatus;
    transactionId?: string;
    errorCode?: string;
    errorMessage?: string;
  }> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (transaction.amount <= 0) {
      return {
        success: false,
        status: 'failed',
        errorCode: 'INVALID_AMOUNT',
        errorMessage: 'El monto debe ser mayor a 0',
      };
    }

    if (transaction.amount > 50000000) {
      return {
        success: false,
        status: 'failed',
        errorCode: 'AMOUNT_TOO_HIGH',
        errorMessage: 'El monto máximo es $50,000,000 COP',
      };
    }

    const successRate = this.config.isProduction ? 0.95 : 0.98;
    const isSuccess = Math.random() < successRate;

    if (isSuccess) {
      return {
        success: true,
        status: 'completed',
        transactionId: `MOCK-${transaction.id}`,
      };
    } else {
      const errors = [
        'INSUFFICIENT_FUNDS',
        'CARD_DECLINED',
        'TIMEOUT',
        'NETWORK_ERROR'
      ];
      const randomError = errors[Math.floor(Math.random() * errors.length)];
      
      return {
        success: false,
        status: 'failed',
        errorCode: randomError,
        errorMessage: this.getErrorMessage(randomError),
      };
    }
  }

  private getErrorMessage(errorCode: string): string {
    const messages: Record<string, string> = {
      'INSUFFICIENT_FUNDS': 'Fondos insuficientes en la cuenta',
      'CARD_DECLINED': 'La tarjeta fue rechazada',
      'TIMEOUT': 'Tiempo de espera agotado',
      'NETWORK_ERROR': 'Error de conexión',
      'INVALID_AMOUNT': 'Monto inválido',
      'AMOUNT_TOO_HIGH': 'Monto excede el límite permitido',
    };
    return messages[errorCode] || 'Error en el procesamiento del pago';
  }

  private async mercadopagoPayment(transaction: PaymentTransaction): Promise<{
    success: boolean;
    status: PaymentStatus;
    transactionId?: string;
    errorCode?: string;
    errorMessage?: string;
  }> {
    console.log('[PaymentGateway] MercadoPago integration not configured');
    console.log('[PaymentGateway] Configure MERCADOPAGO_API_KEY in .env.local');
    return this.mockPayment(transaction);
  }

  private async payuPayment(transaction: PaymentTransaction): Promise<{
    success: boolean;
    status: PaymentStatus;
    transactionId?: string;
    errorCode?: string;
    errorMessage?: string;
  }> {
    console.log('[PaymentGateway] PayU integration not configured');
    console.log('[PaymentGateway] Configure PAYU_MERCHANT_ID and PAYU_API_KEY in .env.local');
    return this.mockPayment(transaction);
  }

  private async nequiPayment(transaction: PaymentTransaction): Promise<{
    success: boolean;
    status: PaymentStatus;
    transactionId?: string;
    errorCode?: string;
    errorMessage?: string;
  }> {
    console.log('[PaymentGateway] Nequi API integration requires business account');
    console.log('[PaymentGateway] Contact Nequi to get API credentials');
    return this.mockPayment(transaction);
  }

  private async stripePayment(transaction: PaymentTransaction): Promise<{
    success: boolean;
    status: PaymentStatus;
    transactionId?: string;
    errorCode?: string;
    errorMessage?: string;
  }> {
    console.log('[PaymentGateway] Stripe integration not configured');
    console.log('[PaymentGateway] Configure STRIPE_API_KEY in .env.local');
    return this.mockPayment(transaction);
  }

  async verifyPayment(transactionId: string): Promise<PaymentTransaction | null> {
    return this.transactions.get(transactionId) || null;
  }

  async refundPayment(transactionId: string): Promise<PaymentResponse> {
    const transaction = this.transactions.get(transactionId);
    
    if (!transaction) {
      return {
        success: false,
        status: 'failed',
        errorMessage: 'Transacción no encontrada',
      };
    }

    if (transaction.status !== 'completed') {
      return {
        success: false,
        status: 'failed',
        errorMessage: 'Solo se pueden reembolsar transacciones completadas',
      };
    }

    transaction.status = 'refunded';
    transaction.updatedAt = new Date();
    this.transactions.set(transactionId, transaction);

    console.log(`[PaymentGateway] Refund processed:`, { transactionId });

    return {
      success: true,
      transactionId,
      status: 'refunded',
    };
  }

  getTransactionHistory(): PaymentTransaction[] {
    return Array.from(this.transactions.values());
  }
}

export const paymentGateway = new PaymentGatewayService();

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getPaymentMethodName(method: PaymentMethod): string {
  const names: Record<PaymentMethod, string> = {
    cash: 'Contra entrega',
    digital: 'Pago digital',
    nequi: 'Nequi',
    daviplata: 'Daviplata',
    pse: 'PSE',
    card: 'Tarjeta',
  };
  return names[method];
}