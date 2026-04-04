
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  ArrowRight, 
  Zap, 
  Wallet, 
  Clock, 
  RotateCcw, 
  ShieldCheck, 
  AlertTriangle,
  Star,
  Info,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WasherRouteCardProps {
  order: any;
  onAccept: () => void;
}

/**
 * WasherRouteCard - Diseño "Tipo DiDi" Ultra-Estratégico (Mandamiento #1)
 * Escaneable en 3 segundos para decisión instantánea.
 */
export function WasherRouteCard({ order, onAccept }: WasherRouteCardProps) {
  const formattedPrice = new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0 
  }).format(order.totalPrice || 0);

  const getStatusBadge = () => {
    if (order.priority === 'urgent') return { label: 'URGENTE', color: 'bg-red-500', icon: Zap };
    if (order.status === 'pending') return { label: 'DISPONIBLE', color: 'bg-green-500', icon: CheckCircle2 };
    return { label: 'PROGRAMADO', color: 'bg-blue-500', icon: Clock };
  };

  const status = getStatusBadge();
  const StatusIcon = status.icon;

  return (
    <Card className="border-none rounded-[48px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] bg-white overflow-hidden ring-1 ring-black/[0.03] group hover:shadow-2xl transition-all duration-500">
      <CardContent className="p-0">
        {/* 1. ESTADO (Top Bar) */}
        <div className={cn("h-10 px-8 flex items-center gap-2 text-white", status.color)}>
          <StatusIcon className="w-3.5 h-3.5 animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em]">{status.label}</span>
        </div>

        <div className="p-8 space-y-8">
          {/* 2. GANANCIA Y SERVICIO */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary">
                <Wallet className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">GANANCIA TOTAL</span>
              </div>
              <h2 className="text-5xl font-black italic tracking-tighter text-slate-900 leading-none">
                {formattedPrice}
              </h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Incluye bono de cumplimiento</p>
            </div>
            <div className="text-right flex flex-col items-end">
              <Badge className="bg-slate-900 text-white border-none font-black text-sm italic uppercase px-4 h-10 rounded-2xl shadow-xl">
                {order.productName || 'Lavadora 5H'}
              </Badge>
              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-2">{order.washerType || 'AUTOMÁTICA'}</span>
            </div>
          </div>

          {/* 4 & 5. UBICACIÓN Y TIEMPO */}
          <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
            
            <div className="flex items-start gap-5">
              <div className="w-10 h-10 rounded-2xl bg-white shadow-md flex items-center justify-center shrink-0 border border-slate-50">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Trayectoria de Misión</p>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-black text-slate-800 uppercase italic truncate">{order.storeName}</span>
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                  <span className="text-lg font-black text-primary uppercase italic truncate">Cliente</span>
                </div>
                <p className="text-xs font-bold text-slate-500 mt-1 truncate">{order.customerAddress}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-200/50 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm"><Clock className="w-4 h-4" /></div>
                <div><p className="text-[8px] font-black text-slate-400 uppercase">Tiempo Est.</p><p className="text-sm font-black text-slate-700 leading-none">35 min</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm"><RotateCcw className="w-4 h-4" /></div>
                <div><p className="text-[8px] font-black text-slate-400 uppercase">Ruta</p><p className="text-sm font-black text-slate-700 leading-none">{order.routeType === 'round_trip' ? 'Ida y Vuelta' : 'Entrega'}</p></div>
              </div>
            </div>
          </div>

          {/* 6 & 8. DETALLES Y ALERTAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Especificaciones</p>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span className="text-[11px] font-bold uppercase italic">Piso {order.floor || '1'} {order.hasElevator ? '(Ascensor)' : '(Escaleras)'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span className="text-[11px] font-bold uppercase italic">{order.needsInstallation ? 'Requiere Instalación' : 'Solo entrega'}</span>
                </div>
              </div>
            </div>

            {/* ALERTA DE ESCALERAS */}
            {order.hasStairs && (
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-3xl flex items-center gap-3 animate-pulse">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Requiere subir escalas</span>
              </div>
            )}
          </div>

          {/* 9. CLIENTE */}
          <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-100 text-slate-400"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /></div>
              <p className="text-[11px] font-black uppercase text-slate-700 italic">5.0 — {order.customerName}</p>
            </div>
            <Info className="w-4 h-4 text-slate-300" />
          </div>

          {/* 10. BOTÓN DE ACCIÓN */}
          <Button 
            onClick={onAccept}
            className="w-full h-20 rounded-[32px] bg-primary text-white font-black text-xl uppercase italic tracking-widest gap-4 shadow-[0_20px_50px_rgba(59,130,246,0.3)] border-b-[8px] border-blue-800 active:border-b-0 active:translate-y-2 transition-all group"
          >
            ACEPTAR RUTA <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
