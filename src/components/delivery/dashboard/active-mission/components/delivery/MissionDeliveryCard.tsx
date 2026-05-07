"use client";

import { MapPinned, Navigation, Phone, MessageCircle, Wallet, CreditCard, ArrowUpCircle, Loader2, Zap, Clock, Building2, Check, Package, Timer } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
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

  const orderCode = missionId?.slice(-6).toUpperCase() || '------';

  return (
    <section className="animate-in slide-in-from-right-4 duration-500 -mx-6 -mt-2">
      <Card className="border-none rounded-[32px] bg-white shadow-2xl overflow-hidden ring-1 ring-black/[0.03] mx-4">
        <div className="p-6 space-y-6">
          {/* HEADER UNIFICADO — PAGO + ORDEN */}
          <div className="rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden">
            {/* Fila: Método de pago */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                  paymentMethod === 'cash'
                    ? "bg-emerald-500/10"
                    : "bg-blue-500/10"
                )}>
                  {paymentMethod === 'cash' ? (
                    <Wallet className={cn("w-4 h-4", "text-emerald-600")} />
                  ) : (
                    <CreditCard className={cn("w-4 h-4", "text-blue-600")} />
                  )}
                </div>
                <div>
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Pago</p>
                  <p className={cn(
                    "text-[13px] font-black tracking-tight leading-none",
                    paymentMethod === 'cash' ? "text-emerald-700" : "text-blue-700"
                  )}>
                    {paymentMethod === 'cash' ? 'Efectivo' : 'Digital'}
                  </p>
                </div>
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-lg",
                paymentMethod === 'cash'
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-200 text-slate-500"
              )}>
                {paymentMethod === 'cash' ? formattedPrice : 'Sin cobro'}
              </span>
            </div>

            {/* Divisor */}
            <div className="h-px bg-slate-200 mx-4" />

            {/* Fila: Orden + duración */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Referencia</p>
                  <p className="text-[13px] font-black text-slate-700 tracking-tight leading-none">#{orderCode}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-slate-200 shadow-sm">
                <Timer className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[12px] font-black text-slate-600">{requestHours || 5}h</span>
              </div>
            </div>
          </div>

          {/* PUNTO DE ENTREGA */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                <MapPinned className="w-4 h-4 text-orange-500" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Punto de Entrega</span>
            </div>
            
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 shadow-xl">
              <h2 className="text-lg font-black text-white uppercase italic tracking-tighter leading-tight mb-2">
                {customerAddress}
              </h2>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                <p className="text-sm font-medium text-slate-300">
                  {customerSector || 'Sin barrio'}
                </p>
              </div>
            </div>
            
            <Button 
              onClick={onOpenMaps}
              className="w-full h-14 rounded-2xl bg-white text-slate-900 font-black text-sm uppercase italic tracking-wider border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
            >
              <Navigation className="w-5 h-5 mr-2 text-orange-500" />
              Abrir en Maps
            </Button>
          </div>

          {/* CLIENTE */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
                <Package className="w-4 h-4 text-purple-500" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</span>
            </div>
            
            <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-14 h-14 border-3 border-white shadow-lg">
                    <AvatarImage src={customerPhoto} className="object-cover" />
                    <AvatarFallback className="bg-purple-100 text-purple-600 font-black text-lg">
                      {customerName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 rounded-full p-1.5 border-2 border-white">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-black uppercase italic text-slate-800 leading-none">
                    {customerName}
                  </p>
                  <p className="text-xs font-medium text-slate-400 mt-1">
                    {customerPhone}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <a href={`tel:${customerPhone}`}>
                  <Button size="icon" variant="ghost" className="rounded-xl h-12 w-12 bg-white border border-slate-200 text-slate-400 hover:text-green-600 hover:border-green-200 hover:bg-green-50 transition-all shadow-sm">
                    <Phone className="w-5 h-5" />
                  </Button>
                </a>
                <Button onClick={onOpenChat} size="icon" variant="ghost" className="rounded-xl h-12 w-12 bg-slate-900 text-white hover:bg-black shadow-lg transition-all active:scale-95">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </Button>
              </div>
            </div>
          </div>

          {/* MONTO TOTAL */}
          <div className={cn(
            "rounded-2xl p-6 border-2",
            paymentMethod === 'cash' 
              ? "bg-emerald-50 border-emerald-200" 
              : "bg-blue-50 border-blue-200"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  paymentMethod === 'cash' ? "bg-emerald-500" : "bg-blue-500"
                )}>
                  {paymentMethod === 'cash' ? (
                    <Wallet className="w-6 h-6 text-white" />
                  ) : (
                    <CreditCard className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total a {paymentMethod === 'cash' ? 'Cobrar' : 'Cobrar'}</p>
                  <p className={cn(
                    "text-2xl font-black italic tracking-tighter",
                    paymentMethod === 'cash' ? "text-emerald-600" : "text-blue-600"
                  )}>
                    {formattedPrice}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* DETALLES TÉCNICOS - COLAPSABLE */}
          <Collapsible className="rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden" defaultOpen={false}>
            <CollapsibleTrigger className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="w-4 h-4 text-slate-600" />
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Detalles Técnicos</span>
              </div>
              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                <svg className="w-3 h-3 text-slate-500 transition-transform CollapsibleTrigger[data-state='open']:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="px-5 pb-5 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <div className="bg-white rounded-xl p-4 flex flex-col border border-slate-200 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center mb-3">
                      <Building2 className="w-4 h-4 text-orange-500" />
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Piso / Nivel</p>
                    <p className="text-sm font-black italic text-slate-800">Piso {floor || '1'}</p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 flex flex-col border border-slate-200 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
                      {hasStairs ? (
                        <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Dificultad</p>
                    <p className={cn(
                      "text-sm font-black italic",
                      hasStairs ? "text-amber-600" : "text-emerald-600"
                    )}>
                      {hasStairs ? `${stairCount} Escaleras` : 'Sin escaleras'}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-4 flex flex-col border border-slate-200 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
                      <Package className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Equipo</p>
                    <p className="text-sm font-black italic text-blue-600">{washerType || 'Automática'}</p>
                  </div>

                  <div className="bg-white rounded-xl p-4 flex flex-col border border-slate-200 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center mb-3">
                      <Timer className="w-4 h-4 text-purple-500" />
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Duración</p>
                    <p className="text-sm font-black italic text-purple-600">{requestHours || 5} Horas</p>
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