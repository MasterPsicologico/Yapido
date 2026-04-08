"use client";

import { useState, useEffect } from 'react';
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
  Navigation
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MissionUsageCountdown } from '../active-mission/components/timer/MissionUsageCountdown';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { format, addHours, differenceInSeconds } from 'date-fns';

interface MyDeliveriesTabProps {
  rentals: any[];
  onUpdateStatus: (status: string, metadata?: any) => void;
}

export function MyDeliveriesTab({ rentals, onUpdateStatus }: MyDeliveriesTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const firestore = useFirestore();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
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

  if (rentals.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-[48px] border-2 border-dashed border-slate-100 animate-in fade-in duration-500">
        <History className="w-16 h-16 mx-auto text-slate-100 mb-4" />
        <h3 className="text-2xl font-black text-slate-300 uppercase italic tracking-tighter">Sin Alquileres Activos</h3>
        <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest mt-2 px-10">
          Los equipos instalados aparecerán aquí para control de tiempo real.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between px-4 mb-2">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 italic">Control en Segundo Plano</h3>
        <Badge className="bg-secondary text-white border-none font-black text-[8px] px-3">{rentals.length} ACTIVOS</Badge>
      </div>

      {rentals.map((order) => {
        const isExpanded = expandedId === order.id;
        
        const deliveredAt = order.deliveredAt?.toDate?.() || (order.deliveredAt?.seconds ? new Date(order.deliveredAt.seconds * 1000) : null);
        const durationHours = order.requestHours || 5;
        const expiryTime = deliveredAt ? addHours(deliveredAt, durationHours) : null;
        const remaining = expiryTime ? Math.max(0, differenceInSeconds(expiryTime, now)) : 0;
        const isExpired = expiryTime ? remaining <= 0 : false;

        const timeIn = deliveredAt ? format(deliveredAt, "HH:mm") : "--:--";
        const timeOut = expiryTime ? format(expiryTime, "HH:mm") : "--:--";

        return (
          <Card key={order.id} className={cn(
            "border-none rounded-[32px] overflow-hidden transition-all duration-500 ring-2",
            isExpanded ? "shadow-2xl bg-slate-900 ring-primary/20" : "shadow-sm bg-white ring-black/[0.02]",
            isExpired && "animate-pulse-red-glow ring-red-500/50"
          )}>
            <CardContent className="p-0">
              <div 
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
                className="p-6 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                    isExpanded ? "bg-primary text-white" : isExpired ? "bg-red-500 text-white" : "bg-slate-50 text-slate-400"
                  )}>
                    <Timer className={cn("w-6 h-6", isExpired && "animate-bounce")} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className={cn("text-lg font-black uppercase italic tracking-tighter leading-none truncate", isExpanded ? "text-white" : "text-slate-900")}>
                      {order.customerName}
                    </h4>
                    <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className={cn("text-[9px] font-black uppercase tracking-widest", isExpanded ? "text-slate-400" : "text-slate-500")}>
                          Llevado: {timeIn}
                        </span>
                      </div>
                      <div className="w-[1px] h-2 bg-slate-200 shrink-0" />
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Navigation className={cn("w-3 h-3", isExpired ? "text-red-500" : "text-slate-400")} />
                        <span className={cn("text-[9px] font-black uppercase tracking-widest", isExpired ? "text-red-600 animate-pulse" : isExpanded ? "text-slate-400" : "text-slate-500")}>
                          Recoger: {timeOut}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="text-slate-500 shrink-0 ml-2" /> : <ChevronDown className="text-slate-300 shrink-0 ml-2" />}
              </div>

              {isExpanded && (
                <div className="px-6 pb-8 space-y-8 animate-in slide-in-from-top-2 duration-300">
                  <div className="h-px bg-white/5 mx-2" />
                  
                  <div className="scale-95 origin-top">
                    <MissionUsageCountdown 
                      progress={{
                        hours: Math.floor(remaining / 3600),
                        minutes: Math.floor((remaining % 3600) / 60),
                        seconds: remaining % 60,
                        percentage: expiryTime ? Math.min(100, (1 - (remaining / (durationHours * 3600))) * 100) : 0,
                        expiryLabel: timeOut,
                        isExpired,
                        dropOffTime: timeIn
                      }}
                      onAddHours={() => handleAdjustHours(order.id, 1, order.requestHours)}
                      onRemoveHour={() => handleAdjustHours(order.id, -1, order.requestHours)}
                    />
                  </div>

                  <div className="bg-white/5 p-5 rounded-3xl border border-white/5 space-y-3">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-slate-300">{order.customerAddress}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={() => window.open(`tel:${order.customerPhone}`)} className="h-14 rounded-2xl border-white/10 bg-white/5 text-white font-black uppercase text-[10px] tracking-widest gap-2">
                      <Smartphone className="w-4 h-4 text-primary" /> LLAMAR
                    </Button>
                    <Button variant="outline" onClick={() => window.open(`https://wa.me/57${order.customerPhone.replace(/\D/g, '')}`)} className="h-14 rounded-2xl border-white/10 bg-white/5 text-white font-black uppercase text-[10px] tracking-widest gap-2">
                      <MessageCircle className="w-4 h-4 text-green-500" /> CHAT
                    </Button>
                  </div>

                  <div className="pt-2">
                    {order.status === 'delivered' ? (
                      <Button 
                        onClick={() => onUpdateStatus('picking_up', { id: order.id })}
                        className="w-full h-16 rounded-[24px] bg-slate-100 text-slate-900 font-black uppercase text-xs tracking-widest gap-3 shadow-xl hover:bg-white active:scale-95 transition-all"
                      >
                        <Navigation className="w-5 h-5 text-primary" /> IR A RECOGER LAVADORA
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => onUpdateStatus('completed', { id: order.id })}
                        className="w-full h-20 rounded-[24px] bg-green-600 text-white font-black uppercase text-xs tracking-widest gap-3 shadow-[0_15px_40px_rgba(34,197,94,0.4)] border-b-[8px] border-green-800 active:border-b-0 active:translate-y-2 transition-all"
                      >
                        <CheckCircle2 className="w-6 h-6 animate-bounce" /> RECOGÍ LA LAVADORA
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}