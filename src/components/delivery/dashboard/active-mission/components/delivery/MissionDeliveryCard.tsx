
"use client";

import { MapPinned, Navigation, Phone, MessageCircle, Wallet, CreditCard, Settings2, ArrowUpCircle, Loader2, Zap, Clock, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface MissionDeliveryCardProps {
  customerAddress: string;
  customerSector?: string;
  customerName: string;
  customerPhone: string;
  customerPhoto?: string;
  totalPrice: number;
  paymentMethod: 'cash' | 'digital';
  onOpenMaps: () => void;
  onOpenChat: () => void;
  missionId?: string;
  requestHours?: number;
  floor?: string;
  hasStairs?: boolean;
  stairCount?: number;
  washerType?: string;
}

export function MissionDeliveryCard({
  customerAddress,
  customerSector,
  customerName,
  customerPhone,
  customerPhoto,
  totalPrice,
  paymentMethod,
  onOpenMaps,
  onOpenChat,
  missionId,
  requestHours,
  floor,
  hasStairs,
  stairCount,
  washerType
}: MissionDeliveryCardProps) {
  const formattedPrice = new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0 
  }).format(totalPrice);

  return (
    <section className="animate-in slide-in-from-right-4 duration-500">
      <Card className="border-none rounded-[32px] bg-white shadow-2xl overflow-hidden ring-1 ring-black/[0.03]">
        {/* ENCABEZADO NEGRO UNIFICADO (COBRO + ID + HORAS) */}
        <div className="bg-slate-900 flex flex-col text-white">
          <div className={cn(
            "h-10 flex items-center justify-center gap-2 px-4 border-b border-white/10",
            paymentMethod === 'cash' ? "bg-red-600" : "bg-slate-900 text-primary"
          )}>
            {paymentMethod === 'cash' ? <Wallet className="w-4 h-4 animate-pulse" /> : <CreditCard className="w-4 h-4" />}
            <span className="text-[10px] font-black uppercase tracking-[0.15em]">
              {paymentMethod === 'cash' ? `COBRAR EN EFECTIVO: ${formattedPrice}` : 'PAGO DIGITAL - NO COBRAR'}
            </span>
          </div>

          <div className="px-5 py-3 flex items-center justify-between bg-slate-950/50">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <Zap className="w-3.5 h-3.5 text-primary animate-pulse" />
              </div>
              <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">
                MISIÓN <span className="text-white">#{missionId?.slice(-6).toUpperCase()}</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 rounded-full border border-primary/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-black text-primary italic tracking-wider">{requestHours || 5} HORAS</span>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* PUNTO DE ENTREGA */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-primary mb-1">
                <MapPinned className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] italic text-primary">Punto de Entrega</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight uppercase italic tracking-tighter truncate">
                {customerAddress}
              </h2>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                <p className="text-xs sm:text-sm font-black text-slate-900 leading-tight uppercase italic tracking-tighter truncate">
                  <span className="text-slate-400">barrio:</span> {customerSector || 'No especificado'}
                </p>
              </div>
            </div>
            
            <Button 
              onClick={onOpenMaps}
              className="rounded-2xl h-14 w-14 bg-slate-900 text-white shadow-xl active:scale-90 transition-all group shrink-0 border-b-[4px] border-slate-950 mt-1"
            >
              <Navigation className="w-6 h-6 group-hover:animate-bounce" />
            </Button>
          </div>

          {/* CLIENTE */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
                  <AvatarImage src={customerPhoto} className="object-cover" />
                  <AvatarFallback className="bg-primary/10 text-primary font-black text-base">
                    {customerName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full p-0.5 border-2 border-white shadow-sm">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                </div>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Cliente</p>
                <p className="text-sm font-black uppercase italic text-slate-800 leading-none tracking-tighter">
                  {customerName}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <a href={`tel:${customerPhone}`}>
                <Button size="icon" variant="ghost" className="rounded-full h-11 w-11 bg-slate-50 text-slate-400 hover:text-primary hover:bg-primary/10 transition-all shadow-sm">
                  <Phone className="w-4 h-4" />
                </Button>
              </a>
              <Button onClick={onOpenChat} size="icon" variant="ghost" className="rounded-full h-11 w-11 bg-slate-900 text-white hover:bg-black shadow-lg transition-all active:scale-90">
                <MessageCircle className="w-4 h-4 text-primary" />
              </Button>
            </div>
          </div>

          {/* DETALLES DE OPERACIÓN - COLAPSABLE CON FONDO BLANCO */}
          <Collapsible className="rounded-[24px] bg-white border border-slate-200 overflow-hidden" defaultOpen={false}>
            <CollapsibleTrigger className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-slate-600" />
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.25em]">Detalles Técnicos</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 transition-transform CollapsibleTrigger[data-state='open']:rotate-180" />
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="px-5 pb-5 border-t border-slate-100">
                <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-4">
                  <div className="bg-slate-50 hover:bg-slate-100 transition-colors rounded-2xl p-3 sm:p-4 flex flex-col justify-center border border-slate-200 group">
                    <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nivel / Piso</p>
                    <div className="flex items-center gap-2">
                      <ArrowUpCircle className="w-4 h-4 text-slate-600 group-hover:text-slate-900 transition-colors" />
                      <p className="text-xs sm:text-sm font-black italic text-slate-800 truncate">Piso {floor || '1'}</p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 hover:bg-slate-100 transition-colors rounded-2xl p-3 sm:p-4 flex flex-col justify-center border border-slate-200 group">
                    <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Dificultad</p>
                    <div className="flex items-center gap-2">
                      {hasStairs ? (
                        <>
                          <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                          <span className="text-xs sm:text-sm font-black italic text-orange-600 truncate">{stairCount} Escalas</span>
                        </>
                      ) : (
                        <>
                          <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                          </div>
                          <span className="text-xs sm:text-sm font-black italic text-green-600 truncate">Sin Escalas</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 hover:bg-slate-100 transition-colors rounded-2xl p-3 sm:p-4 flex flex-col justify-center border border-slate-200 group">
                    <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tipo Equipo</p>
                    <div className="flex items-center gap-2">
                      <Settings2 className="w-4 h-4 text-blue-500 group-hover:rotate-90 transition-transform duration-500" />
                      <p className="text-xs sm:text-sm font-black italic text-blue-600 truncate">{washerType || 'Automática'}</p>
                    </div>
                  </div>

                  <div className="bg-primary/10 hover:bg-primary/20 transition-colors rounded-2xl p-3 sm:p-4 flex flex-col justify-center border border-primary/20 group">
                    <p className="text-[8px] sm:text-[9px] font-bold text-primary/80 uppercase tracking-widest mb-1.5">Total Cobro</p>
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                      <p className="text-xs sm:text-sm font-black italic text-primary truncate">{formattedPrice}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </Card>
    </section>
  );
}
