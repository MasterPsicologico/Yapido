
"use client";

import { WasherRouteCard } from './WasherRouteCard';
import { Button } from '@/components/ui/button';
import { Lock, Loader2 } from 'lucide-react';

interface RoutesTabProps {
  isOnline: boolean;
  orders: any[];
  onAccept: (id: string) => void;
  onGoOnline: () => void;
}

export function RoutesTab({ isOnline, orders, onAccept, onGoOnline }: RoutesTabProps) {
  if (!isOnline) {
    return (
      <div className="text-center py-24 bg-slate-50 rounded-[48px] border-2 border-dashed space-y-6 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-white rounded-[32px] shadow-xl flex items-center justify-center mx-auto ring-4 ring-slate-100">
          <Lock className="w-10 h-10 text-slate-200" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-slate-400 uppercase italic tracking-tighter">Modo Desconectado</h3>
          <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest max-w-[200px] mx-auto">Activa tu turno para recibir misiones de la Ciudadela AI.</p>
        </div>
        <Button onClick={onGoOnline} className="rounded-full bg-green-500 h-16 shadow-2xl px-10 font-black uppercase text-xs tracking-widest gap-2 hover:scale-105 active:scale-95 transition-all">Iniciar Turno Ahora</Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-32 space-y-6">
        <div className="relative w-16 h-16 mx-auto">
          <Loader2 className="w-16 h-16 animate-spin text-primary/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
          </div>
        </div>
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic">Radar de Rutas Activo...</p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 animate-in slide-in-from-bottom-4 duration-700">
      {orders.map(order => (
        <WasherRouteCard 
          key={order.id} 
          order={order} 
          onAccept={() => onAccept(order.id)} 
        />
      ))}
    </div>
  );
}
