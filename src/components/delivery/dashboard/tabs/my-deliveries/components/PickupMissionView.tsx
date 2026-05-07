
"use client";

import { X, MapPinned, Navigation, Smartphone, MessageSquareText, Zap, PackageCheck, Truck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.131.57-.074 1.758-.706 2.006-1.388.248-.683.248-1.265.173-1.388-.075-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .01 5.393 0 12.03c0 2.123.54 4.197 1.57 6.05L0 24l6.15-1.612a11.81 11.81 0 005.89 1.568h.005c6.634 0 12.04-5.39 12.043-12.03a11.82 11.82 0 00-3.48-8.513z"/>
  </svg>
);

interface PickupMissionViewProps {
  order: any;
  onClose: () => void;
  onInternalChat: () => void;
  onUpdateStatus: (status: string, metadata?: any) => void;
  onFinalize: (id: string) => void;
}

/**
 * PickupMissionView - Vista Especializada para Recogida de Lavadora.
 * Diseño ámbar/naranja diferenciado de la vista de entrega.
 * Se activa cuando el status es picking_up o at_pickup.
 */
export function PickupMissionView({
  order, onClose, onInternalChat, onUpdateStatus, onFinalize
}: PickupMissionViewProps) {

  const isMovingToPickup = order.status === 'picking_up';
  const isAtPickup = order.status === 'at_pickup';

  const steps = [
    { 
      label: 'En Camino', 
      done: isMovingToPickup || isAtPickup, 
      active: isMovingToPickup,
      icon: Truck 
    },
    { 
      label: 'En el Sitio', 
      done: isAtPickup, 
      active: isAtPickup,
      icon: MapPinned 
    },
    { 
      label: 'Recogida', 
      done: false, 
      active: false,
      icon: PackageCheck 
    },
  ];

  return (
    <div className="fixed inset-0 z-[600] bg-[#fffbf5] flex flex-col animate-in fade-in zoom-in duration-300 overflow-hidden">
      <ScrollArea className="flex-1 w-full">
        {/* HEADER ÁMBAR - Identidad de Recogida */}
        <div className="w-full bg-gradient-to-b from-orange-500 to-amber-500 shadow-lg mb-0">
          <div className="max-w-2xl mx-auto px-6 py-6 flex items-start justify-between">
            <div className="flex items-center gap-4 pr-4">
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0 space-y-1.5">
                <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Modo Recogida</p>
                <h4 className="text-sm font-black uppercase italic tracking-tight text-white leading-tight break-words">
                  {order.customerName}
                </h4>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="h-12 w-12 rounded-full bg-white/10 text-white hover:text-white hover:bg-white/20 transition-all shadow-sm active:scale-90 shrink-0"
            >
              <X className="w-6 h-6 stroke-[3]" />
            </Button>
          </div>

          {/* TIMELINE DE PROGRESO */}
          <div className="max-w-2xl mx-auto px-6 pb-6">
            <div className="flex items-center justify-between relative">
              {/* Connecting line */}
              <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-white/20" />
              <div 
                className="absolute top-5 left-[10%] h-0.5 bg-white/80 transition-all duration-700"
                style={{ 
                  width: isAtPickup ? '80%' : isMovingToPickup ? '40%' : '0%' 
                }}
              />
              
              {steps.map((step, i) => {
                const StepIcon = step.icon;
                return (
                  <div key={i} className="flex flex-col items-center gap-2 relative z-10">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
                      step.active 
                        ? "bg-white text-orange-500 shadow-lg scale-110" 
                        : step.done 
                          ? "bg-white/80 text-orange-600" 
                          : "bg-white/20 text-white/50"
                    )}>
                      {step.done && !step.active ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <StepIcon className={cn("w-5 h-5", step.active && "animate-pulse")} />
                      )}
                    </div>
                    <span className={cn(
                      "text-[8px] font-black uppercase tracking-widest",
                      step.active ? "text-white" : "text-white/50"
                    )}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 pt-8 pb-32 space-y-8 max-w-2xl mx-auto">
          
          {/* TARJETA DE DIRECCIÓN */}
          <div className="bg-white p-8 rounded-[40px] border border-orange-100 space-y-6 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[9px] font-black text-orange-500 uppercase tracking-[0.3em]">
                {isMovingToPickup ? 'Dirigiéndose a Recoger' : 'En el Punto de Recogida'}
              </span>
            </div>

            <div className="flex items-start gap-4">
              <MapPinned className="w-6 h-6 text-orange-500 shrink-0 mt-1" />
              <div className="space-y-1">
                <span className="text-lg font-black uppercase italic text-slate-900 tracking-tight leading-snug">{order.customerAddress}</span>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sector: {order.customerSector || order.cityName || 'Ciudad'}</p>
              </div>
            </div>

            {/* Navegación GPS */}
            <Button 
              onClick={() => {
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.customerAddress)}`, '_blank');
              }}
              className="w-full h-14 rounded-[20px] bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest gap-3 shadow-xl active:scale-95 transition-all"
            >
              <Navigation className="w-5 h-5" /> ABRIR NAVEGADOR GPS
            </Button>

            {/* Info del servicio */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-orange-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Valor del Servicio</span>
              </div>
              <span className="text-xl font-black italic text-slate-900 tracking-tighter">
                {new Intl.NumberFormat('es-CO', { 
                  style: 'currency', currency: 'COP', maximumFractionDigits: 0 
                }).format(order.totalPrice || 0)}
              </span>
            </div>
          </div>

          {/* COMUNICACIÓN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button 
              onClick={() => window.open(`https://wa.me/57${order.customerPhone?.replace(/\D/g, '')}`)}
              className="h-16 rounded-[24px] bg-gradient-to-br from-[#fef08a] via-[#eab308] to-[#a16207] text-slate-950 font-black uppercase text-xs tracking-widest gap-3 shadow-xl border-b-4 border-[#854d0e] active:border-b-0 active:translate-y-1 transition-all"
            >
              <WhatsAppIcon className="w-5 h-5" /> WHATSAPP
            </Button>
            <Button 
              onClick={onInternalChat}
              className="h-16 rounded-[24px] bg-orange-500 text-white font-black uppercase text-xs tracking-widest gap-3 shadow-xl active:scale-95 transition-all"
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

          {/* ACCIONES DE RECOGIDA */}
          <div className="space-y-4">
            {isMovingToPickup && (
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateStatus('at_pickup', { id: order.id });
                }}
                className="w-full h-20 rounded-[28px] bg-orange-500 hover:bg-orange-600 text-white font-black text-sm uppercase italic tracking-widest gap-3 shadow-[0_20px_50px_rgba(249,115,22,0.4)] active:scale-95 transition-all border-b-[8px] border-orange-700 active:border-b-0 active:translate-y-2"
              >
                <div className="flex items-center justify-center gap-3 w-full">
                  <div className="w-3 h-3 rounded-full bg-white animate-pulse shrink-0" />
                  <span>LLEGUÉ A BUSCAR LA LAVADORA</span>
                </div>
              </Button>
            )}

            {isAtPickup && (
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  onFinalize(order.id);
                }}
                className="w-full h-20 rounded-[28px] bg-green-600 hover:bg-green-500 text-white font-black text-sm uppercase italic tracking-widest gap-3 shadow-[0_20px_50px_rgba(34,197,94,0.4)] border-b-[8px] border-green-800 active:border-b-0 active:translate-y-2 transition-all"
              >
                <PackageCheck className="w-7 h-7 animate-bounce" /> RECOGÍ LA LAVADORA
              </Button>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex flex-col items-center gap-3 pt-10 opacity-40">
            <Zap className="w-6 h-6 text-orange-500 animate-pulse" />
            <p className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-400">Vitriniando AI Central • Modo Recogida</p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
