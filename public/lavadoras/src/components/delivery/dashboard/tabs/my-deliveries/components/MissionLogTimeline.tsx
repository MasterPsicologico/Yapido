
"use client";

import { format, addHours, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, Clock, MapPin, Star, User, History, Zap, Timer, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineEvent {
  id: string;
  title: string;
  message: string;
  time: string;
  icon: any;
  status: 'past' | 'current' | 'future';
  color: string;
}

interface MissionLogTimelineProps {
  order: any;
}

export function MissionLogTimeline({ order }: MissionLogTimelineProps) {
  const parseTS = (ts: any) => ts?.toDate?.() || (ts?.seconds ? new Date(ts.seconds * 1000) : null);

  const createdAt = parseTS(order.createdAt);
  const acceptedAt = parseTS(order.acceptedAt);
  const deliveredAt = parseTS(order.deliveredAt);
  const completedAt = parseTS(order.completedAt);
  const ratedAt = parseTS(order.ratedAt);

  const events: TimelineEvent[] = [];

  // EVENTO 1: CREACIÓN
  if (createdAt) {
    events.push({
      id: 'creation',
      title: 'Misión Iniciada',
      message: `${order.customerName} solicitó un alquiler de ${order.requestHours} horas en ${order.customerSector || order.cityName || 'la ciudad'}.`,
      time: format(createdAt, "HH:mm", { locale: es }),
      icon: History,
      status: 'past',
      color: 'bg-slate-200'
    });
  }

  // EVENTO 2: ACEPTACIÓN
  if (acceptedAt) {
    events.push({
      id: 'accepted',
      title: 'Trato Cerrado',
      message: `El repartidor ${order.deliveryDriverName || 'Elite'} aceptó el servicio para la tienda ${order.storeName}.`,
      time: format(acceptedAt, "HH:mm", { locale: es }),
      icon: User,
      status: 'past',
      color: 'bg-primary/20 text-primary'
    });
  }

  // EVENTO 3: ENTREGA / INSTALACIÓN
  if (deliveredAt) {
    const expectedExpiry = addHours(deliveredAt, order.requestHours || 5);
    events.push({
      id: 'delivered',
      title: 'Entrega Concreta',
      message: `Lavadora instalada exitosamente en ${order.customerAddress}. Fin de uso programado: ${format(expectedExpiry, "HH:mm")}.`,
      time: format(deliveredAt, "HH:mm", { locale: es }),
      icon: CheckCircle2,
      status: order.status === 'delivered' ? 'current' : 'past',
      color: 'bg-green-500 text-white'
    });
  }

  // EVENTO 4: RECOGIDA / FINALIZACIÓN CON AUDITORÍA DE PÉRDIDAS
  if (completedAt && deliveredAt) {
    const expectedExpiry = addHours(deliveredAt, order.requestHours || 5);
    const diff = differenceInMinutes(completedAt, expectedExpiry);
    
    let pickupStatus = "Recogida puntual";
    let impactMessage = "";

    if (diff > 5) {
      const hoursLost = Math.floor(diff / 60);
      const minsLost = diff % 60;
      
      // Cálculo del valor del tiempo perdido basado en el precio real del contrato
      const hourlyRate = (order.totalPrice || 15000) / (order.requestHours || 5);
      const moneyLost = Math.round((diff / 60) * hourlyRate);
      
      const formattedLost = new Intl.NumberFormat('es-CO', { 
        style: 'currency', currency: 'COP', maximumFractionDigits: 0 
      }).format(moneyLost);

      pickupStatus = `Recogida con desfase (+${diff} min)`;
      impactMessage = ` Se perdieron ${hoursLost > 0 ? `${hoursLost}h ` : ''}${minsLost}min, lo que equivale a ${formattedLost} en dinero potencial no percibido. De ahí la importancia de la optimización de rutas para maximizar la rentabilidad.`;
    }

    events.push({
      id: 'completed',
      title: 'Servicio Finalizado',
      message: `${pickupStatus}.${impactMessage} El equipo fue retirado del domicilio del cliente.`,
      time: format(completedAt, "HH:mm", { locale: es }),
      icon: diff > 5 ? AlertCircle : Zap,
      status: 'past',
      color: diff > 5 ? 'bg-red-100 text-red-600' : 'bg-slate-900 text-primary'
    });
  }

  // EVENTO 5: CALIFICACIÓN
  if (ratedAt && order.rating) {
    events.push({
      id: 'rated',
      title: 'Feedback de Usuario',
      message: `${order.customerName} calificó el servicio con ${order.rating} estrellas. "${order.review || 'Sin comentarios'}"`,
      time: format(ratedAt, "HH:mm", { locale: es }),
      icon: Star,
      status: 'past',
      color: 'bg-yellow-400 text-slate-900'
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
        <Timer className="w-4 h-4 text-primary" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Trazabilidad en Tiempo Real</span>
      </div>

      <div className="relative space-y-8 pl-4">
        {/* LÍNEA DE CONEXIÓN */}
        <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-100" />

        {events.map((event, idx) => {
          const Icon = event.icon;
          return (
            <div key={event.id} className="relative flex gap-6 animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 150}ms` }}>
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 shadow-sm border-4 border-white transition-all duration-700",
                event.color,
                event.status === 'current' && "ring-4 ring-primary/20 scale-110"
              )}>
                <Icon className="w-3 h-3" />
              </div>
              <div className="space-y-1 pt-0.5">
                <div className="flex items-center gap-3">
                  <h4 className="text-xs font-black uppercase italic tracking-tighter text-slate-900 leading-none">
                    {event.title}
                  </h4>
                  <span className="text-[9px] font-bold text-slate-300 font-mono">{event.time}</span>
                </div>
                <p className="text-[11px] font-medium text-slate-500 leading-relaxed max-w-[220px]">
                  {event.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
