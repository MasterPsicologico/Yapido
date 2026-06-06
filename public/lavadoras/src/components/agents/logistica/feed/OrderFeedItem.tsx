
"use client";

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Clock, Star } from 'lucide-react';
import { HorizontalTimeline } from '../timeline/HorizontalTimeline';
import { OrderClassifier } from '../classification/OrderClassifier';
import { cn } from '@/lib/utils';

interface OrderFeedItemProps {
  order: any;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:            { label: 'PENDIENTE',      color: 'text-orange-600', bg: 'bg-orange-50' },
  ready_for_pickup:   { label: 'ASIGNADO',       color: 'text-indigo-600', bg: 'bg-indigo-50' },
  at_store:           { label: 'EN TIENDA',      color: 'text-amber-600',  bg: 'bg-amber-50' },
  delivered_to_driver:{ label: 'CON REPARTIDOR',  color: 'text-purple-600', bg: 'bg-purple-50' },
  shipped:            { label: 'EN CAMINO',      color: 'text-blue-600',   bg: 'bg-blue-50' },
  at_destination:     { label: 'EN DESTINO',     color: 'text-cyan-600',   bg: 'bg-cyan-50' },
  delivered:          { label: 'ENTREGADO',      color: 'text-emerald-600',bg: 'bg-emerald-50' },
  completed:          { label: 'FINALIZADO',     color: 'text-slate-600',  bg: 'bg-slate-100' },
  cancelled:          { label: 'CANCELADO',      color: 'text-red-600',    bg: 'bg-red-50' },
};

export function OrderFeedItem({ order }: OrderFeedItemProps) {
  const statusConfig = STATUS_LABELS[order.status] || STATUS_LABELS.pending;

  const createdTime = useMemo(() => {
    const ts = order.createdAt;
    if (!ts) return '';
    const date = ts.toDate?.() || (ts.seconds ? new Date(ts.seconds * 1000) : null);
    if (!date) return '';
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false });
  }, [order.createdAt]);

  const orderCode = order.id?.slice(-6)?.toUpperCase() || '------';

  return (
    <div className="bg-white rounded-[28px] shadow-sm ring-1 ring-black/[0.03] overflow-hidden hover:shadow-md transition-shadow duration-300">
      {/* Header tipo WhatsApp */}
      <div className="flex items-center gap-4 p-4 pb-2">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-slate-400" />
        </div>

        {/* Info principal */}
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-900 truncate italic">
              {order.customerName || 'Cliente'}
            </span>
            <span className="text-[8px] font-bold text-slate-300 font-mono shrink-0">
              #{orderCode}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn(
              "text-[7px] font-black uppercase px-2 h-4 border-none tracking-widest",
              statusConfig.bg, statusConfig.color
            )}>
              {statusConfig.label}
            </Badge>
            <OrderClassifier order={order} />
          </div>
        </div>

        {/* Hora */}
        <div className="flex flex-col items-end shrink-0">
          <span className="text-[9px] font-bold text-slate-400 font-mono">{createdTime}</span>
          {order.storeName && (
            <span className="text-[8px] font-bold text-slate-300 uppercase tracking-wider truncate max-w-[80px]">
              {order.storeName}
            </span>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-3 px-4 pb-2">
        {order.customerAddress && (
          <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 truncate">
            <MapPin className="w-3 h-3 shrink-0" />
            {order.customerAddress}
          </span>
        )}
        {order.requestHours && (
          <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 shrink-0">
            <Clock className="w-3 h-3" />
            {order.requestHours}h
          </span>
        )}
        {order.totalPrice && (
          <span className="text-[9px] font-black text-primary shrink-0">
            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(order.totalPrice)}
          </span>
        )}
        {order.rating && (
          <span className="flex items-center gap-0.5 text-[9px] font-black text-yellow-500 shrink-0">
            <Star className="w-3 h-3 fill-yellow-400" />
            {order.rating}
          </span>
        )}
      </div>

      {/* Timeline horizontal — siempre visible */}
      <div className="border-t border-slate-50 px-2">
        <HorizontalTimeline order={order} />
      </div>
    </div>
  );
}
