/**
 * Constantes de dominio compartidas.
 * Usadas tanto en el cliente (Next.js) como en Cloud Functions.
 */

export const VEHICLE_TYPES = ['moto', 'auto', 'auto_comfort'] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const TRIP_STATUSES = [
  'searching',     // pasajero creó viaje, buscando conductor
  'offered',       // conductor recibió la oferta, decidiendo
  'accepted',      // conductor aceptó, va en camino
  'arriving',      // conductor llegó al pickup
  'in_progress',   // viaje en curso
  'completed',     // viaje finalizado, esperando pago
  'rated',         // viaje calificado y cerrado
  'cancelled',     // cancelado por pasajero o conductor
  'no_drivers',    // sin conductores disponibles
] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

export const PAYMENT_METHODS = ['cash', 'card', 'wompi', 'pse'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const DRIVER_STATUSES = [
  'pending_docs',  // documentos pendientes de revisión
  'approved',      // aprobado, puede trabajar
  'rejected',      // documentos rechazados
  'blocked',       // bloqueado por admin
] as const;
export type DriverStatus = (typeof DRIVER_STATUSES)[number];

export const DRIVER_ONLINE_STATUSES = ['online', 'on_trip', 'offline'] as const;
export type DriverOnlineStatus = (typeof DRIVER_ONLINE_STATUSES)[number];

export const CANCEL_REASONS = [
  'passenger_no_show',
  'passenger_changed_mind',
  'driver_no_show',
  'driver_vehicle_issue',
  'passenger_behavior',
  'driver_behavior',
  'wrong_address',
  'system',
] as const;
export type CancelReason = (typeof CANCEL_REASONS)[number];

export const USER_ROLES = ['passenger', 'driver', 'both', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

// Timeouts (segundos)
export const TIMEOUTS = {
  OFFER_TO_DRIVER: 12,         // Aguachica: 12s; ciudades grandes: 8s
  DRIVER_WAIT_PICKUP: 5 * 60,  // 5 min esperando al pasajero
  PASSENGER_WAIT_DRIVER: 5 * 60,
  PAYMENT_RETRY: 60,
  GPS_INTERVAL_FAST: 2_000,
  GPS_INTERVAL_NORMAL: 3_000,
  GPS_INTERVAL_SLOW: 5_000,
  GPS_INTERVAL_BACKGROUND: 15_000,
  GPS_MIN_DISTANCE_M: 10,
} as const;

// Comisiones
export const DEFAULT_COMMISSION_PCT = 0.20;        // 20% plataforma
export const LAUNCH_COMMISSION_PCT = 0.00;          // 0% lanzamiento Aguachica
export const LAUNCH_WEEKS = 4;                       // duración del lanzamiento

// Multi-ciudad
export const DEFAULT_CITY_ID = 'aguachica';

