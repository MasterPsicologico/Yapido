
"use client";

import { Button } from '@/components/ui/button';
import { Package, Truck, Store as StoreIcon, MessageCircle, ArrowRight, MapPin, Layers, Zap, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusIdentityCardProps {
  order: any;
  isAssigned: boolean;
  onGoToTracking: () => void;
}

/**
 * StatusIdentityCard — Rediseño Premium con fondo blanco y elementos internos renovados.
 */
export function StatusIdentityCard({ order, isAssigned, onGoToTracking }: StatusIdentityCardProps) {
  const isPreparing = order?.status === 'preparing';

  const title = isPreparing
    ? "PEDIDO ACEPTADO"
    : isAssigned
      ? "¡PEDIDO EN RUTA!"
      : "ALISTAMIENTO";

  const subtitle = isPreparing
    ? "La tienda está preparando tu equipo"
    : isAssigned
      ? "Tu contrato ha sido formalizado"
      : "Despachando tu lavadora élite";

  return (
    <section className="animate-in slide-in-from-bottom-4 duration-700">
      <div className={cn(
        "relative rounded-3xl overflow-hidden shadow-[0_8px_48px_rgba(0,0,0,0.10)]",
        isAssigned ? "bg-[#0A0A12]" : "bg-white"
      )}>

        {/* ── Barra de estado superior ── */}
        <div className={cn(
          "relative flex items-center gap-3 px-7 py-4 border-b",
          isAssigned
            ? "bg-green-500/10 border-green-500/15"
            : "bg-slate-50 border-slate-100"
        )}>
          {/* Dot pulsante */}
          <span className={cn(
            "relative flex h-2.5 w-2.5 shrink-0",
          )}>
            <span className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-60",
              isAssigned ? "bg-green-400" : "bg-primary"
            )} />
            <span className={cn(
              "relative inline-flex rounded-full h-2.5 w-2.5",
              isAssigned ? "bg-green-500" : "bg-primary"
            )} />
          </span>
          <p className={cn(
            "text-[10px] font-black uppercase tracking-[0.3em] leading-none",
            isAssigned ? "text-green-500" : "text-primary"
          )}>
            {isAssigned ? "Activo · En movimiento" : isPreparing ? "Activo · Preparando" : "En proceso · Alistando"}
          </p>
          {isAssigned && (
            <div className="ml-auto flex items-center gap-1.5 bg-green-500/15 px-3 py-1 rounded-full border border-green-500/20">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Confirmado</span>
            </div>
          )}
        </div>

        {/* ── Cuerpo principal ── */}
        <div className="p-7 space-y-6">

          {/* Header: Ícono + Título */}
          <div className="flex items-start gap-5">
            {/* Ícono con fondo geométrico */}
            <div className="relative shrink-0">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center",
                isAssigned
                  ? "bg-green-500 shadow-[0_8px_24px_rgba(34,197,94,0.35)]"
                  : "bg-primary/8 shadow-inner"
              )}>
                {isAssigned
                  ? <Truck className="w-8 h-8 text-white" strokeWidth={2.5} />
                  : <Package className="w-8 h-8 text-primary animate-bounce" strokeWidth={2} />
                }
              </div>
              {/* Badge decorativo en esquina */}
              {!isAssigned && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md shadow-primary/30">
                  <Zap className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {/* Texto de título */}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className={cn(
                "text-[9px] font-black uppercase tracking-[0.35em] mb-1",
                isAssigned ? "text-green-500" : "text-primary/70"
              )}>
                PROCESO DE ALISTAMIENTO
              </p>
              <h3 className={cn(
                "text-[2rem] font-black italic uppercase tracking-tighter leading-[0.9] break-words",
                isAssigned ? "text-white" : "text-slate-900"
              )}>
                {title}
              </h3>
            </div>
          </div>

          {/* Subtítulo separado */}
          <p className={cn(
            "text-sm font-medium leading-relaxed -mt-2",
            isAssigned ? "text-slate-400" : "text-slate-500"
          )}>
            {subtitle}
          </p>

          {/* ── Sub-contenedor de datos ── */}
          <div className={cn(
            "rounded-2xl overflow-hidden border divide-y",
            isAssigned
              ? "border-white/8 divide-white/8"
              : "border-slate-100 divide-slate-100"
          )}>
            {/* Fila Equipo */}
            <div className={cn(
              "flex items-center gap-4 px-5 py-4",
              isAssigned ? "bg-white/4" : "bg-slate-50/60"
            )}>
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                isAssigned ? "bg-white/8" : "bg-primary/8"
              )}>
                <Layers className={cn("w-4 h-4", isAssigned ? "text-slate-300" : "text-primary")} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-[9px] font-black uppercase tracking-[0.3em] mb-0.5",
                  isAssigned ? "text-slate-500" : "text-slate-400"
                )}>Equipo</p>
                <p className={cn(
                  "text-sm font-black italic uppercase tracking-tight truncate",
                  isAssigned ? "text-white" : "text-slate-900"
                )}>
                  {order?.washerType || 'Lavadora'}
                </p>
              </div>
            </div>

            {/* Fila Destino */}
            <div className={cn(
              "flex items-center gap-4 px-5 py-4",
              isAssigned ? "bg-white/[0.02]" : "bg-white"
            )}>
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                isAssigned ? "bg-white/8" : "bg-slate-100"
              )}>
                <MapPin className={cn("w-4 h-4", isAssigned ? "text-slate-300" : "text-slate-500")} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-[9px] font-black uppercase tracking-[0.3em] mb-0.5",
                  isAssigned ? "text-slate-500" : "text-slate-400"
                )}>Destino</p>
                <p className={cn(
                  "text-sm font-semibold truncate",
                  isAssigned ? "text-slate-200" : "text-slate-700"
                )}>
                  {order?.customerAddress || 'Dirección no disponible'}
                </p>
              </div>
            </div>

            {/* Fila Tienda (solo si asignado) */}
            {isAssigned && (
              <div className="flex items-center gap-4 px-5 py-4 bg-white/4">
                <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <StoreIcon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-0.5 text-slate-500">Tienda</p>
                  <p className="text-sm font-black italic uppercase tracking-tight text-white truncate">
                    {order?.storeName || 'Tienda'}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl text-primary hover:bg-primary/10 shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* ── CTA Seguimiento (solo si asignado) ── */}
          {isAssigned && (
            <Button
              onClick={onGoToTracking}
              className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest gap-3 shadow-xl shadow-primary/25 active:scale-[0.98] transition-all text-sm"
            >
              <span>IR AL SEGUIMIENTO</span>
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowRight className="w-4 h-4" />
              </div>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
