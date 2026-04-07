
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Truck, Store as StoreIcon, MessageCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusIdentityCardProps {
  order: any;
  isAssigned: boolean;
  onGoToTracking: () => void;
}

/**
 * StatusIdentityCard - El núcleo informativo que describe el estado del equipo.
 */
export function StatusIdentityCard({ order, isAssigned, onGoToTracking }: StatusIdentityCardProps) {
  return (
    <section className="animate-in slide-in-from-bottom-4 duration-700">
      <Card className={cn(
        "border-none rounded-[48px] shadow-2xl overflow-hidden ring-1",
        isAssigned ? "bg-slate-900 text-white ring-green-500/20" : "bg-white ring-black/[0.03]"
      )}>
        <CardContent className="p-10 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-colors",
                isAssigned ? "bg-green-500 text-white" : "bg-primary/10 text-primary"
              )}>
                {isAssigned ? <Truck className="w-8 h-8" /> : <Package className="w-8 h-8 animate-bounce" />}
              </div>
              <div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-none">
                  {isAssigned ? "¡PEDIDO EN RUTA!" : "PROCESO DE ALISTAMIENTO"}
                </h3>
                <p className={cn("text-[10px] font-bold uppercase tracking-widest mt-2", isAssigned ? "text-green-400" : "text-slate-400")}>
                  {isAssigned ? "TU CONTRATO HA SIDO FORMALIZADO" : "DESPACHANDO TU LAVADORA ÉLITE"}
                </p>
              </div>
            </div>
            {isAssigned && <Badge className="bg-green-500 text-white animate-pulse border-none">ACTIVO</Badge>}
          </div>

          <div className={cn("p-6 rounded-[32px] border-2 border-dashed space-y-4", isAssigned ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-100")}>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase text-slate-400">Equipo</span>
              <span className="font-black uppercase italic text-sm">{order?.washerType || 'Lavadora'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase text-slate-400">Destino</span>
              <span className="font-bold text-sm truncate max-w-[180px]">{order?.customerAddress}</span>
            </div>
            {isAssigned && (
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center"><StoreIcon className="w-4 h-4 text-primary" /></div>
                  <span className="font-black text-sm uppercase italic">{order?.storeName}</span>
                </div>
                <Button variant="ghost" size="icon" className="text-primary hover:bg-white/5"><MessageCircle className="w-5 h-5" /></Button>
              </div>
            )}
          </div>

          {isAssigned && (
            <Button onClick={onGoToTracking} className="w-full h-16 rounded-[24px] bg-primary text-white font-black uppercase tracking-widest gap-3 shadow-xl active:scale-95 transition-all">
              IR AL PANEL DE SEGUIMIENTO <ArrowRight className="w-5 h-5" />
            </Button>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
