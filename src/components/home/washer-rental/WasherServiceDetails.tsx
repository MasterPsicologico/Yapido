
"use client";

import { useRef, useState } from 'react';
import { LayoutGrid, ArrowUpCircle, Settings2, Camera, Loader2, ImageIcon, Plus, AlertTriangle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { compressImage } from '@/lib/image-compression';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';

interface WasherServiceDetailsProps {
  isAdmin: boolean;
  washerType: 'automatica' | 'semiautomatica';
  setWasherType: (v: 'automatica' | 'semiautomatica') => void;
  floor: string;
  setFloor: (v: string) => void;
  hasElevator: boolean;
  setHasElevator: (v: boolean) => void;
  hasStairs: boolean;
  setHasStairs: (v: boolean) => void;
  stairCount: number;
  setStairCount: (v: number) => void;
}

export function WasherServiceDetails({
  isAdmin, washerType, setWasherType, floor, setFloor, hasElevator, setHasElevator, 
  hasStairs, setHasStairs, stairCount, setStairCount
}: WasherServiceDetailsProps) {
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingType, setUploadingType] = useState<'automatica' | 'semiautomatica' | null>(null);

  const previewsRef = useMemoFirebase(() => doc(firestore, 'appConfig', 'washer_previews'), [firestore]);
  const { data: previews } = useDoc(previewsRef);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'automatica' | 'semiautomatica') => {
    const file = e.target.files?.[0];
    if (!file || !isAdmin) return;
    setUploadingType(type);
    try {
      const compressed = await compressImage(file, 400, 600, 0.7);
      await setDocumentNonBlocking(previewsRef, {
        [type]: compressed,
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast({ title: "Imagen de referencia actualizada" });
    } catch (error) {
      toast({ title: "Error al cargar imagen", variant: "destructive" });
    } finally {
      setUploadingType(null);
    }
  };

  const stairOptions = [1, 2, 3, 4, 5];

  return (
    <div className="space-y-8 bg-slate-50 p-6 rounded-[32px] border border-slate-100 shadow-inner">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
          <Settings2 className="w-4 h-4" />
        </div>
        <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">Detalles del Servicio</h3>
      </div>

      <div className="grid gap-6">
        {/* Tipo de Lavadora */}
        <div className="space-y-4">
          <Label className="text-[9px] font-black uppercase text-slate-400 ml-2">Equipo Solicitado</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-3">
              <button
                onClick={() => setWasherType('automatica')}
                className={cn(
                  "w-full h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all",
                  washerType === 'automatica' ? "bg-slate-900 text-white border-slate-900 shadow-lg" : "bg-white text-slate-400 border-slate-200"
                )}
              >
                automatica
              </button>
              <div className="relative aspect-[2/3] w-16 mx-auto rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm group/thumb">
                {previews?.automatica ? (
                  <Image src={previews.automatica} alt="Auto" fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-200"><ImageIcon className="w-4 h-4" /></div>
                )}
                {isAdmin && (
                  <button 
                    onClick={() => { setUploadingType('automatica'); fileInputRef.current?.click(); }}
                    className="absolute inset-0 bg-primary/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white"
                  >
                    {uploadingType === 'automatica' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setWasherType('semiautomatica')}
                className={cn(
                  "w-full h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all",
                  washerType === 'semiautomatica' ? "bg-slate-900 text-white border-slate-900 shadow-lg" : "bg-white text-slate-400 border-slate-200"
                )}
              >
                semiautomatica
              </button>
              <div className="relative aspect-[2/3] w-16 mx-auto rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm group/thumb">
                {previews?.semiautomatica ? (
                  <Image src={previews.semiautomatica} alt="Semi" fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-200"><ImageIcon className="w-4 h-4" /></div>
                )}
                {isAdmin && (
                  <button 
                    onClick={() => { setUploadingType('semiautomatica'); fileInputRef.current?.click(); }}
                    className="absolute inset-0 bg-primary/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white"
                  >
                    {uploadingType === 'semiautomatica' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => uploadingType && handleImageUpload(e, uploadingType)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase text-slate-400 ml-2">¿Qué piso?</Label>
            <div className="relative">
              <ArrowUpCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                type="number" 
                value={floor} 
                onChange={(e) => setFloor(e.target.value)} 
                className="w-full h-12 rounded-2xl bg-white border border-slate-200 pl-10 font-black text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="flex flex-col justify-center items-center gap-2">
            <Label className="text-[9px] font-black uppercase text-slate-400">¿Hay Ascensor?</Label>
            <Switch checked={hasElevator} onCheckedChange={setHasElevator} className="data-[state=checked]:bg-primary" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-4">
            <button 
              onClick={() => {
                setHasStairs(!hasStairs);
                if (!hasStairs) setStairCount(1);
              }}
              className={cn(
                "flex items-center justify-between w-full p-4 rounded-2xl border transition-all",
                hasStairs ? "bg-amber-50 border-amber-200 text-amber-700 shadow-sm" : "bg-white border-slate-100 text-slate-400"
              )}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className={cn("w-5 h-5", hasStairs ? "text-amber-500" : "text-slate-200")} />
                <span className="text-[10px] font-black uppercase tracking-widest">Hay Escalas / Escaleras</span>
              </div>
              <div className={cn("w-2 h-2 rounded-full", hasStairs ? "bg-amber-500 animate-pulse" : "bg-slate-200")} />
            </button>

            {/* SELECTOR DE TRAMOS DE ESCALERAS */}
            {hasStairs && (
              <div className="p-4 bg-white rounded-3xl border border-amber-100 animate-in slide-in-from-top-2 duration-300">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 text-center">¿Cuántos tramos / escalas?</p>
                <div className="flex justify-between gap-2">
                  {stairOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setStairCount(opt)}
                      className={cn(
                        "flex-1 h-10 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-0.5",
                        stairCount === opt 
                          ? "bg-amber-500 text-white shadow-lg scale-105" 
                          : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                      )}
                    >
                      {opt}{opt === 5 && <Plus className="w-2.5 h-2.5" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
