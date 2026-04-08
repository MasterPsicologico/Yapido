
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Timer, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Smartphone,
  MessageCircle,
  History,
  Clock,
  Navigation,
  Calendar,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MissionUsageCountdown } from '../active-mission/components/timer/MissionUsageCountdown';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { format, addHours, differenceInSeconds, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

// COMPONENTES FRAGMENTADOS ATÓMICAMENTE
import { MyDeliveriesActions } from './my-deliveries/components/MyDeliveriesActions';
import { PickupNavDetails } from './my-deliveries/components/PickupNavDetails';

interface MyDeliveriesTabProps {
  rentals: any[];
  onUpdateStatus: (status: string, metadata?: any) => void;
}

export function MyDeliveriesTab({ rentals, onUpdateStatus }: MyDeliveriesTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [now, setNow] = useState(new Date());
  const firestore = useFirestore();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const monthDays = useMemo(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    return eachDayOfInterval({ start, end });
  }, []);

  const handleAdjustHours = (orderId: string, extra: number, currentHours: number) => {
    if (!firestore) return;
    
    if (extra < 0 && currentHours <= 1) {
      toast({ title: "Acción Denegada", description: "Mínimo 1 hora de servicio.", variant: "destructive" });
      return;
    }

    const orderRef = doc(firestore, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, {
      requestHours: increment(extra),
      totalPrice: increment(extra * 3500),
      updatedAt: serverTimestamp()
    });
    
    toast({ 
      title: extra > 0 ? "+1 Hora Añadida" : "-1 Hora Removida",
      className: extra > 0 ? "bg-green-600 text-white" : "bg-red-600 text-white"
    });
  };

  const filteredRentals = useMemo(() => {
    return rentals.filter(order => {
      const orderDate = order.createdAt?.toDate?.() || (order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000) : null);
      if (!orderDate) return false;
      return isSameDay(orderDate, selectedDate);
    });
  }, [rentals, selectedDate]);

  const activeCount = filteredRentals.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length;

  const handleFinalizePickUp = (orderId: string) => {
    onUpdateStatus('completed', { id: orderId });
    setExpandedId(null);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <section className="space-y-4">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Selector de Jornada</h3>
          </div>
          <Badge className="bg-slate-900 text-white border-none font-black text-[8px] px-3 uppercase tracking-widest">
            {format(selectedDate, "MMMM", { locale: es })}
          </Badge>
        </div>

        <ScrollArea className="w-full whitespace-nowrap pb-4">
          <div className="flex gap-3 px-4">
            {monthDays.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDay = isSameDay(day, new Date());
              return (
                <button
                  key={day.toString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[60px] h-20 rounded-[24px] transition-all duration-500 border-2",
                    isSelected 
                      ? "bg-slate-900 border-primary text-white shadow-2xl scale-110 z-10" 
                      : "bg-white border-slate-100 text-slate-400 hover:border-primary/20 shadow-sm"
                  )}
                >
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-widest mb-1",
                    isSelected ? "text-primary" : "text-slate-300"
                  )}>
                    {format(day, "eee", { locale: es })}
                  </span>
                  <span className="text-xl font-black italic tracking-tighter leading-none">
                    {format(day, "d")}
                  </span>
                  {isTodayDay && !isSelected && (
                    <div className="w-1 h-1 rounded-full bg-primary mt-1 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" className="hidden" />
        </ScrollArea>
      </section>

      <div className="grid gap-4">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">
            Control de Campo <span className="text-slate-400 ml-1">/ {format(selectedDate, "dd MMM", { locale: es })}</span>
          </h3>
          <Badge className="bg-secondary text-white border-none font-black text-[8px] px-3">
            {activeCount} ACTIVOS
          </Badge>
        </div>

        {filteredRentals.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[48px] border-2 border-dashed border-slate-100">
            <History className="w-16 h-16 mx-auto text-slate-100 mb-4" />
            <h3 className="text-2xl font-black text-slate-300 uppercase italic tracking-tighter">Sin Operaciones</h3>
            <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest mt-2 px-10">
              No hay registros para la fecha seleccionada.
            </p>
          </div>
        ) : (
          filteredRentals.map((order) => {
            const isExpanded = expandedId === order.id;
            const isCompleted = order.status === 'completed';
            
            const deliveredAt = order.deliveredAt?.toDate?.() || (order.deliveredAt?.seconds ? new Date(order.deliveredAt.seconds * 1000) : null);
            const durationHours = order.requestHours || 5;
            const expiryTime = deliveredAt ? addHours(deliveredAt, durationHours) : null;
            
            const remaining = expiryTime ? differenceInSeconds(expiryTime, now) : 0;
            const isExpired = remaining < 0 && !isCompleted;
            const absRemaining = Math.abs(remaining);

            const timeIn = deliveredAt ? format(deliveredAt, "HH:mm") : "--:--";
            const timeOut = expiryTime ? format(expiryTime, "HH:mm") : "--:--";

            return (
              <Card key={order.id} className={cn(
                "border-none rounded-[32px] overflow-hidden transition-all duration-500 ring-2",
                "bg-slate-900 shadow-xl", // FONDO AZUL OSCURO MAESTRO REESTABLECIDO
                isExpanded ? "ring-primary/40" : "ring-white/5",
                isExpired && "animate-pulse-red-glow ring-red-500/50",
                isCompleted && "ring-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.4)]"
              )}>
                <CardContent className="p-0">
                  <div 
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    className="p-6 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-inner",
                        isExpanded ? "bg-primary text-white" : 
                        isCompleted ? "bg-green-500 text-white shadow-green-200 shadow-xl" :
                        isExpired ? "bg-red-500 text-white" : "bg-white/10 text-slate-400"
                      )}>
                        {isCompleted ? <CheckCircle2 className="w-6 h-6 animate-in zoom-in" /> : <Timer className={cn("w-6 h-6", isExpired && "animate-bounce")} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-lg font-black uppercase italic tracking-tighter leading-none truncate text-white">
                          {order.customerName}
                        </h4>
                        <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                              Inicio: {timeIn}
                            </span>
                          </div>
                          {!isCompleted && (
                            <>
                              <div className="w-[1px] h-2 bg-white/10 shrink-0" />
                              <div className="flex items-center gap-1.5 shrink-0">
                                <Navigation className={cn("w-3 h-3", isExpired ? "text-red-500" : "text-slate-500")} />
                                <span className={cn("text-[9px] font-black uppercase tracking-widest", isExpired ? "text-red-500 animate-pulse" : "text-slate-400")}>
                                  Fin: {timeOut}
                                </span>
                              </div>
                            </>
                          )}
                          {isCompleted && (
                            <Badge className="bg-green-500 text-white border-none text-[7px] font-black uppercase px-2 h-4">ENTREGA FINALIZADA</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="text-slate-500 shrink-0 ml-2" /> : <ChevronDown className="text-slate-500 shrink-0 ml-2" />}
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-8 space-y-8 animate-in slide-in-from-top-2 duration-300">
                      <div className="h-px bg-white/5 mx-2" />
                      
                      {!isCompleted && (
                        <div className="scale-95 origin-top">
                          <MissionUsageCountdown 
                            progress={{
                              hours: Math.floor(absRemaining / 3600),
                              minutes: Math.floor((absRemaining % 3600) / 60),
                              seconds: absRemaining % 60,
                              percentage: expiryTime ? Math.min(100, (1 - (remaining / (durationHours * 3600))) * 100) : 0,
                              expiryLabel: timeOut,
                              isExpired,
                              dropOffTime: timeIn
                            }}
                            onAddHours={() => handleAdjustHours(order.id, 1, order.requestHours)}
                            onRemoveHour={() => handleAdjustHours(order.id, -1, order.requestHours)}
                          />
                        </div>
                      )}

                      <div className="bg-white/5 p-5 rounded-3xl border border-white/5 space-y-3 shadow-inner">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="text-xs font-bold text-slate-300">{order.customerAddress}</span>
                        </div>
                        {isCompleted && (
                          <div className="flex items-center gap-3 pt-2 border-t border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            <Zap className="w-3.5 h-3.5 text-primary" /> Valor Final: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(order.totalPrice || 0)}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" onClick={() => window.open(`tel:${order.customerPhone}`)} className="h-14 rounded-2xl border-white/10 bg-white/5 text-white font-black uppercase text-[10px] tracking-widest gap-2 active:scale-95 transition-all">
                          <Smartphone className="w-4 h-4 text-primary" /> LLAMAR
                        </Button>
                        <Button variant="outline" onClick={() => window.open(`https://wa.me/57${order.customerPhone.replace(/\D/g, '')}`)} className="h-14 rounded-2xl border-white/10 bg-white/5 text-white font-black uppercase text-[10px] tracking-widest gap-2 active:scale-95 transition-all">
                          <MessageCircle className="w-4 h-4 text-green-500" /> CHAT
                        </Button>
                      </div>

                      {!isCompleted && (
                        <div className="space-y-4">
                          <MyDeliveriesActions 
                            orderId={order.id}
                            status={order.status}
                            onUpdateStatus={onUpdateStatus}
                            onFinalize={handleFinalizePickUp}
                          />
                          
                          <PickupNavDetails 
                            status={order.status}
                            customerAddress={order.customerAddress}
                            customerSector={order.customerSector}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
