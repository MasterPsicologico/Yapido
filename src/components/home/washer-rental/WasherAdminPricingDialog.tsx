
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

/**
 * Función Aislada: Ajustes de Precios del Administrador
 * Mandamiento #1: Archivo único.
 * REDISEÑO: "Toque de Oro" - Fondo claro premium con acentos dorados vibrantes.
 */
export function WasherAdminPricingDialog({
  isOpen,
  onOpenChange,
  pricingConfig,
  onUpdatePricing
}: WasherAdminPricingDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="z-[700] rounded-[48px] border-none shadow-[0_20px_80px_rgba(234,179,8,0.2)] p-10 sm:max-w-[480px] bg-[#fffdf5] overflow-hidden">
        
        {/* Decoración Dorada de Fondo */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none" />

        <DialogHeader className="items-center text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-400/20 rounded-3xl animate-ping [animation-duration:3s]" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-[28px] flex items-center justify-center shadow-xl shadow-yellow-500/20 border border-yellow-300">
              <Settings2 className="w-10 h-10 text-white" />
            </div>
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
              AJUSTES <span className="text-yellow-600">MAESTRO</span>
            </DialogTitle>
            <DialogDescription className="text-yellow-700/60 font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-2">
              <Sparkles className="w-3 h-3" /> Control Económico Élite
            </DialogDescription>
          </div>
        </DialogHeader>
        
        <form onSubmit={onUpdatePricing} className="space-y-8 pt-10 relative z-10">
          <div className="grid grid-cols-1 gap-8">
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 ml-4">
                <TrendingUp className="w-3.5 h-3.5 text-yellow-600" />
                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Umbral Mínimo (Horas)</Label>
              </div>
              <div className="relative">
                <Input 
                  name="minHours" 
                  type="number" 
                  defaultValue={pricingConfig?.minHours || 5} 
                  className="h-16 rounded-[24px] bg-white border-2 border-yellow-100 text-slate-900 font-black text-2xl px-8 shadow-sm focus:border-yellow-500 focus:ring-yellow-500/10 transition-all" 
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-yellow-600 uppercase">hrs</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 ml-4">
                <Wallet className="w-3.5 h-3.5 text-yellow-600" />
                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Tarifa por Hora (COP)</Label>
              </div>
              <div className="relative">
                <Input 
                  name="basePrice" 
                  type="number" 
                  defaultValue={pricingConfig?.basePrice || 3000} 
                  className="h-16 rounded-[24px] bg-white border-2 border-yellow-100 text-slate-900 font-black text-2xl px-8 shadow-sm focus:border-yellow-500 focus:ring-yellow-500/10 transition-all" 
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-yellow-600 uppercase">cop</span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full h-20 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-black uppercase text-base tracking-[0.2em] shadow-[0_15px_40px_-10px_rgba(234,179,8,0.5)] transition-all active:scale-95 rounded-[32px] gap-3 border-b-8 border-yellow-700 active:border-b-0 active:translate-y-2">
              SINCRONIZAR ECONOMÍA <Sparkles className="w-5 h-5 fill-white" />
            </Button>
          </div>
          
          <p className="text-[8px] text-center text-yellow-700/40 font-black uppercase tracking-[0.5em]">
            MODO ADMINISTRADOR ACTIVO • KERNEL V1.0.4
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
