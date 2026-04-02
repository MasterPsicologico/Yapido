
"use client";

import { CreditCard, Camera, User as UserIcon, Smartphone, Loader2, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface IdentitySectionProps {
  isLocked: boolean;
  onLockedClick: () => void;
  fullName: string;
  setFullName: (v: string) => void;
  idNumber: string;
  setIdNumber: (v: string) => void;
  vehicleType: string;
  setVehicleType: (v: any) => void;
  plate: string;
  setPlate: (v: string) => void;
  docFront: string | null;
  docBack: string | null;
  selfie: string | null;
  isCompressing: string | null;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back' | 'selfie') => void;
  setDocFront: (v: string | null) => void;
  setDocBack: (v: string | null) => void;
  setSelfie: (v: string | null) => void;
}

export function IdentitySection({
  isLocked, onLockedClick, fullName, setFullName, idNumber, setIdNumber, 
  vehicleType, setVehicleType, plate, setPlate, docFront, docBack, selfie,
  isCompressing, onImageUpload, setDocFront, setDocBack, setSelfie
}: IdentitySectionProps) {
  return (
    <div className="relative group">
      <Card className={cn(
        "border-none shadow-2xl rounded-[56px] bg-white ring-1 transition-all duration-1000",
        !isLocked ? "ring-primary/20 opacity-100 translate-y-0" : "ring-black/[0.03] opacity-40 grayscale blur-[1px] translate-y-4 pointer-events-none"
      )}>
        <CardContent className="p-12 space-y-16">
          {/* Bloque 1: Identificación */}
          <div className="space-y-10">
            <div className="flex items-center gap-4 text-secondary">
              <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="font-black text-sm uppercase tracking-[0.3em] italic">Datos de Identidad</h3>
            </div>

            <div className="grid gap-10">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">Nombre Completo (Real)</Label>
                <Input 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tal como aparece en tu documento" 
                  className="h-16 rounded-[24px] bg-slate-50 border-none font-bold text-lg px-8 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">Número de ID / Cédula</Label>
                  <Input 
                    value={idNumber} 
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="Ej: 1065..." 
                    className="h-16 rounded-[24px] bg-slate-50 border-none font-bold text-lg px-8 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all" 
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">Vehículo de Operación</Label>
                  <div className="relative">
                    <select 
                      value={vehicleType} 
                      onChange={(e) => setVehicleType(e.target.value as any)}
                      className="w-full h-16 rounded-[24px] bg-slate-50 border-none px-8 font-black text-sm appearance-none cursor-pointer focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all"
                    >
                      <option value="">Selecciona...</option>
                      <option value="moto">Motocicleta</option>
                      <option value="bici">Bicicleta</option>
                      <option value="carro">Automóvil</option>
                    </select>
                  </div>
                </div>
              </div>

              {(vehicleType === 'moto' || vehicleType === 'carro') && (
                <div className="space-y-3 animate-in slide-in-from-top-4 duration-500">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">Placa del Vehículo</Label>
                  <Input 
                    value={plate} 
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    placeholder="ABC-123" 
                    className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-center text-2xl tracking-[0.4em] uppercase focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all" 
                  />
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-slate-100 to-transparent" />

          {/* Bloque 2: Archivos */}
          <div className="space-y-10">
            <div className="flex items-center gap-4 text-primary">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="font-black text-sm uppercase tracking-[0.3em] italic">Evidencia Visual</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="px-4">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Frente de ID</Label>
                </div>
                <div className="relative aspect-[16/10] rounded-[32px] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden group/upload hover:border-primary/50 transition-all">
                  {docFront ? (
                    <>
                      <Image src={docFront} alt="Frente" fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center">
                        <Button onClick={() => setDocFront(null)} size="icon" variant="destructive" className="h-12 w-12 rounded-full shadow-2xl"><X className="w-6 h-6" /></Button>
                      </div>
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-slate-100 transition-colors">
                      {isCompressing === 'front' ? <Loader2 className="w-10 h-10 animate-spin text-primary" /> : <Smartphone className="w-10 h-10 text-slate-200" />}
                      <span className="text-[9px] font-black uppercase text-slate-400 mt-4 tracking-widest">Capturar Frente</span>
                      <input type="file" className="hidden" accept="image/*" capture="environment" onChange={(e) => onImageUpload(e, 'front')} />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="px-4">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Reverso de ID</Label>
                </div>
                <div className="relative aspect-[16/10] rounded-[32px] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden group/upload hover:border-primary/50 transition-all">
                  {docBack ? (
                    <>
                      <Image src={docBack} alt="Reverso" fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center">
                        <Button onClick={() => setDocBack(null)} size="icon" variant="destructive" className="h-12 w-12 rounded-full shadow-2xl"><X className="w-6 h-6" /></Button>
                      </div>
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-slate-100 transition-colors">
                      {isCompressing === 'back' ? <Loader2 className="w-10 h-10 animate-spin text-primary" /> : <Smartphone className="w-10 h-10 text-slate-200" />}
                      <span className="text-[9px] font-black uppercase text-slate-400 mt-4 tracking-widest">Capturar Reverso</span>
                      <input type="file" className="hidden" accept="image/*" capture="environment" onChange={(e) => onImageUpload(e, 'back')} />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="px-4">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Selfie Biométrica</Label>
              </div>
              <div className="relative aspect-[16/9] rounded-[40px] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden group/upload hover:border-primary/50 transition-all shadow-inner">
                {selfie ? (
                  <>
                    <Image src={selfie} alt="Selfie" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center">
                      <Button onClick={() => setSelfie(null)} size="icon" variant="destructive" className="h-12 w-12 rounded-full shadow-2xl"><X className="w-6 h-6" /></Button>
                    </div>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-slate-100 transition-colors">
                    {isCompressing === 'selfie' ? <Loader2 className="w-12 h-12 animate-spin text-primary" /> : <UserIcon className="w-12 h-12 text-slate-200" />}
                    <span className="text-[10px] font-black uppercase text-slate-400 mt-4 tracking-widest">Tomar Selfie de Validación</span>
                    <input type="file" className="hidden" accept="image/*" capture="user" onChange={(e) => onImageUpload(e, 'selfie')} />
                  </label>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* ESCUDO DE INTERACCIÓN */}
      {isLocked && (
        <div 
          className="absolute inset-0 z-50 cursor-pointer rounded-[56px]" 
          onClick={onLockedClick}
        />
      )}
    </div>
  );
}
