
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Timer, User, MapPin, Clock, Phone, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addHours, differenceInSeconds } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEffect, useState } from 'react';

interface WasherActiveRentalsProps {
  rentals: any[] | null;
}

export function WasherActiveRentals({ rentals }: WasherActiveRentalsProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getRemainingTime = (order: any) => {
    if (order.status !== 'delivered' || !order.deliveredAt) return null;
    const deliveredAt = order.deliveredAt?.toDate?.() || new Date(order.deliveredAt.seconds * 1000);
    const expiry = addHours(deliveredAt, order.requestHours || 5);
    const diff = differenceInSeconds(expiry, now);
    if (diff <= 0) return { label: "EXPIRADO", isExpired: true };
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    return { label: `${h}h ${m}m`, isExpired: false };
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between px-4">
        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Alquileres Vivos</h3>
        <Badge className="bg-primary text-white font-black text-[9px] px-3">{rentals?.length || 0} EN CURSO</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rentals && rentals.length > 0 ? rentals.map((order) => {
          const timer = getRemainingTime(order);
          return (
            <Card key={order.id} className={cn(
              "border-none rounded-[40px] bg-white shadow-xl overflow-hidden ring-1 ring-black/[0.03] transition-all",
              timer?.isExpired && "ring-4 ring-red-500/20"
            )}>
              <div className={cn(
                "h-2 w-full",
                order.status === 'delivered' ? (timer?.isExpired ? "bg-red-500" : "bg-green-500") : "bg-blue-500"
              )} />
              <CardContent className="p-8 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Protocolo #{order.id.slice(-6).toUpperCase()}</p>
                    <h4 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">{order.customerName}</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Estado</p>
                    <Badge className={cn(
                      "font-black text-[8px] uppercase",
                      order.status === 'delivered' ? (timer?.isExpired ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600") : "bg-blue-100 text-blue-600"
                    )}>
                      {order.status === 'delivered' ? (timer?.isExpired ? "RECOGER" : "EN USO") : "EN CAMINO"}
                    </Badge>
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-[28px] space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-slate-600 truncate">{order.customerAddress}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                    <div className="flex items-center gap-2">
                      <Timer className={cn("w-4 h-4", timer?.isExpired ? "text-red-500 animate-pulse" : "text-slate-400")} />
                      <span className={cn("text-lg font-black italic", timer?.isExpired ? "text-red-600" : "text-slate-900")}>
                        {timer?.label || "SIN INICIAR"}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-[7px] font-black text-slate-400 uppercase">Valor Acumulado</p>
                      <p className="text-sm font-black text-primary">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(order.totalPrice || 0)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => window.open(`tel:${order.customerPhone}`)} className="flex-1 h-12 rounded-2xl border-slate-100"><Phone className="w-4 h-4 text-slate-400" /></Button>
                  <Button onClick={() => window.open(`https://wa.me/57${order.customerPhone?.replace(/\D/g, '')}`)} className="flex-[3] h-12 rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest gap-2">CONTACTAR</Button>
                </div>
              </CardContent>
            </Card>
          );
        }) : (
          <div className="md:col-span-2 text-center py-20 bg-white rounded-[48px] border-2 border-dashed border-slate-100">
            <Clock className="w-12 h-12 mx-auto text-slate-100 mb-4" />
            <p className="text-slate-300 font-black uppercase tracking-widest italic text-xs">No hay alquileres en curso en este momento</p>
          </div>
        )}
      </div>
    </div>
  );
}
