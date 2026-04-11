"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Store as StoreIcon, X, Loader2, Zap, MapPinned, Box, Sparkles, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WasherStoreCreationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  profile: any;
  isSending: boolean;
  onCreateStore: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export function WasherStoreCreationDialog({
  isOpen,
  onOpenChange,
  profile,
  isSending,
  onCreateStore
}: WasherStoreCreationDialogProps) {
  const [hasAuto, setHasAuto] = useState(true);
  const [hasSemi, setHasSemi] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 rounded-none border-none shadow-none bg-white p-0 overflow-hidden flex flex-col z-[650] [&>button:last-child]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Inscribir Alquiler</DialogTitle>
          <DialogDescription>Formulario de registro para flota de lavadoras con especialización técnica.</DialogDescription>
        </DialogHeader>
        
        <div className="h-20 bg-slate-900 flex items-center justify-between px-6 shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-green-500/10 animate-pulse" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30 shadow-lg shadow-green-500/10">
              <StoreIcon className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h3 className="text-white font-black uppercase italic tracking-tighter text-xl leading-none">Mi Alquiler</h3>
              <p className="text-green-500/60 text-[9px] font-black uppercase tracking-[0.3em] mt-1">Registro de Negocio Élite</p>
            </div>
          </div>
          <button 
            onClick={() => onOpenChange(false)} 
            className="relative z-10 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all active:scale-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 bg-[#f8fafc]">
          <div className="max-w-md mx-auto py-10 space-y-12">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Inscribir mi Alquiler</h2>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Configura tu inventario y domina el sector</p>
            </div>

            <form onSubmit={onCreateStore} className="space-y-10">
              {/* SECCIÓN 1: IDENTIDAD */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 ml-2">
                  <div className="w-1.5 h-4 bg-primary rounded-full" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Identidad Comercial</span>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 ml-4">Nombre de la Vitrina</Label>
                    <Input name="name" placeholder="Ej: Lavadoras El Morrocoy" className="h-16 rounded-[24px] bg-white border-none shadow-sm font-black text-lg px-8 focus:ring-4 focus:ring-primary/5 transition-all" required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 ml-4">WhatsApp Comercial</Label>
                    <Input name="phone" defaultValue={profile?.phoneNumber || ''} placeholder="300 000 0000" className="h-16 rounded-[24px] bg-white border-none shadow-sm font-black text-lg px-8" required />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: INVENTARIO ESPECIALIZADO */}
              <div className="bg-white p-8 rounded-[40px] shadow-xl ring-1 ring-black/[0.02] space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12" />
                
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-9 h-9 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Zap className="w-5 h-5 fill-current" />
                  </div>
                  <h3 className="font-black text-xs uppercase tracking-widest italic text-slate-900">Configuración de Flota</h3>
                </div>

                <div className="grid gap-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center px-4">
                    Marca los equipos que manejas en tu inventario real:
                  </p>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      type="button"
                      onClick={() => setHasAuto(!hasAuto)}
                      className={cn(
                        "flex items-center justify-between p-5 rounded-[24px] border-2 transition-all group",
                        hasAuto ? "bg-slate-900 border-slate-900 text-white shadow-xl scale-[1.02]" : "bg-slate-50 border-transparent text-slate-400"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-black text-sm uppercase italic tracking-tighter">Lavadoras Automáticas</span>
                      </div>
                      {hasAuto && <CheckCircle2 className="w-5 h-5 text-primary animate-in zoom-in" />}
                    </button>
                    <input type="hidden" name="hasAutomatic" value={hasAuto ? "true" : "false"} />

                    <button 
                      type="button"
                      onClick={() => setHasSemi(!hasSemi)}
                      className={cn(
                        "flex items-center justify-between p-5 rounded-[24px] border-2 transition-all group",
                        hasSemi ? "bg-slate-900 border-slate-900 text-white shadow-xl scale-[1.02]" : "bg-slate-50 border-transparent text-slate-400"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-black text-sm uppercase italic tracking-tighter">Lavadoras Semiautomáticas</span>
                      </div>
                      {hasSemi && <CheckCircle2 className="w-5 h-5 text-primary animate-in zoom-in" />}
                    </button>
                    <input type="hidden" name="hasSemiautomatic" value={hasSemi ? "true" : "false"} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500 ml-4 flex items-center gap-2">
                    <Box className="w-3 h-3 text-primary" /> Total Máquinas en Flota
                  </Label>
                  <Input name="totalUnits" type="number" placeholder="Ej: 12" className="h-14 rounded-2xl bg-slate-50 border-none font-black text-center text-xl" required />
                </div>
              </div>

              {/* SECCIÓN 3: LOGÍSTICA DE BARRIO */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 ml-2">
                  <div className="w-1.5 h-4 bg-secondary rounded-full" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Radio de Operación</span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 ml-4">Barrios / Sectores de Cobertura</Label>
                    <textarea 
                      name="coverageSectors" 
                      placeholder="Ej: El Centro, Oasis, Sabanita, San Roque..." 
                      className="w-full min-h-[100px] p-6 rounded-[32px] bg-white border-none shadow-sm font-bold text-sm text-slate-700 focus:ring-4 focus:ring-secondary/5 outline-none resize-none transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500 ml-4">Dirección Base (Bodega)</Label>
                    <Input name="address" placeholder="Ej: Calle 5 # 10-20" className="h-16 rounded-[24px] bg-white border-none shadow-sm font-bold px-8" required />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 4: HORARIO OPERATIVO */}
              <div className="grid grid-cols-2 gap-4 bg-slate-900 p-6 rounded-[32px] shadow-2xl border-b-4 border-black">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-primary tracking-widest ml-4">Apertura</Label>
                  <Input name="openTime" type="time" defaultValue="08:00" className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-black text-center" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-primary tracking-widest ml-4">Cierre</Label>
                  <Input name="closeTime" type="time" defaultValue="20:00" className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-black text-center" required />
                </div>
              </div>

              {/* ACCIÓN MAESTRA */}
              <div className="pt-4 space-y-6">
                <Button 
                  type="submit" 
                  disabled={isSending || (!hasAuto && !hasSemi)} 
                  className="w-full h-24 rounded-[40px] bg-primary text-white font-black text-2xl uppercase italic tracking-tighter shadow-[0_20px_50px_rgba(59,130,246,0.3)] gap-4 border-b-[10px] border-blue-800 active:border-b-0 active:translate-y-2 transition-all group"
                >
                  {isSending ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                    <>
                      <Sparkles className="w-8 h-8 text-yellow-400 group-hover:rotate-12 transition-transform" /> 
                      LANZAR MI VITRINA
                    </>
                  )}
                </Button>
                <div className="flex flex-col items-center gap-2 opacity-40">
                  <p className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-400">SISTEMA DE ALTA VELOCIDAD • VITRINIANDO AI</p>
                  <div className="h-0.5 w-12 bg-slate-200 rounded-full" />
                </div>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}