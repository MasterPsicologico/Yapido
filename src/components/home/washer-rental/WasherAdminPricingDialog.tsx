
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Settings2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface WasherAdminPricingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  pricingConfig: any;
  onUpdatePricing: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

/**
 * Función Aislada: Ajustes de Precios del Administrador
 * Mandamiento #1: Archivo único con z-index superior para evitar solapamiento.
 */
export function WasherAdminPricingDialog({
  isOpen,
  onOpenChange,
  pricingConfig,
  onUpdatePricing
}: WasherAdminPricingDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="z-[700] rounded-[40px] border-none shadow-2xl p-8 sm:max-w-[450px] bg-slate-900 text-white">
        <DialogHeader className="items-center text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-2">
            <Settings2 className="w-10 h-10 text-primary" />
          </div>
          <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter">Ajustes Maestro</DialogTitle>
          <DialogDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">
            Configuración Global de Operación
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={onUpdatePricing} className="space-y-6 pt-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Mínimo de Horas</Label>
              <Input 
                name="minHours" 
                type="number" 
                defaultValue={pricingConfig?.minHours || 5} 
                className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-black text-xl px-6" 
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Valor por Hora (COP)</Label>
              <Input 
                name="basePrice" 
                type="number" 
                defaultValue={pricingConfig?.basePrice || 3000} 
                className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-black text-xl px-6" 
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black uppercase text-sm tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95">
            SINCRONIZAR PRECIOS
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
