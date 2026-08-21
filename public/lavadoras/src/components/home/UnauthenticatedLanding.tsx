
"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Camera, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDoc, useFirestore, updateDocumentNonBlocking, setDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/image-compression';

interface UnauthenticatedLandingProps {
  auth: any;
  isAdmin: boolean;
  user: any;
  isEditor?: boolean;
}

const CACHE_KEY = 'yapido_click_cover_cache';

export function UnauthenticatedLanding({ auth, isAdmin, user, isEditor = false }: UnauthenticatedLandingProps) {
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [localCoverImage, setLocalCoverImage] = useState<string | null>(null);

  // Obtener la configuración de la app (Imagen de Portada)
  const configRef = useMemoFirebase(() => doc(firestore, 'appConfig', 'home'), [firestore]);
  const { data: appConfig } = useDoc(configRef);

  // Sistema de Caché Inteligente
  useEffect(() => {
    // 1. Intentar cargar desde el dispositivo inmediatamente
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      setLocalCoverImage(cached);
    }
  }, []);

  useEffect(() => {
    // 2. Si la nube tiene una imagen nueva, actualizar el caché
    if (appConfig?.coverImageUrl && appConfig.coverImageUrl !== localCoverImage) {
      setLocalCoverImage(appConfig.coverImageUrl);
      localStorage.setItem(CACHE_KEY, appConfig.coverImageUrl);
    }
  }, [appConfig?.coverImageUrl, localCoverImage]);

  const coverImage = localCoverImage || appConfig?.coverImageUrl || null;

  return (
    <div className={`relative ${isEditor ? 'h-full' : 'h-[100dvh]'} w-full overflow-hidden flex items-center justify-center bg-[#0a0a0a]`}>
      {/* Portada Universal con Caché */}
      <div className="absolute inset-0 z-0">
        {coverImage && (
          <Image 
            src={coverImage} 
            alt="Portada yapido.click" 
            fill 
            className="object-cover opacity-100 transition-opacity duration-1000" 
            priority 
          />
        )}
        <div className="absolute inset-0 bg-black/5"></div>
      </div>

      {/* Control Maestro de Imagen (Centro - Solo Admin) */}
      {isAdmin && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleImageUpload} 
          />
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="pointer-events-auto w-24 h-24 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 text-white/50 hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-2 shadow-2xl group border-dashed"
          >
            {isUploading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <>
                <Camera className="w-8 h-8 group-hover:scale-110 transition-transform" />
                <span className="text-[8px] font-black uppercase tracking-[0.2em]">Portada</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !isAdmin) return;

  setIsUploading(true);
  try {
    const compressed = await compressImage(file, 1920, 1080, 0.8);
    
    if (appConfig) {
      updateDocumentNonBlocking(configRef, {
        coverImageUrl: compressed,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid
      });
    } else {
      setDocumentNonBlocking(configRef, {
        coverImageUrl: compressed,
        createdAt: serverTimestamp(),
        updatedBy: user?.uid
      }, { merge: true });
    }
    
    // Actualizar localmente también
    setLocalCoverImage(compressed);
    localStorage.setItem(CACHE_KEY, compressed);
    
    toast({ title: "Portada actualizada con éxito" });
  } catch (error) {
    toast({ title: "Error al actualizar portada", variant: "destructive" });
  } finally {
    setIsUploading(false);
  }
};
