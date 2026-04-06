
"use client";

import { useState } from 'react';
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
  Plus,
  History
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
  const firestore = useFirestore();

  if (rentals.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-[48px] border-2 border-dashed border-slate-100 animate-in fade-in duration-500">
        <History className="w-16 h-16 mx-auto text-slate-100 mb-4" />
        <h3 className="text-2xl font-black text-slate-300 uppercase italic tracking-tighter">Sin Alquileres Activos</h3>
        <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest mt-2 px-10">Gestiona tus equipos instalados desde aquí cuando el tiempo empiece a correr.</p>
      </div>
    );
  }

  const handleAddHours = (orderId: string, extra: number) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, {
      requestHours: increment(extra),
      totalPrice: increment(extra * 3500),
      updatedAt: serverTimestamp()
    });
    toast({ title: `+${extra}h Añadidas` });
  };

  return (
    <div className="grid gap-4 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between px-4 mb-2">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 italic">Control de Flota en Calle</h3>
        <Badge className="bg-secondary text-white border-none font-black text-[8px] px-3">{rentals.length} EQUIPOS</Badge>
      </div>

      {rentals.map((order) => {
        const isExpanded = expandedId === order.id;
        
        // Lógica de progreso simplificada para el item de la lista
        const deliveredAt = order.deliveredAt?.toDate?.() || new Date(order.deliveredAt.seconds * 1000);
        const expiryTime = addHours(deliveredAt, order.requestHours || 5);
        const remaining = Math.max(0, differenceInSeconds(expiryTime, new Date()));
        const isExpired = remaining <= 0;

        return (
          <Card key={order.id} className={cn(
            "border-none rounded-[32px] overflow-hidden transition-all duration-500 ring-1",
            isExpanded ? "shadow-2xl bg-slate-900 ring-primary/20 scale-[1.02]" : "shadow-sm bg-white ring-black/[0.02]"
          )}>
            <CardContent className="p-0">
              {/* CABECERA RESUMIDA */}
              <div 
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
                className="p-6 flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                    isExpanded ? "bg-primary text-white" : "bg-slate-50 text-slate-400"
                  )}>
                    <Timer className={cn("w-6 h-6", isExpired && !isExpanded && "text-red-500 animate-pulse")} />
                  </div>
                  <div>
                    <h4 className={cn("text-lg font-black uppercase italic tracking-tighter leading-none", isExpanded ? "text-white" : "text-slate-900")}>
                      {order.customerName}
                    </h4>
                    <p className={cn("text-[9px] font-bold uppercase tracking-widest mt-1", isExpanded ? "text-slate-400" : "text-slate-400")}>
                      {order.customerAddress.slice(0, 30)}...
                    </p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="text-slate-500" /> : <ChevronDown className="text-slate-300" />}
              </div>

              {/* DETALLES EXPANDIDOS */}
              {isExpanded && (
                <div className="px-6 pb-8 space-y-8 animate-in slide-in-from-top-2 duration-300">
                  <div className="h-px bg-white/5 mx-2" />
                  
                  {/* Cronómetro Atómico Reutilizado */}
                  <div className="scale-90 origin-top">
                    <MissionUsageCountdown 
                      progress={{
                        hours: Math.floor(remaining / 3600),
                        minutes: Math.floor((remaining % 3600) / 60),
                        seconds: remaining % 60,
                        percentage: Math.min(100, (1 - (remaining / ((order.requestHours || 5) * 3600))) * 100),
                        expiryLabel: format(expiryTime, 'HH:mm'),
                        isExpired
                      }}
                      onAddHours={(h) => handleAddHours(order.id, h)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(`tel:${order.customerPhone}`)}
                      className="h-14 rounded-2xl border-white/10 bg-white/5 text-white font-black uppercase text-[10px] tracking-widest gap-2"
                    >
                      <Smartphone className="w-4 h-4 text-primary" /> LLAMAR
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(`https://wa.me/57${order.customerPhone.replace(/\D/g, '')}`)}
                      className="h-14 rounded-2xl border-white/10 bg-white/5 text-white font-black uppercase text-[10px] tracking-widest gap-2"
                    >
                      <MessageCircle className="w-4 h-4 text-green-500" /> CHAT
                    </Button>
                  </div>

                  <Button 
                    onClick={() => onUpdateStatus('completed', { id: order.id })}
                    className="w-full h-16 rounded-[24px] bg-green-600 text-white font-black uppercase text-xs tracking-widest gap-3 shadow-xl active:scale-95 transition-all border-b-4 border-green-800"
                  >
                    <CheckCircle2 className="w-5 h-5" /> RECOGER Y FINALIZAR
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
