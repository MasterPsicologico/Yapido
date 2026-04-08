
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Timer, 
  MapPin, 
  ChevronDown, 
  CheckCircle2, 
  Smartphone,
  History,
  Clock,
  Calendar,
  Zap,
  MessageSquareText,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MissionUsageCountdown } from '../active-mission/components/timer/MissionUsageCountdown';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { format, addHours, differenceInSeconds, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { OrderChat } from '@/components/chat/OrderChat';

// COMPONENTES FRAGMENTADOS ATÓMICAMENTE
import { MyDeliveriesActions } from './my-deliveries/components/MyDeliveriesActions';
import { PickupNavDetails } from './my-deliveries/components/PickupNavDetails';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.131.57-.074 1.758-.706 2.006-1.388.248-.683.248-1.265.173-1.388-.075-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .01 5.393 0 12.03c0 2.123.54 4.197 1.57 6.05L0 24l6.15-1.612a11.81 11.81 0 005.89 1.568h.005c6.634 0 12.04-5.39 12.043-12.03a11.82 11.82 0 00-3.48-8.513z"/>
  </svg>
);

interface MyDeliveriesTabProps {
  rentals: any[];
  onUpdateStatus: (status: string, metadata?: any) => void;
}

export function MyDeliveriesTab({ rentals, onUpdateStatus }: MyDeliveriesTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [now, setNow] = useState(new Date());
  const [internalChatOrder, setInternalChatOrder] = useState<any | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (expandedId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [expandedId]);

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
    toast({ title: extra > 0 ? "+1 Hora Añadida" : "-1 Hora Removida", className: extra > 0 ? "bg-green-600 text-white" : "bg-red-600 text-white" });
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
                    isSelected ? "bg-slate-900 border-primary text-white shadow-2xl scale-110 z-10" : "bg-white border-slate-100 text-slate-400 hover:border-primary/20 shadow-sm"
                  )}
                >
                  <span className={cn("text-[8px] font-black uppercase tracking-widest mb-1", isSelected ? "text-primary" : "text-slate-300")}>{format(day, "eee", { locale: es })}</span>
                  <span className="text-xl font-black italic tracking-tighter leading-none">{format(day, "d")}</span>
                  {isTodayDay && !isSelected && <div className="w-1 h-1 rounded-full bg-primary mt-1 animate-pulse" />}
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" className="hidden" />
        </ScrollArea>
      </section>

      <div className="grid gap-4">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">Control de Campo <span className="text-slate-400 ml-1">/ {format(selectedDate, "dd MMM", { locale: es })}</span></h3>
          <Badge className="bg-secondary text-white border-none font-black text-[8px] px-3">{activeCount} ACTIVOS</Badge>
        </div>

        {filteredRentals.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[48px] border-2 border-dashed border-slate-100">
            <History className="w-16 h-16 mx-auto text-slate-100 mb-4" /><h3 className="text-2xl font-black text-slate-300 uppercase italic tracking-tighter">Sin Operaciones</h3><p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest mt-2 px-10">No hay registros para la fecha seleccionada.</p>
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
              <div key={order.id}>
                {/* VISTA COMPACTA DE LISTA - FONDO BLANCO */}
                <Card 
                  onClick={() => setExpandedId(order.id)}
                  className={cn(
                    "border-none rounded-[32px] overflow-hidden transition-all duration-500 ring-2 cursor-pointer",
                    "bg-white shadow-xl", 
                    isExpired && "animate-pulse-red-glow ring-red-500/50",
                    isCompleted && "ring-green-500/50"
                  )}
                >
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-inner",
                        isCompleted ? "bg-green-500 text-white" : isExpired ? "bg-red-500 text-white" : "bg-slate-50 text-slate-400"
                      )}>
                        {isCompleted ? <CheckCircle2 className="w-6 h-6 animate-in zoom-in" /> : <Timer className={cn("w-6 h-6", isExpired && "animate-bounce")} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-lg font-black uppercase italic tracking-tighter leading-none truncate text-slate-900">{order.customerName}</h4>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Clock className="w-3 h-3 text-slate-300" /><span className="text-[9px] font-black uppercase text-slate-400">Inicio: {timeIn}</span>
                          {isCompleted && <Badge className="bg-green-500 text-white border-none text-[8px] font-black uppercase px-2 h-5 ml-2">FINALIZADO</Badge>}
                        </div>
                      </div>
                    </div>
                    <ChevronDown className="text-slate-300" />
                  </CardContent>
                </Card>

                {/* VISTA TERMINAL PANTALLA COMPLETA - FONDO BLANCO */}
                {isExpanded && (
                  <div className="fixed inset-0 z-[600] bg-white flex flex-col animate-in fade-in zoom-in duration-300">
                    {/* Header de la Terminal */}
                    <div className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 shadow-sm relative z-10">
                       <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                            isCompleted ? "bg-green-500 text-white" : isExpired ? "bg-red-500 text-white" : "bg-primary text-white"
                          )}>
                            {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Timer className="w-6 h-6" />}
                          </div>
                          <div>
                            <h4 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 leading-none truncate max-w-[180px]">{order.customerName}</h4>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Terminal de Mando</p>
                          </div>
                       </div>
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         onClick={() => setExpandedId(null)}
                         className="h-12 w-12 rounded-full bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm active:scale-90"
                       >
                         <X className="w-6 h-6 stroke-[3]" />
                       </Button>
                    </div>

                    {/* Cuerpo de la Terminal con Scroll */}
                    <ScrollArea className="flex-1 w-full bg-[#f8fafc]">
                      <div className="p-6 pb-32 space-y-10 max-w-2xl mx-auto">
                        <div className="h-1 w-12 bg-slate-200 rounded-full mx-auto" />
                        
                        {!isCompleted && (
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
                        )}

                        <div className="bg-white p-8 rounded-[40px] border border-slate-100 space-y-4 shadow-xl">
                          <div className="flex items-start gap-4">
                            <MapPin className="w-6 h-6 text-primary shrink-0 mt-1" />
                            <span className="text-lg font-black uppercase italic text-slate-900 tracking-tight leading-snug">{order.customerAddress}</span>
                          </div>
                          {isCompleted && (
                            <div className="flex items-center gap-3 pt-4 border-t border-slate-50 text-xs font-black text-slate-400 uppercase tracking-widest">
                              <Zap className="w-4 h-4 text-primary" /> Valor Final: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(order.totalPrice || 0)}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <Button 
                            onClick={() => window.open(`https://wa.me/57${order.customerPhone.replace(/\D/g, '')}`)}
                            className="h-16 rounded-[24px] bg-gradient-to-br from-[#fef08a] via-[#eab308] to-[#a16207] text-slate-950 font-black uppercase text-xs tracking-widest gap-3 shadow-xl border-b-4 border-[#854d0e] active:border-b-0 active:translate-y-1 transition-all"
                          >
                            <WhatsAppIcon className="w-5 h-5" /> WHATSAPP
                          </Button>
                          <Button 
                            onClick={() => setInternalChatOrder(order)}
                            className="h-16 rounded-[24px] bg-primary text-white font-black uppercase text-xs tracking-widest gap-3 shadow-xl active:scale-95 transition-all"
                          >
                            <MessageSquareText className="w-5 h-5" /> CHAT INTERNO
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => window.open(`tel:${order.customerPhone}`)}
                            className="h-16 rounded-[24px] border-slate-200 bg-white text-slate-600 font-black uppercase text-xs tracking-widest gap-3 active:scale-95 transition-all shadow-sm"
                          >
                            <Smartphone className="w-5 h-5 text-slate-400" /> LLAMAR
                          </Button>
                        </div>

                        {!isCompleted && (
                          <div className="space-y-6">
                            <MyDeliveriesActions orderId={order.id} status={order.status} onUpdateStatus={onUpdateStatus} onFinalize={handleFinalizePickUp} />
                            <PickupNavDetails status={order.status} customerAddress={order.customerAddress} customerSector={order.customerSector} />
                          </div>
                        )}
                        
                        <div className="flex flex-col items-center gap-3 pt-10 opacity-40">
                          <Zap className="w-6 h-6 text-primary animate-pulse" />
                          <p className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-400">Vitriniando AI Central • Kernel v1.0.4</p>
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Dialog open={!!internalChatOrder} onOpenChange={v => !v && setInternalChatOrder(null)}>
        <DialogContent className="p-0 border-none bg-white shadow-none max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 sm:p-4 md:p-8 flex flex-col z-[700] [&>button:last-child]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Canal Seguro</DialogTitle>
            <DialogDescription>Comunicación directa y protegida.</DialogDescription>
          </DialogHeader>
          {internalChatOrder && (
            <div className="flex-1 min-h-0 w-full animate-in zoom-in duration-300">
              <OrderChat orderId={internalChatOrder.id} orderData={internalChatOrder} onClose={() => setInternalChatOrder(null)} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
