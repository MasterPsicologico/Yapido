
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Settings2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface WasherAdminPricingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  pricingConfig: any;
  onUpdatePricing: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export function WasherAdminPricingDialog({
  isOpen,
  onOpenChange,
  pricingConfig,
  onUpdatePricing
}: WasherAdminPricingDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[40px] border-none shadow-2xl p-8 sm:max-w-[450px] bg-slate-900 text-white">
        <DialogHeader className="items-center text-center">
          <Settings2 className="w-12 h-12 text-primary mb-2" />
          <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Ajustes Maestro</DialogTitle>
          <DialogDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Configuración Global de Precios</DialogDescription>
        </DialogHeader>
        <form onSubmit={onUpdatePricing} className="space-y-6 pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[9px] uppercase tracking-widest text-slate-400">Min. Horas</Label>
              <Input name="minHours" type="number" defaultValue={pricingConfig?.minHours || 5} className="bg-white/5 border-none h-12 font-bold" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] uppercase tracking-widest text-slate-400">VALOR HORA BASE</Label>
              <Input name="basePrice" type="number" defaultValue={pricingConfig?.basePrice || 3000} className="bg-white/5 border-none h-12 font-bold" />
            </div>
          </div>
          <Button type="submit" className="w-full h-14 bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl">ACTUALIZAR SISTEMA</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
