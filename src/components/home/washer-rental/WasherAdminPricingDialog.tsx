
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Settings2, Sparkles, Wallet, Zap, ArrowUpCircle, CheckCircle2, RotateCcw, AlertTriangle, ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import Image from 'next/image';
import { cn } from '@/lib/utils';

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
  const firestore = useFirestore();
  const previewsRef = useMemoFirebase(() => doc(firestore, 'appConfig', 'washer_previews'), [firestore]);
  const { data: previews } = useDoc(previewsRef);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="z-[700] rounded-[40px] border-none shadow-2xl p-0 bg-white overflow-hidden max-w-[450px] flex flex-col max-h-[95vh]">
        <DialogHeader className="p-8 bg-slate-900 text-white shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-white/10">
              <Settings2 className="w-6 h-6 text-primary animate-spin-slow" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter leading-none">Ajustes Maestro</DialogTitle>
              <DialogDescription className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.3em] mt-1">Control Económico del Sistema</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={onUpdatePricing} className="flex-1 overflow-y-auto no-scrollbar">
          <div className="p-8 space-y-10">
            {/* SECCIÓN 1: TIEMPOS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Settings2 className="w-3 h-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Configuración Base</span>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 ml-2">Umbral Mínimo (Horas de alquiler)</Label>
                <Input name="minHours" type="number" defaultValue={pricingConfig?.minHours || 5} className="h-14 rounded-2xl bg-slate-50 border-none font-black text-xl px-6 focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>

            {/* SECCIÓN 2: TARIFAS POR EQUIPO */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Zap className="w-3 h-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Tarifas por Equipo (Por Hora)</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3 p-4 rounded-3xl bg-slate-50 border border-slate-100">
                  <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-white shadow-inner mb-3">
                    {previews?.automatica ? <Image src={previews.automatica} alt="Auto" fill className="object-cover" /> : <div className="flex items-center justify-center h-full text-slate-200"><ImageIcon className="w-6 h-6" /></div>}
                  </div>
                  <Label className="text-[9px] font-black uppercase text-slate-400 block text-center">Automática</Label>
                  <Input name="rateAuto" type="number" defaultValue={pricingConfig?.rateAuto || 3500} className="h-10 rounded-xl bg-white border-none font-black text-center" />
                </div>

                <div className="space-y-3 p-4 rounded-3xl bg-slate-50 border border-slate-100">
                  <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-white shadow-inner mb-3">
                    {previews?.semiautomatica ? <Image src={previews.semiautomatica} alt="Semi" fill className="object-cover" /> : <div className="flex items-center justify-center h-full text-slate-200"><ImageIcon className="w-6 h-6" /></div>}
                  </div>
                  <Label className="text-[9px] font-black uppercase text-slate-400 block text-center">Semiautomática</Label>
                  <Input name="rateSemi" type="number" defaultValue={pricingConfig?.rateSemi || 3000} className="h-10 rounded-xl bg-white border-none font-black text-center" />
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: RECARGOS LOGÍSTICOS */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <ArrowUpCircle className="w-3 h-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Recargos y Servicios</span>
              </div>

              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary shadow-sm"><ArrowUpCircle className="w-4 h-4" /></div>
                    <span className="text-[10px] font-black uppercase">Por Piso Extra</span>
                  </div>
                  <Input name="floorFee" type="number" defaultValue={pricingConfig?.floorFee || 2000} className="w-24 h-10 rounded-xl bg-white border-none font-black text-right" />
                </div>

                <div className="flex flex-col gap-2 p-4 rounded-2xl bg-slate-50 border border-amber-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-amber-500 shadow-sm"><AlertTriangle className="w-4 h-4" /></div>
                      <span className="text-[10px] font-black uppercase">Escalas (Por Tramo)</span>
                    </div>
                    <Input name="stairsFee" type="number" defaultValue={pricingConfig?.stairsFee || 5000} className="w-24 h-10 rounded-xl bg-white border-none font-black text-right" />
                  </div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase italic ml-11">Este valor se multiplicará por el número de escalas</p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-green-500 shadow-sm"><CheckCircle2 className="w-4 h-4" /></div>
                    <span className="text-[10px] font-black uppercase">Instalación</span>
                  </div>
                  <Input name="installFee" type="number" defaultValue={pricingConfig?.installFee || 10000} className="w-24 h-10 rounded-xl bg-white border-none font-black text-right" />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-blue-500 shadow-sm"><RotateCcw className="w-4 h-4" /></div>
                    <span className="text-[10px] font-black uppercase">Ida y Vuelta</span>
                  </div>
                  <Input name="roundTripFee" type="number" defaultValue={pricingConfig?.roundTripFee || 5000} className="w-24 h-10 rounded-xl bg-white border-none font-black text-right" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-slate-50 border-t sticky bottom-0">
            <Button type="submit" className="w-full h-16 rounded-[24px] bg-primary text-white font-black uppercase text-sm tracking-widest gap-3 shadow-xl shadow-primary/20 active:scale-95 transition-all">
              SINCRONIZAR ECONOMÍA <Sparkles className="w-5 h-5 text-yellow-400" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
