
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Store as StoreIcon, X, Loader2, Zap, MapPinned, Box, Sparkles, CheckCircle2, ShieldCheck, Clock, Moon, Settings, ArrowRight } from 'lucide-react';
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

/**
 * WasherStoreCreationDialog - Terminal de Activación de Negocio Élite.
 * REDISEÑO TOTAL: Estética Industrial + Glassmorphism + Neon Pulse.
 */
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
      <DialogContent className="max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 rounded-none border-none shadow-none bg-[#050505] p-0 overflow-hidden flex flex-col z-[650] [&>button:last-child]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Inscribir Alquiler Élite</DialogTitle>
          <DialogDescription>Terminal de registro para flotas logísticas de alta gama.</DialogDescription>
        </DialogHeader>
        
        {/* HEADER CINEMÁTICO */}
        <div className="h-24 bg-slate-900 flex items-center justify-between px-8 shrink-0 relative overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 animate-pulse [animation-duration:4s]" />
          <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-shimmer pointer-events-none opacity-30" />

          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-[20px] bg-[#0a0a0a] flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              <StoreIcon className="w-7 h-7 text-primary animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-white font-black uppercase italic tracking-tighter text-2xl leading-none">Mi Alquiler</h3>
              <p className="text-primary/60 text-[9px] font-black uppercase tracking-[0.4em] flex items-center gap-2">
                <ShieldCheck className="w-2.5 h-2.5" /> REGISTRO DE NEGOCIO ÉLITE
              </p>
            </div>
          </div>

          <button 
            onClick={() => onOpenChange(false)} 
            className="relative z-10 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90 group"
          >
            <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* CUERPO DEL FORMULARIO CON ESTÉTICA OBSIDIANA */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-[#050505] p-6">
          <div className="max-w-md mx-auto py-10 space-y-14">
            
            {/* TÍTULO DE IMPACTO */}
            <div className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="inline-block px-4 py-1 bg-primary/10 rounded-full border border-primary/20 mb-2">
                <span className="text-[8px] font-black text-primary uppercase tracking-[0.4em]">Protocolo de Lanzamiento</span>
              </div>
              <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-[0.85]">
                INSCRIBIR MI <br /> <span className="text-primary">ALQUILER</span>
              </h2>
              <div className="flex flex-col items-center gap-2 pt-2">
                 <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Configura tu flota y domina el mercado local</p>
                 <div className="h-0.5 w-12 bg-primary/20 rounded-full" />
              </div>
            </div>

            <form onSubmit={onCreateStore} className="space-y-12 pb-24">
              
              {/* SECCIÓN 1: IDENTIDAD DIGITAL */}
              <div className="space-y-8 animate-in slide-in-from-left-4 duration-700 delay-100">
                <div className="flex items-center gap-3 ml-2">
                  <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(59,130,246,1)]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Identidad Comercial</span>
                </div>
                
                <div className="grid gap-6">
                  <div className="space-y-3 group">
                    <Label className="text-[9px] font-black uppercase text-slate-500 ml-4 tracking-widest group-focus-within:text-primary transition-colors">Nombre de la Vitrina</Label>
                    <div className="relative">
                       <Input 
                        name="name" 
                        placeholder="Ej: Lavadoras El Morrocoy" 
                        className="h-16 rounded-[24px] bg-slate-900/50 border-2 border-white/5 text-white font-black text-lg px-8 focus:border-primary/50 focus:bg-slate-900 transition-all placeholder:text-slate-700" 
                        required 
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20"><StoreIcon className="w-5 h-5 text-white" /></div>
                    </div>
                  </div>

                  <div className="space-y-3 group">
                    <Label className="text-[9px] font-black uppercase text-slate-500 ml-4 tracking-widest group-focus-within:text-primary transition-colors">WhatsApp Comercial</Label>
                    <div className="relative">
                      <Input 
                        name="phone" 
                        defaultValue={profile?.phoneNumber || ''} 
                        placeholder="300 000 0000" 
                        className="h-16 rounded-[24px] bg-slate-900/50 border-2 border-white/5 text-white font-black text-lg px-8 focus:border-primary/50 transition-all placeholder:text-slate-700" 
                        required 
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-green-500/30"><Zap className="w-5 h-5 fill-current" /></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: INVENTARIO TÉCNICO (GLASSMOPHISM) */}
              <div className="relative p-8 rounded-[48px] bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl space-y-10 overflow-hidden group/fleet animate-in slide-in-from-right-4 duration-700 delay-200">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover/fleet:bg-primary/20 transition-colors duration-1000" />
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner border border-primary/20">
                    <Zap className="w-6 h-6 fill-current" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-black text-sm uppercase tracking-widest italic text-white">Configuración de Flota</h3>
                    <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">Hardware Activo</p>
                  </div>
                </div>

                <div className="grid gap-4 relative z-10">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center px-4 leading-relaxed">
                    Marca los equipos que integran tu inventario real:
                  </p>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <button 
                      type="button"
                      onClick={() => setHasAuto(!hasAuto)}
                      className={cn(
                        "flex items-center justify-between p-6 rounded-[28px] border-2 transition-all duration-500 group/btn active:scale-[0.98]",
                        hasAuto 
                          ? "bg-primary border-primary text-white shadow-[0_0_30px_rgba(59,130,246,0.3)] scale-[1.02]" 
                          : "bg-white/5 border-white/5 text-slate-500 hover:border-white/10"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("w-2 h-2 rounded-full", hasAuto ? "bg-white animate-pulse" : "bg-slate-700")} />
                        <span className="font-black text-sm uppercase italic tracking-tighter">Automáticas</span>
                      </div>
                      {hasAuto && <CheckCircle2 className="w-6 h-6 text-white animate-in zoom-in" />}
                    </button>
                    <input type="hidden" name="hasAutomatic" value={hasAuto ? "true" : "false"} />

                    <button 
                      type="button"
                      onClick={() => setHasSemi(!hasSemi)}
                      className={cn(
                        "flex items-center justify-between p-6 rounded-[28px] border-2 transition-all duration-500 group/btn active:scale-[0.98]",
                        hasSemi 
                          ? "bg-primary border-primary text-white shadow-[0_0_30px_rgba(59,130,246,0.3)] scale-[1.02]" 
                          : "bg-white/5 border-white/5 text-slate-500 hover:border-white/10"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("w-2 h-2 rounded-full", hasSemi ? "bg-white animate-pulse" : "bg-slate-700")} />
                        <span className="font-black text-sm uppercase italic tracking-tighter">Semiautomáticas</span>
                      </div>
                      {hasSemi && <CheckCircle2 className="w-6 h-6 text-white animate-in zoom-in" />}
                    </button>
                    <input type="hidden" name="hasSemiautomatic" value={hasSemi ? "true" : "false"} />
                  </div>
                </div>

                <div className="space-y-3 relative z-10 pt-4 border-t border-white/5">
                  <Label className="text-[10px] font-black uppercase text-slate-500 ml-4 flex items-center gap-2">
                    <Box className="w-3.5 h-3.5 text-primary" /> Total Máquinas Disponibles
                  </Label>
                  <Input 
                    name="totalUnits" 
                    type="number" 
                    placeholder="Ej: 12" 
                    className="h-16 rounded-[24px] bg-white/5 border-none text-white font-black text-center text-3xl focus:bg-white/10 transition-all placeholder:text-slate-800" 
                    required 
                  />
                </div>
              </div>

              {/* SECCIÓN 3: LOGÍSTICA URBANA */}
              <div className="space-y-8 animate-in slide-in-from-left-4 duration-700 delay-300">
                <div className="flex items-center gap-3 ml-2">
                  <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_10px_rgba(0,201,219,1)]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Radio de Operación</span>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3 group">
                    <Label className="text-[9px] font-black uppercase text-slate-500 ml-4 tracking-widest group-focus-within:text-secondary transition-colors">Barrios / Sectores de Cobertura</Label>
                    <div className="relative">
                      <textarea 
                        name="coverageSectors" 
                        placeholder="Ej: El Centro, Oasis, Sabanita, San Roque..." 
                        className="w-full min-h-[120px] p-6 rounded-[32px] bg-slate-900/50 border-2 border-white/5 text-white font-bold text-sm focus:border-secondary/50 focus:bg-slate-900 outline-none resize-none transition-all placeholder:text-slate-700"
                        required
                      />
                      <MapPinned className="absolute right-6 bottom-6 w-5 h-5 text-secondary/30" />
                    </div>
                  </div>
                  
                  <div className="space-y-3 group">
                    <Label className="text-[9px] font-black uppercase text-slate-500 ml-4 tracking-widest group-focus-within:text-secondary transition-colors">Dirección Base (Bodega)</Label>
                    <Input 
                      name="address" 
                      placeholder="Ej: Calle 5 # 10-20" 
                      className="h-16 rounded-[24px] bg-slate-900/50 border-2 border-white/5 text-white font-bold px-8 focus:border-secondary/50 transition-all placeholder:text-slate-700" 
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 4: TERMINAL HORARIA (NEON STYLE) */}
              <div className="grid grid-cols-2 gap-4 p-8 rounded-[40px] bg-slate-900/80 border-b-8 border-black shadow-2xl relative overflow-hidden animate-in zoom-in duration-700 delay-400">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 ml-4">
                    <Clock className="w-3 h-3 text-primary animate-pulse" />
                    <Label className="text-[9px] font-black uppercase text-primary tracking-widest">Apertura</Label>
                  </div>
                  <Input name="openTime" type="time" defaultValue="08:00" className="h-14 rounded-2xl bg-white/5 border-2 border-white/5 text-white font-black text-center text-xl focus:border-primary/30 transition-all" required />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 ml-4">
                    <Moon className="w-3 h-3 text-secondary animate-pulse" />
                    <Label className="text-[9px] font-black uppercase text-secondary tracking-widest">Cierre</Label>
                  </div>
                  <Input name="closeTime" type="time" defaultValue="20:00" className="h-14 rounded-2xl bg-white/5 border-2 border-white/5 text-white font-black text-center text-xl focus:border-secondary/30 transition-all" required />
                </div>
              </div>

              {/* ACCIÓN MAESTRA - EL CORAZÓN DE LA FUSIÓN */}
              <div className="pt-10 space-y-8 animate-in slide-in-from-bottom-6 duration-1000 delay-500">
                <div className="relative group/submit">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-[40px] blur opacity-25 group-hover/submit:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />
                  
                  <Button 
                    type="submit" 
                    disabled={isSending || (!hasAuto && !hasSemi)} 
                    className={cn(
                      "relative w-full h-24 rounded-[40px] font-black text-2xl uppercase italic tracking-tighter gap-5 overflow-hidden transition-all duration-300",
                      (isSending || (!hasAuto && !hasSemi)) 
                        ? "bg-slate-800 text-slate-500 border-none cursor-not-allowed" 
                        : "bg-primary text-white border-b-[10px] border-blue-900 hover:border-b-[6px] hover:translate-y-[4px] active:border-b-0 active:translate-y-[10px] shadow-[0_20px_50px_rgba(59,130,246,0.3)]"
                    )}
                  >
                    {/* EFECTO DE BARRIDO DE LUZ (REACCIÓN QUÍMICA) */}
                    <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
                      <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white to-transparent skew-x-12 animate-shimmer" />
                    </div>

                    <div className="relative z-10 flex items-center gap-4">
                      {isSending ? (
                        <>
                          <Loader2 className="w-10 h-10 animate-spin" />
                          <span className="animate-pulse">SINCRONIZANDO...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-8 h-8 text-yellow-400 group-hover/submit:rotate-12 transition-transform" /> 
                          <span>LANZAR MI VITRINA</span>
                          <ArrowRight className="w-7 h-7 group-hover/submit:translate-x-2 transition-transform" />
                        </>
                      )}
                    </div>
                  </Button>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-3 opacity-30">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] text-white">Vitriniando AI Central • Kernel v1.0.4</p>
                  </div>
                  <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* BARRA DE ESTADO INFERIOR TÁCTICA */}
        <div className="h-10 bg-[#0a0a0a] border-t border-white/5 flex items-center justify-center px-8 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
             <span className="text-[7px] font-black text-slate-600 uppercase tracking-[0.4em]">Protocolo de Seguridad Aguachica Digital Activo</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
