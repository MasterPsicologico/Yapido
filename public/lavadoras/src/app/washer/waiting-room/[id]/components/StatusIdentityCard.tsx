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
 * StatusIdentityCard — Tarjeta limpia y compacta con el estado del pedido.
 * Cambios clave:
 *   • Título principal reducido a `text-base` (1rem) — 50% del tamaño anterior
 *     para garantizar que no se desborde en pantallas pequeñas.
 *   • Eliminado el sufijo "élite" del subtítulo.
 *   • Layout más respirado, sin la caja negra pesada.
 */
export function StatusIdentityCard({ order, isAssigned, onGoToTracking }: StatusIdentityCardProps) {
  const isPreparing = order?.status === 'preparing';

  const title = isPreparing
    ? "Pedido aceptado"
    : isAssigned
      ? "¡Pedido en ruta!"
      : "Alistamiento";

  const subtitle = isPreparing
    ? "La tienda está preparando tu equipo"
    : isAssigned
      ? "Tu contrato ha sido formalizado"
      : "Despachando tu lavadora";

  const statusLabel = isAssigned
    ? "Activo · En movimiento"
    : isPreparing
      ? "Activo · Preparando"
      : "En proceso · Alistando";

  return (
    <section className="animate-in slide-in-from-bottom-4 duration-700">
      <div
        className={cn(
          "relative rounded-3xl overflow-hidden bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] ring-1",
          isAssigned ? "ring-emerald-200/60" : "ring-slate-100"
        )}
      >
        {/* ── Barra de estado superior ── */}
        <div
          className={cn(
            "flex items-center gap-2.5 px-5 py-3 border-b",
            isAssigned ? "bg-emerald-50/60 border-emerald-100" : "bg-slate-50/60 border-slate-100"
          )}
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span
              className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping",
                isAssigned ? "bg-emerald-400" : "bg-primary"
              )}
            />
            <span
              className={cn(
                "relative inline-flex h-2 w-2 rounded-full",
                isAssigned ? "bg-emerald-500" : "bg-primary"
              )}
            />
          </span>
          <p
            className={cn(
              "text-[10px] font-black uppercase tracking-[0.2em] leading-none",
              isAssigned ? "text-emerald-700" : "text-primary"
            )}
          >
            {statusLabel}
          </p>
          {isAssigned && (
            <div className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-100/70 px-2.5 py-0.5">
              <CheckCircle className="h-3 w-3 text-emerald-600" />
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700">
                Confirmado
              </span>
            </div>
          )}
        </div>

        {/* ── Cuerpo principal ── */}
        <div className="p-5 space-y-5">

          {/* Header: Ícono + Título */}
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div
                className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center",
                  isAssigned ? "bg-emerald-500" : "bg-primary/10"
                )}
              >
                {isAssigned ? (
                  <Truck className="h-6 w-6 text-white" strokeWidth={2.5} />
                ) : (
                  <Package className="h-6 w-6 text-primary animate-bounce" strokeWidth={2} />
                )}
              </div>
              {!isAssigned && (
                <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center shadow shadow-primary/30">
                  <Zap className="h-2.5 w-2.5 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <p
                className={cn(
                  "text-[9px] font-black uppercase tracking-[0.2em] mb-1",
                  isAssigned ? "text-emerald-600" : "text-primary/70"
                )}
              >
                Proceso de alistamiento
              </p>
              <h3
                className={cn(
                  // text-base = 1rem = 16px. Antes era 2rem (32px) → reducción 50%.
                  "text-base font-black italic uppercase tracking-tight leading-tight break-words",
                  isAssigned ? "text-slate-900" : "text-slate-900"
                )}
              >
                {title}
              </h3>
              <p
                className={cn(
                  "mt-1 text-sm font-medium leading-snug",
                  isAssigned ? "text-slate-500" : "text-slate-500"
                )}
              >
                {subtitle}
              </p>
            </div>
          </div>

          {/* ── Sub-contenedor de datos ── */}
          <div className="rounded-2xl overflow-hidden border border-slate-100 divide-y divide-slate-100">
            {/* Fila Equipo */}
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/40">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Layers className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Equipo
                </p>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {order?.washerType || 'Lavadora'}
                </p>
              </div>
            </div>

            {/* Fila Destino */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Destino
                </p>
                <p className="text-sm font-semibold text-slate-700 truncate">
                  {order?.customerAddress || 'Dirección no disponible'}
                </p>
              </div>
            </div>

            {/* Fila Tienda (solo si asignado) */}
            {isAssigned && (
              <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50/40">
                <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                  <StoreIcon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Tienda
                  </p>
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {order?.storeName || 'Tienda'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10 shrink-0"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* ── CTA Seguimiento (solo si asignado) ── */}
          {isAssigned && (
            <Button
              onClick={onGoToTracking}
              className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest gap-3 shadow-lg shadow-primary/25 active:scale-[0.98] transition-all text-xs"
            >
              <span>Ir al seguimiento</span>
              <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                <ArrowRight className="h-4 w-4" />
              </div>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
