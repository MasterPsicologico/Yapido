
import {
  Clock,
  Store,
  MapPin,
  Package,
  Truck,
  CheckCircle2,
  Zap,
  XCircle,
  Target,
  RotateCcw,
  Star,
} from 'lucide-react';

export interface TimelineEvent {
  id: string;
  label: string;
  time: string | null;
  icon: any;
  status: 'completed' | 'current' | 'pending';
  color: string;
  bgColor: string;
  detail?: string;
  isOverdue?: boolean;
}

export type AssignmentType = 
  | 'auto_assigned' 
  | 'manual_accepted' 
  | 'recurring_client' 
  | 'counter_offer'
  | 'unknown';

const STATUS_ORDER = [
  'pending',
  'ready_for_pickup',
  'at_store',
  'delivered_to_driver',
  'shipped',
  'at_destination',
  'delivered',
  'completed',
];

const STATUS_MAP: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  pending:              { label: 'Solicitud',      icon: Clock,        color: 'text-orange-500',  bgColor: 'bg-orange-100' },
  ready_for_pickup:     { label: 'Asignado',       icon: Store,        color: 'text-indigo-500',  bgColor: 'bg-indigo-100' },
  at_store:             { label: 'En Tienda',      icon: MapPin,       color: 'text-amber-600',   bgColor: 'bg-amber-100' },
  delivered_to_driver:  { label: 'Con Repartidor',  icon: Package,     color: 'text-purple-500',  bgColor: 'bg-purple-100' },
  shipped:              { label: 'En Camino',      icon: Truck,        color: 'text-blue-500',    bgColor: 'bg-blue-100' },
  at_destination:       { label: 'En Destino',     icon: MapPin,       color: 'text-cyan-500',    bgColor: 'bg-cyan-100' },
  delivered:            { label: 'Entregado',      icon: CheckCircle2, color: 'text-emerald-500', bgColor: 'bg-emerald-100' },
  completed:            { label: 'Finalizado',     icon: Zap,          color: 'text-slate-900',   bgColor: 'bg-primary/20' },
  cancelled:            { label: 'Cancelado',      icon: XCircle,      color: 'text-red-500',     bgColor: 'bg-red-100' },
};

function parseTimestamp(ts: any): Date | null {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  if (typeof ts === 'string') return new Date(ts);
  return null;
}

function formatTime(date: Date | null): string | null {
  if (!date) return null;
  return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Construye los eventos del timeline a partir de una orden.
 * Cada status se mapea a un nodo visual.
 */
export function buildTimelineEvents(order: any): TimelineEvent[] {
  if (!order) return [];

  const currentStatus = order.status || 'pending';

  if (currentStatus === 'cancelled') {
    const cancelTime = parseTimestamp(order.cancelledAt || order.updatedAt);
    return [
      {
        id: 'cancelled',
        label: 'Cancelado',
        time: formatTime(cancelTime),
        icon: XCircle,
        status: 'completed',
        color: 'text-red-500',
        bgColor: 'bg-red-100',
        detail: order.cancellationReason || 'Orden cancelada',
      },
    ];
  }

  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  const timestampKeys: Record<string, string> = {
    pending: 'createdAt',
    ready_for_pickup: 'acceptedAt',
    at_store: 'atStoreAt',
    delivered_to_driver: 'deliveredToDriverAt',
    shipped: 'shippedAt',
    at_destination: 'atDestinationAt',
    delivered: 'deliveredAt',
    completed: 'completedAt',
  };

  const events: TimelineEvent[] = STATUS_ORDER.map((statusKey, idx) => {
    const config = STATUS_MAP[statusKey];
    const ts = parseTimestamp(order[timestampKeys[statusKey]]);

    let nodeStatus: 'completed' | 'current' | 'pending';
    if (idx < currentIdx) nodeStatus = 'completed';
    else if (idx === currentIdx) nodeStatus = 'current';
    else nodeStatus = 'pending';

    return {
      id: statusKey,
      label: config.label,
      time: formatTime(ts),
      icon: config.icon,
      status: nodeStatus,
      color: config.color,
      bgColor: config.bgColor,
    };
  });

  // Agregar evento de calificación si existe
  if (order.rating || order.ratedAt) {
    events.push({
      id: 'rated',
      label: `${order.rating}★`,
      time: formatTime(parseTimestamp(order.ratedAt)),
      icon: Star,
      status: order.ratedAt ? 'completed' : 'pending',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100',
    });
  }

  return events;
}

/**
 * Clasifica el tipo de asignación de una orden.
 */
export function classifyAssignment(order: any): { type: AssignmentType; label: string; color: string; bgColor: string } {
  if (!order) return { type: 'unknown', label: 'Desconocido', color: 'text-slate-400', bgColor: 'bg-slate-100' };

  if (order.isRecurringClient || order.lastContractedStore === order.storeId) {
    return { type: 'recurring_client', label: 'Recurrente', color: 'text-purple-600', bgColor: 'bg-purple-100' };
  }

  if (order.counterOfferAccepted || order.acceptedFromOffer) {
    return { type: 'counter_offer', label: 'Contraoferta', color: 'text-amber-600', bgColor: 'bg-amber-100' };
  }

  if (order.autoAssigned) {
    return { type: 'auto_assigned', label: 'Automático', color: 'text-emerald-600', bgColor: 'bg-emerald-100' };
  }

  return { type: 'manual_accepted', label: 'Manual', color: 'text-blue-600', bgColor: 'bg-blue-100' };
}
