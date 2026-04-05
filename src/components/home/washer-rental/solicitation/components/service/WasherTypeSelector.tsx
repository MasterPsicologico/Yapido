
"use client";

import { useRef, useState } from 'react';
import { Camera, Loader2, ImageIcon } from 'lucide-react';
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
}

export function WasherTypeSelector({ isAdmin, selectedType, onSelect }: WasherTypeSelectorProps) {
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
    <div className="space-y-4">
      <Label className="text-[9px] font-black uppercase text-slate-400 ml-2">Equipo Solicitado</Label>
      <div className="grid grid-cols-2 gap-3">
        {['automatica', 'semiautomatica'].map((type) => (
          <div key={type} className="space-y-3">
            <button
              onClick={() => onSelect(type as any)}
              className={cn(
                "w-full h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all",
                selectedType === type ? "bg-slate-900 text-white border-slate-900 shadow-lg" : "bg-white text-slate-400 border-slate-200"
              )}
            >
              {type}
            </button>
            <div className="relative aspect-[2/3] w-16 mx-auto rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm group/thumb">
              {previews?.[type] ? (
                <Image src={previews[type]} alt={type} fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-200"><ImageIcon className="w-4 h-4" /></div>
              )}
              {isAdmin && (
                <button 
                  onClick={() => { setUploadingType(type as any); fileInputRef.current?.click(); }}
                  className="absolute inset-0 bg-primary/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white"
                >
                  {uploadingType === type ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
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
