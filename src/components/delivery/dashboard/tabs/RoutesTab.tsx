
"use client";

import { WasherRouteCard } from './WasherRouteCard';
import { Button } from '@/components/ui/button';
import { Lock, Loader2, Trash2, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { FleetManagementCard } from '@/components/delivery/fleet/FleetManagementCard';

interface RoutesTabProps {
  isOnline: boolean;
  orders: any[];
  hasRecycled?: boolean;
  onAccept: (id: string) => void;
  onGoOnline: () => void;
  /** Fleet props — only provided when the user is a store owner */
  ownedStore?: any;
  fleetDrivers?: any[];
  onOpenFleetPanel?: () => void;
}

export function RoutesTab({ isOnline, orders, hasRecycled, onAccept, onGoOnline, ownedStore, fleetDrivers, onOpenFleetPanel }: RoutesTabProps) {
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

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-700">
      {orders.length === 0 ? (
        <div className="text-center py-32 space-y-6">
          <div className="relative w-16 h-16 mx-auto">
            <Loader2 className="w-16 h-16 animate-spin text-primary/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic">Radar de Rutas Activo...</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {orders.map(order => (
            <WasherRouteCard 
              key={order.id} 
              order={order} 
              onAccept={() => onAccept(order.id)} 
            />
          ))}
        </div>
      )}

      {/* BOTÓN DE ZONA DE RECICLAJE (SOLO APARECE SI HAY MISIONES CADUCADAS) */}
      <div className="pt-6 border-t border-slate-100 flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2 text-center px-8">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Protocolo de Recuperación</p>
          <h4 className="text-sm font-black italic uppercase tracking-tighter text-slate-500">¿No encontraste misiones frescas?</h4>
        </div>

        <Link href="/delivery/recycled" className="w-full">
          <Button 
            variant="outline" 
            disabled={!hasRecycled}
            className={cn(
              "w-full h-20 rounded-[32px] border-2 transition-all flex items-center justify-between px-8 gap-4 overflow-hidden group",
              hasRecycled 
                ? "border-slate-900 bg-white hover:bg-slate-50 shadow-xl active:scale-95" 
                : "border-slate-100 opacity-40 grayscale"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-colors",
                hasRecycled ? "bg-slate-100 text-slate-900 group-hover:bg-primary group-hover:text-white" : "bg-slate-50 text-slate-200"
              )}>
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-left">
                <span className="block font-black text-xs uppercase tracking-widest leading-none">Zona de Reciclaje</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase mt-1">Misiones para re-negociar</span>
              </div>
            </div>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all",
              hasRecycled ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white" : "bg-slate-50 text-slate-200"
            )}>
              <RotateCcw className="w-5 h-5" />
            </div>
          </Button>
        </Link>
      </div>

      {/* FLEET MANAGEMENT CARD — Solo visible para dueños de negocio */}
      {ownedStore && onOpenFleetPanel && (
        <FleetManagementCard 
          store={ownedStore} 
          drivers={fleetDrivers || []} 
          onOpenPanel={onOpenFleetPanel} 
        />
      )}
    </div>
  );
}
