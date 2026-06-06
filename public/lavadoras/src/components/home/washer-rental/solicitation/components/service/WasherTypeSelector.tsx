
"use client";

import { useRef, useState } from 'react';
import { Camera, Loader2, ImageIcon, CheckCircle2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { compressImage } from '@/lib/image-compression';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';

interface WasherTypeSelectorProps {
  isAdmin: boolean;
  selectedType: 'automatica' | 'semiautomatica';
  onSelect: (v: 'automatica' | 'semiautomatica') => void;
  availableMachineTypes?: { automatic: boolean; semiautomatic: boolean };
}

export function WasherTypeSelector({ isAdmin, selectedType, onSelect, availableMachineTypes }: WasherTypeSelectorProps) {
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
      await setDocumentNonBlocking(previewsRef, { [type]: compressed, updatedAt: serverTimestamp() }, { merge: true });
      toast({ title: "Imagen actualizada" });
    } catch (error) {
      toast({ title: "Error al cargar", variant: "destructive" });
    } finally {
      setUploadingType(null);
    }
  };

  return (
    <div className="space-y-6">
      <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-[0.2em]">Equipo Solicitado</Label>
      <div className={cn(
        "grid gap-4", 
        (!availableMachineTypes || (availableMachineTypes.automatic && availableMachineTypes.semiautomatic)) ? "grid-cols-2" : "grid-cols-1 max-w-[200px] mx-auto"
      )}>
        {['automatica', 'semiautomatica'].filter(t => {
          if (!availableMachineTypes) return true;
          if (t === 'automatica') return availableMachineTypes.automatic;
          return availableMachineTypes.semiautomatic;
        }).map((type) => (
          <div key={type} className="group/type relative space-y-4">
            <button
              onClick={() => onSelect(type as any)}
              className={cn(
                "relative w-full h-14 rounded-2xl font-black text-[11px] uppercase tracking-widest border-2 transition-all duration-500 overflow-hidden",
                selectedType === type 
                  ? "bg-slate-900 text-white border-slate-900 shadow-xl scale-[1.02]" 
                  : "bg-white text-slate-400 border-yellow-500/10 hover:border-yellow-500/30"
              )}
            >
              {selectedType === type && (
                <div className="absolute top-1 right-1 animate-in zoom-in duration-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-yellow-500" />
                </div>
              )}
              {type}
            </button>
            
            <div className={cn(
              "relative aspect-[2/3] w-full max-w-[120px] mx-auto rounded-[24px] overflow-hidden border-2 transition-all duration-700 shadow-md",
              selectedType === type ? "border-yellow-500 scale-105 shadow-yellow-500/20" : "border-slate-100 opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
            )}>
              {previews?.[type] ? (
                <Image src={previews[type]} alt={type} fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-200 bg-slate-50"><ImageIcon className="w-6 h-6" /></div>
              )}
              
              {isAdmin && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setUploadingType(type as any); fileInputRef.current?.click(); }}
                  className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/type:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2"
                >
                  {uploadingType === type ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                  <span className="text-[8px] font-black uppercase tracking-widest">Subir</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => uploadingType && handleImageUpload(e, uploadingType)} />
    </div>
  );
}
