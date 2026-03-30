
"use client";

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Store as StoreIcon, ArrowRight, Lock } from 'lucide-react';

interface RoutesTabProps {
  isOnline: boolean;
  orders: any[];
  onAccept: (id: string) => void;
  onGoOnline: () => void;
}

export function RoutesTab({ isOnline, orders, onAccept, onGoOnline }: RoutesTabProps) {
  if (!isOnline) {
    return (
      <div className="text-center py-20 bg-slate-50 rounded-[48px] border-2 border-dashed space-y-4">
        <Lock className="w-16 h-16 mx-auto text-slate-200" />
        <h3 className="text-xl font-black text-slate-400 uppercase italic">Modo Desconectado</h3>
        <Button onClick={onGoOnline} className="rounded-full bg-green-500 h-12 shadow-lg px-8 font-black">Iniciar Turno Ahora</Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return <div className="text-center py-20 text-slate-300 font-black uppercase italic tracking-widest">Esperando nuevas rutas...</div>;
  }

  return (
    <div className="grid gap-4">
      {orders.map(order => (
        <Card key={order.id} className="border-none rounded-[32px] shadow-sm bg-white p-6 flex flex-col sm:flex-row items-center justify-between gap-6 hover:shadow-xl transition-all ring-1 ring-black/[0.03]">
          <div className="space-y-2 flex-1 text-center sm:text-left">
            <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase">DISPONIBLE</Badge>
            <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">{order.productName}</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase flex items-center justify-center sm:justify-start gap-2"><StoreIcon className="w-3 h-3" /> {order.storeName}</p>
          </div>
          <Button onClick={() => onAccept(order.id)} className="w-full sm:w-auto rounded-full h-16 px-10 bg-primary text-white font-black uppercase text-xs tracking-widest gap-3 shadow-2xl shadow-primary/20 transition-transform active:scale-95">ACEPTAR RUTA <ArrowRight className="w-5 h-5" /></Button>
        </Card>
      ))}
    </div>
  );
}
