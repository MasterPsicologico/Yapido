
"use client";

import { X, MapPin, Smartphone, MessageSquareText, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, Timer, PackageCheck } from 'lucide-react';
import { MissionUsageCountdown } from '@/components/delivery/dashboard/active-mission/components/timer/MissionUsageCountdown';
import { MyDeliveriesActions } from './MyDeliveriesActions';
import { PickupNavDetails } from './PickupNavDetails';
import { MissionLogTimeline } from './MissionLogTimeline';
import { PickupMissionView } from './PickupMissionView';
import { cn } from '@/lib/utils';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.131.57-.074 1.758-.706 2.006-1.388.248-.683.248-1.265.173-1.388-.075-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .01 5.393 0 12.03c0 2.123.54 4.197 1.57 6.05L0 24l6.15-1.612a11.81 11.81 0 005.89 1.568h.005c6.634 0 12.04-5.39 12.043-12.03a11.82 11.82 0 00-3.48-8.513z"/>
  </svg>
);

interface TerminalViewProps {
  order: any;
  isCompleted: boolean;
  isExpired: boolean;
  timeIn: string;
  timeOut: string;
  absRemaining: number;
  durationHours: number;
  remaining: number;
  onClose: () => void;
  onAdjustHours: (extra: number) => void;
  onInternalChat: () => void;
  onUpdateStatus: (status: string, metadata?: any) => void;
  onFinalize: (id: string) => void;
}

export function TerminalView({
  order, isCompleted, isExpired, timeIn, timeOut, absRemaining, durationHours, remaining,
  onClose, onAdjustHours, onInternalChat, onUpdateStatus, onFinalize
}: TerminalViewProps) {

  // ROUTING: Si está en modo recogida, renderizar vista especializada
  const isPickupPhase = order.status === 'picking_up' || order.status === 'at_pickup';
  if (isPickupPhase) {
    return (
      <PickupMissionView
        order={order}
        onClose={onClose}
        onInternalChat={onInternalChat}
        onUpdateStatus={onUpdateStatus}
        onFinalize={onFinalize}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[600] bg-[#f8fafc] flex flex-col animate-in fade-in zoom-in duration-300 overflow-hidden">
      {/* Cuerpo de la Terminal con Scroll Blindado */}
      <ScrollArea className="flex-1 w-full">
        {/* Header que ahora hace scroll con el contenido */}
        <div className="w-full bg-white border-b border-slate-100 shadow-sm mb-8">
           <div className="max-w-2xl mx-auto px-6 py-6 flex items-start justify-between">
             <div className="flex items-center gap-4 pr-4">
                <div className={cn(
                  "w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center shadow-inner",
                  isCompleted ? "bg-green-500 text-white" : isExpired ? "bg-red-500 text-white" : "bg-primary text-white"
                )}>
                  {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Timer className="w-6 h-6" />}
                </div>
                <div className="min-w-0 space-y-1.5">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Terminal de Mando</p>
                  <h4 className="text-sm font-black uppercase italic tracking-tight text-slate-900 leading-tight break-words">
                    {order.customerName}
                  </h4>
                </div>
             </div>
             <Button 
               variant="ghost" 
               size="icon" 
               onClick={onClose}
               className="h-12 w-12 rounded-full bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm active:scale-90 shrink-0"
             >
               <X className="w-6 h-6 stroke-[3]" />
             </Button>
           </div>
        </div>

        <div className="px-6 pb-32 space-y-10 max-w-2xl mx-auto">
          
          {isCompleted ? (
            <div className="bg-green-50 border border-green-200 rounded-[32px] p-8 text-center space-y-4 shadow-inner">
              <div className="w-16 h-16 mx-auto bg-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                <PackageCheck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-black italic uppercase tracking-tight text-green-800">Misión Finalizada</h3>
              <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Lavadora recogida exitosamente</p>
              <div className="flex items-center justify-center gap-6 pt-2">
                <div className="text-center">
                  <p className="text-[8px] font-black text-green-500 uppercase tracking-widest">Entregada</p>
                  <p className="text-sm font-black text-green-800">{timeIn}</p>
                </div>
                <div className="w-px h-8 bg-green-200" />
                <div className="text-center">
                  <p className="text-[8px] font-black text-green-500 uppercase tracking-widest">Recogida</p>
                  <p className="text-sm font-black text-green-800">
                    {order.completedAt 
                      ? new Date(order.completedAt?.toDate?.() || (order.completedAt?.seconds ? order.completedAt.seconds * 1000 : Date.now())).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
                      : timeOut
                    }
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full flex justify-center overflow-hidden px-1">
              <MissionUsageCountdown 
                progress={{
                  hours: Math.floor(absRemaining / 3600),
                  minutes: Math.floor((absRemaining % 3600) / 60),
                  seconds: absRemaining % 60,
                  percentage: Math.min(100, (1 - (remaining / (durationHours * 3600))) * 100),
                  expiryLabel: timeOut,
                  isExpired,
                  dropOffTime: timeIn
                }}
                onAddHours={() => onAdjustHours(1)}
                onRemoveHour={() => onAdjustHours(-1)}
              />
            </div>
          )}

          <div className="bg-white p-8 rounded-[40px] border border-slate-100 space-y-8 shadow-xl">
            <div className="flex items-start gap-4">
              <MapPin className="w-6 h-6 text-primary shrink-0 mt-1" />
              <div className="space-y-1">
                <span className="text-lg font-black uppercase italic text-slate-900 tracking-tight leading-snug">{order.customerAddress}</span>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sector: {order.customerSector || order.cityName || 'Ciudad'}</p>
              </div>
            </div>

            {/* INTEGRACIÓN DE LÍNEA DE TIEMPO DETALLADA */}
            <div className="pt-4 border-t border-slate-50">
              <MissionLogTimeline order={order} />
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-primary animate-pulse" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">VALOR TOTAL RECAUDADO</span>
              </div>
              <span className="text-2xl font-black italic text-slate-900 tracking-tighter">
                {new Intl.NumberFormat('es-CO', { 
                  style: 'currency', currency: 'COP', maximumFractionDigits: 0 
                }).format(order.totalPrice || 0)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button 
              onClick={() => window.open(`https://wa.me/57${order.customerPhone.replace(/\D/g, '')}`)}
              className="h-16 rounded-[24px] bg-gradient-to-br from-[#fef08a] via-[#eab308] to-[#a16207] text-slate-950 font-black uppercase text-xs tracking-widest gap-3 shadow-xl border-b-4 border-[#854d0e] active:border-b-0 active:translate-y-1 transition-all"
            >
              <WhatsAppIcon className="w-5 h-5" /> WHATSAPP
            </Button>
            <Button 
              onClick={onInternalChat}
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
              <MyDeliveriesActions orderId={order.id} status={order.status} onUpdateStatus={onUpdateStatus} onFinalize={() => onFinalize(order.id)} />
              <PickupNavDetails status={order.status} customerAddress={order.customerAddress} customerSector={order.customerSector} />
            </div>
          )}
          
          <div className="flex flex-col items-center gap-3 pt-10 opacity-40">
            <Zap className="w-6 h-6 text-primary animate-pulse" />
            <p className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-400">yapido.click AI Central • Kernel v1.0.4</p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
