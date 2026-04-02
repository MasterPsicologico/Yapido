
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Settings2, Sparkles, TrendingUp, Wallet } from 'lucide-react';
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
      <DialogContent className="z-[700] rounded-[40px] border-none shadow-2xl p-6 sm:max-w-[420px] bg-[#fffdf5] overflow-hidden max-h-[92vh] flex flex-col">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />

        <DialogHeader className="items-center text-center space-y-2 shrink-0">
          <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg border border-yellow-300">
            <Settings2 className="w-7 h-7 text-white" />
          </div>
          <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
            AJUSTES <span className="text-yellow-600">MAESTRO</span>
          </DialogTitle>
          <DialogDescription className="text-yellow-700/60 font-black text-[9px] uppercase tracking-[0.3em]">CONTROL ECONÓMICO ÉLITE</DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto no-scrollbar mt-6 pr-1">
          <form onSubmit={onUpdatePricing} className="space-y-6 pb-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-4">Umbral Mínimo (Horas)</Label>
              <Input name="minHours" type="number" defaultValue={pricingConfig?.minHours || 5} className="h-14 rounded-2xl bg-white border-2 border-yellow-100 text-slate-900 font-black text-xl px-6 focus:border-yellow-500 transition-all" />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-4">Tarifa por Hora (COP)</Label>
              <Input name="basePrice" type="number" defaultValue={pricingConfig?.basePrice || 3000} className="h-14 rounded-2xl bg-white border-2 border-yellow-100 text-slate-900 font-black text-xl px-6 focus:border-yellow-500 transition-all" />
            </div>

            <Button type="submit" className="w-full h-16 bg-yellow-500 hover:bg-yellow-600 text-white font-black uppercase text-sm tracking-widest rounded-[24px] shadow-lg border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1 transition-all">
              SINCRONIZAR ECONOMÍA <Sparkles className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
