
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Store as StoreIcon, X, Loader2, Zap, MapPinned, Box, Sparkles, CheckCircle2, ShieldCheck, Clock, Moon, Settings, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CitySelector } from './solicitation/components/identity/CitySelector';
import { ZoneSelector } from './solicitation/components/identity/ZoneSelector';
import { useCityConfig } from '@/hooks/use-city-config';
import { ImageIcon } from 'lucide-react';
import { compressImage } from '@/lib/image-compression';
import Image from 'next/image';

interface WasherStoreCreationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  profile: any;
  isSending: boolean;
  onCreateStore: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

/**
 * WasherStoreCreationDialog - Terminal de Activación de Negocio Élite.
 * TEMA: ROYAL IVORY & LIQUID GOLD (Oro y Marfil)
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
  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const { cityConfig, activeCities, activeZones, hasMultipleZones } = useCityConfig({
    overrideCityId: selectedCityId || undefined,
    overrideZoneId: selectedZoneId || undefined,
    profile,
  });

  // Pre-fill from profile when opening
  useState(() => {
    if (profile) {
      if (profile.cityId) setSelectedCityId(profile.cityId);
      if (profile.zoneId) setSelectedZoneId(profile.zoneId);
    }
  });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const base64 = await compressImage(file, 800, 600, 0.8);
        setPreviewImage(base64);
      } catch (error) {
        console.error("Error compressing image:", error);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 rounded-none border-none shadow-none bg-[#fffdfa] p-0 overflow-hidden flex flex-col z-[650] animate-in slide-in-from-bottom duration-500 [&>button:last-child]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Inscribir Negocio Élite</DialogTitle>
          <DialogDescription>Terminal de registro para comercios asociados a Yapido.</DialogDescription>
        </DialogHeader>
        
        {/* HEADER DORADO SUPREMO */}
        <div className="h-28 bg-slate-950 flex items-center justify-between px-8 shrink-0 relative overflow-hidden border-b-4 border-yellow-600/30">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-transparent to-yellow-500/10 animate-pulse [animation-duration:4s]" />
          <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-shimmer pointer-events-none opacity-30" />

          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 rounded-[20px] bg-slate-900 flex items-center justify-center border border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.3)]">
              <StoreIcon className="w-7 h-7 text-yellow-500 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-white font-black uppercase italic tracking-tighter text-2xl leading-none">Mi Negocio</h3>
              <p className="text-yellow-500/60 text-[9px] font-black uppercase tracking-[0.4em] flex items-center gap-2">
                <ShieldCheck className="w-2.5 h-2.5" /> COMERCIO VERIFICADO
              </p>
            </div>
          </div>

          <button 
            onClick={() => onOpenChange(false)} 
            className="relative z-10 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/40 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90 group"
          >
            <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* CUERPO MARFIL CON DEGRADADO DE LUZ */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-gradient-to-b from-[#fffdfa] to-white p-6">
          <div className="max-w-md mx-auto py-10 space-y-14">
            
            {/* TÍTULO DE IMPACTO ÉLITE */}
            <div className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
              <div className="inline-block px-4 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/20 mb-2">
                <span className="text-[8px] font-black text-yellow-700 uppercase tracking-[0.4em]">Inscripción de Negocio</span>
              </div>
              <h2 className="text-5xl font-black italic uppercase tracking-tighter text-slate-900 leading-[0.85] drop-shadow-sm">
                INSCRIBIR MI <br /> <span className="text-yellow-600">NEGOCIO</span>
              </h2>
              <div className="flex flex-col items-center gap-2 pt-2">
                 <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Únete a la plataforma multinegocios líder</p>
                 <div className="h-0.5 w-12 bg-yellow-500/30 rounded-full" />
              </div>
            </div>

            <form onSubmit={onCreateStore} className="space-y-12 pb-24">
              
              {/* SECCIÓN 1: IDENTIDAD COMERCIAL (MARFIL) */}
              <div className="space-y-8 animate-in slide-in-from-left-4 duration-700 delay-100">
                <div className="flex items-center gap-3 ml-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,1)]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Identidad Digital</span>
                </div>
                
                <div className="grid gap-6">
                  <div className="space-y-3 group">
                    <Label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-widest group-focus-within:text-yellow-600 transition-colors">Nombre del Negocio</Label>
                    <div className="relative">
                       <Input 
                        name="name" 
                        placeholder="Ej: Tienda Central, Servicios Rápidos..." 
                        className="h-16 rounded-[24px] bg-white border-2 border-slate-100 text-slate-900 font-black text-lg px-8 focus:border-yellow-500/50 focus:ring-4 focus:ring-yellow-500/5 transition-all shadow-sm placeholder:text-slate-300" 
                        required 
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20"><StoreIcon className="w-5 h-5 text-slate-400" /></div>
                    </div>
                  </div>

                  <div className="space-y-3 group">
                    <Label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-widest group-focus-within:text-yellow-600 transition-colors">WhatsApp de Negocios</Label>
                    <div className="relative">
                      <Input 
                        name="phone" 
                        defaultValue={profile?.phoneNumber || ''} 
                        placeholder="300 000 0000" 
                        className="h-16 rounded-[24px] bg-white border-2 border-slate-100 text-slate-900 font-black text-lg px-8 focus:border-yellow-500/50 focus:ring-4 focus:ring-yellow-500/5 transition-all shadow-sm placeholder:text-slate-300" 
                        required 
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-green-500/30"><Zap className="w-5 h-5 fill-current" /></div>
                    </div>
                  </div>

                  <div className="space-y-3 group">
                    <Label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-widest group-focus-within:text-yellow-600 transition-colors">Foto de Portada del Negocio</Label>
                    <div 
                      className={cn(
                        "relative h-48 rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all",
                        previewImage ? "border-yellow-500/50" : "border-slate-200 hover:border-yellow-500/30 hover:bg-yellow-50/10"
                      )}
                      onClick={() => document.getElementById('store-image-input')?.click()}
                    >
                      {previewImage ? (
                        <>
                          <Image src={previewImage} alt="Preview" fill className="object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <p className="text-white font-black text-[10px] uppercase tracking-widest">Cambiar Imagen</p>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                            {isCompressing ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImageIcon className="w-6 h-6" />}
                          </div>
                          <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Subir Imagen Real</p>
                        </div>
                      )}
                      <input 
                        id="store-image-input"
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageChange}
                      />
                      <input type="hidden" name="base64Image" value={previewImage || ''} />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN GEOGRÁFICA (ZONIFICACIÓN) */}
              <div className="space-y-8 animate-in slide-in-from-left-4 duration-700 delay-150">
                <div className="flex items-center gap-3 ml-2">
                  <div className="w-2 h-2 rounded-full bg-slate-900 shadow-[0_0_10px_rgba(0,0,0,0.3)]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Radio de Operación</span>
                </div>

                <div className="space-y-6">
                  <CitySelector 
                    selectedCityId={selectedCityId} 
                    onCityChange={setSelectedCityId} 
                    activeCities={activeCities}
                  />
                  {hasMultipleZones && (
                    <ZoneSelector
                      zones={activeZones}
                      cityConfig={cityConfig}
                      selectedZoneId={selectedZoneId}
                      onZoneChange={setSelectedZoneId}
                    />
                  )}
                  
                  <input type="hidden" name="cityId" value={selectedCityId} />
                  <input type="hidden" name="cityName" value={cityConfig?.name || ''} />
                  <input type="hidden" name="zoneId" value={hasMultipleZones ? selectedZoneId : ''} />
                  <input type="hidden" name="zoneName" value={hasMultipleZones ? (activeZones.find(z => z.id === selectedZoneId)?.name || '') : ''} />
                  
                  <div className="space-y-3 group">
                    <Label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-widest group-focus-within:text-yellow-600 transition-colors">Barrios de Cobertura Específica</Label>
                    <div className="relative">
                      <textarea 
                        name="coverageSectors" 
                        placeholder="Ej: El Centro, Oasis, San Roque..." 
                        className="w-full min-h-[120px] p-6 rounded-[32px] bg-white border-2 border-slate-100 text-slate-800 font-bold text-sm focus:border-yellow-500/50 focus:ring-4 focus:ring-yellow-500/5 outline-none resize-none transition-all placeholder:text-slate-200 shadow-sm"
                        required
                      />
                      <MapPinned className="absolute right-6 bottom-6 w-5 h-5 text-yellow-600/20" />
                    </div>
                  </div>
                  
                  <div className="space-y-3 group">
                    <Label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-widest group-focus-within:text-yellow-600 transition-colors">Dirección Principal</Label>
                    <Input 
                      name="address" 
                      placeholder="Ej: Calle 5 # 10-20" 
                      className="h-16 rounded-[24px] bg-white border-2 border-slate-100 text-slate-800 font-bold px-8 focus:border-yellow-500/50 focus:ring-4 focus:ring-yellow-500/5 transition-all shadow-sm placeholder:text-slate-200" 
                      required 
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: CONFIGURACIÓN INICIAL (ORO Y BLANCO) */}
              <div className="relative p-8 rounded-[48px] bg-white border-2 border-yellow-500/10 shadow-2xl space-y-10 overflow-hidden group/fleet animate-in slide-in-from-right-4 duration-700 delay-200">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover/fleet:bg-yellow-500/10 transition-colors duration-1000" />
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-600 shadow-inner border border-yellow-500/20">
                    <Settings className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-black text-sm uppercase tracking-widest italic text-slate-900">Configuración de Servicios</h3>
                    <p className="text-[8px] font-black text-yellow-600 uppercase tracking-[0.2em]">Disponibilidad Inicial</p>
                  </div>
                </div>

                <div className="grid gap-4 relative z-10">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center px-4 leading-relaxed">
                    Marca tus equipos y define el valor del alquiler por hora:
                  </p>
                  
                  <div className="grid grid-cols-1 gap-6">
                    {/* AUTOMÁTICA */}
                    <div className="space-y-3">
                      <button 
                        type="button"
                        onClick={() => setHasAuto(!hasAuto)}
                        className={cn(
                          "w-full flex items-center justify-between p-6 rounded-[28px] border-2 transition-all duration-500 active:scale-[0.98]",
                          hasAuto 
                            ? "bg-slate-900 border-slate-900 text-white shadow-xl" 
                            : "bg-slate-50 border-slate-50 text-slate-400 hover:border-yellow-500/20 hover:bg-white"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn("w-2 h-2 rounded-full", hasAuto ? "bg-yellow-500 animate-pulse shadow-[0_0_10px_rgba(234,179,8,1)]" : "bg-slate-300")} />
                          <span className="font-black text-sm uppercase italic tracking-tighter">Automáticas</span>
                        </div>
                        {hasAuto && <CheckCircle2 className="w-6 h-6 text-yellow-500 animate-in zoom-in" />}
                      </button>
                      
                      {hasAuto && (
                        <div className="grid grid-cols-2 gap-3 px-2 animate-in slide-in-from-top-2">
                           <div className="space-y-1.5">
                             <Label className="text-[8px] font-black uppercase text-slate-400 ml-2">Precio/Hora</Label>
                             <Input 
                               name="pricePerHourAuto" 
                               type="number" 
                               defaultValue="3500" 
                               className="h-12 rounded-xl bg-slate-50 border-none text-slate-900 font-black text-center" 
                               required={hasAuto}
                             />
                           </div>
                           <div className="space-y-1.5">
                             <Label className="text-[8px] font-black uppercase text-slate-400 ml-2">Mín. Horas</Label>
                             <Input 
                               name="minHoursAuto" 
                               type="number" 
                               defaultValue="5" 
                               className="h-12 rounded-xl bg-slate-50 border-none text-slate-900 font-black text-center" 
                               required={hasAuto}
                             />
                           </div>
                        </div>
                      )}
                      <input type="hidden" name="hasAutomatic" value={hasAuto ? "true" : "false"} />
                    </div>

                    {/* SEMIAUTOMÁTICA */}
                    <div className="space-y-3">
                      <button 
                        type="button"
                        onClick={() => setHasSemi(!hasSemi)}
                        className={cn(
                          "w-full flex items-center justify-between p-6 rounded-[28px] border-2 transition-all duration-500 active:scale-[0.98]",
                          hasSemi 
                            ? "bg-slate-900 border-slate-900 text-white shadow-xl" 
                            : "bg-slate-50 border-slate-50 text-slate-400 hover:border-yellow-500/20 hover:bg-white"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn("w-2 h-2 rounded-full", hasSemi ? "bg-yellow-500 animate-pulse shadow-[0_0_10px_rgba(234,179,8,1)]" : "bg-slate-300")} />
                          <span className="font-black text-sm uppercase italic tracking-tighter">Semiautomáticas</span>
                        </div>
                        {hasSemi && <CheckCircle2 className="w-6 h-6 text-yellow-500 animate-in zoom-in" />}
                      </button>

                      {hasSemi && (
                        <div className="grid grid-cols-2 gap-3 px-2 animate-in slide-in-from-top-2">
                           <div className="space-y-1.5">
                             <Label className="text-[8px] font-black uppercase text-slate-400 ml-2">Precio/Hora</Label>
                             <Input 
                               name="pricePerHourSemi" 
                               type="number" 
                               defaultValue="3000" 
                               className="h-12 rounded-xl bg-slate-50 border-none text-slate-900 font-black text-center" 
                               required={hasSemi}
                             />
                           </div>
                           <div className="space-y-1.5">
                             <Label className="text-[8px] font-black uppercase text-slate-400 ml-2">Mín. Horas</Label>
                             <Input 
                               name="minHoursSemi" 
                               type="number" 
                               defaultValue="5" 
                               className="h-12 rounded-xl bg-slate-50 border-none text-slate-900 font-black text-center" 
                               required={hasSemi}
                             />
                           </div>
                        </div>
                      )}
                      <input type="hidden" name="hasSemiautomatic" value={hasSemi ? "true" : "false"} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 relative z-10 pt-4 border-t border-slate-100">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-4 flex items-center gap-2">
                    <Box className="w-3.5 h-3.5 text-yellow-600" /> Capacidad Total (Unidades)
                  </Label>
                  <Input 
                    name="totalUnits" 
                    type="number" 
                    placeholder="Ej: 12" 
                    className="h-16 rounded-[24px] bg-slate-50 border-none text-slate-900 font-black text-center text-3xl focus:bg-white focus:ring-4 focus:ring-yellow-500/5 transition-all placeholder:text-slate-200" 
                    required 
                  />
                </div>
              </div>



              {/* SECCIÓN 4: TERMINAL HORARIA (IVORY STYLE) */}
              <div className="grid grid-cols-2 gap-4 p-8 rounded-[40px] bg-white border-2 border-yellow-500/10 shadow-xl relative overflow-hidden animate-in zoom-in duration-700 delay-400">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent" />
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 ml-4">
                    <Clock className="w-3 h-3 text-yellow-600 animate-pulse" />
                    <Label className="text-[9px] font-black uppercase text-yellow-700 tracking-widest">Apertura</Label>
                  </div>
                  <Input name="openTime" type="time" defaultValue="08:00" className="h-14 rounded-2xl bg-slate-50 border-none text-slate-900 font-black text-center text-xl focus:ring-4 focus:ring-yellow-500/5 transition-all" required />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 ml-4">
                    <Moon className="w-3 h-3 text-slate-400 animate-pulse" />
                    <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Cierre</Label>
                  </div>
                  <Input name="closeTime" type="time" defaultValue="20:00" className="h-14 rounded-2xl bg-slate-50 border-none text-slate-900 font-black text-center text-xl focus:ring-4 focus:ring-yellow-500/5 transition-all" required />
                </div>
              </div>

              {/* ACCIÓN MAESTRA - EL CORAZÓN DE ORO */}
              <div className="pt-10 space-y-8 animate-in slide-in-from-bottom-6 duration-1000 delay-500">
                <div className="relative group/submit">
                  <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-yellow-600 to-yellow-400 rounded-[40px] blur opacity-20 group-hover/submit:opacity-60 transition duration-1000 group-hover:duration-200 animate-pulse" />
                  
                  <Button 
                    type="submit" 
                    disabled={isSending || (!hasAuto && !hasSemi)} 
                    className={cn(
                      "relative w-full h-24 rounded-[40px] font-black text-2xl uppercase italic tracking-tighter gap-5 overflow-hidden transition-all duration-300",
                      (isSending || (!hasAuto && !hasSemi)) 
                        ? "bg-slate-100 text-slate-300 border-none cursor-not-allowed" 
                        : "bg-slate-900 text-white border-b-[10px] border-black hover:translate-y-[4px] hover:border-b-[6px] active:translate-y-[10px] active:border-b-0 shadow-2xl"
                    )}
                  >
                    {/* EFECTO DE BARRIDO DE ORO LÍQUIDO */}
                    <div className="absolute inset-0 z-0 pointer-events-none opacity-10">
                      <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-yellow-500 to-transparent skew-x-12 animate-shimmer" />
                    </div>

                    <div className="relative z-10 flex items-center gap-4">
                      {isSending ? (
                        <>
                          <Loader2 className="w-10 h-10 animate-spin text-yellow-500" />
                          <span className="animate-pulse">CONFIGURANDO...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-8 h-8 text-yellow-500 group-hover/submit:rotate-12 transition-transform" /> 
                          <span className="group-hover/submit:text-yellow-500 transition-colors">LANZAR NEGOCIO</span>
                          <ArrowRight className="w-7 h-7 text-yellow-500 group-hover/submit:translate-x-2 transition-transform" />
                        </>
                      )}
                    </div>
                  </Button>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-3 opacity-30">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-600 animate-ping" />
                    <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-400">Yapido Business Core • Kernel v2.0</p>
                  </div>
                  <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* BARRA DE ESTADO INFERIOR DORADA */}
        <div className="h-10 bg-white border-t border-yellow-500/10 flex items-center justify-center px-8 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
             <span className="text-[7px] font-black text-slate-300 uppercase tracking-[0.4em]">SISTEMA DE REGISTRO SEGURO ACTIVO</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
