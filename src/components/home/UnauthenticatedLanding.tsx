
"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
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

export function UnauthenticatedLanding({ auth, isAdmin, user, isEditor = false }: UnauthenticatedLandingProps) {
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Obtener la configuración de la app (Imagen de Portada)
  const configRef = useMemoFirebase(() => doc(firestore, 'appConfig', 'home'), [firestore]);
  const { data: appConfig, isLoading } = useDoc(configRef);

  const handleLogin = () => initiateGoogleSignIn(auth);

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
      
      toast({ title: "Portada actualizada con éxito" });
    } catch (error) {
      toast({ title: "Error al actualizar portada", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  // NATIVAMENTE: Si no hay imagen en la DB, no mostramos el paisaje antiguo. 
  // Se prefiere un placeholder coherente o nada hasta que cargue.
  const coverImage = appConfig?.coverImageUrl || null;

  return (
    <div className={`relative ${isEditor ? 'h-full' : 'h-[100dvh]'} w-full overflow-hidden flex items-center justify-center bg-[#0a0a0a]`}>
      {/* Portada Universal */}
      <div className="absolute inset-0 z-0">
        {coverImage && (
          <Image 
            src={coverImage} 
            alt="Portada Vitriniando" 
            fill 
            className="object-cover opacity-100 transition-opacity duration-700" 
            priority 
          />
        )}
        <div className="absolute inset-0 bg-black/5"></div>
      </div>

      {/* Botón de Login Superior Derecho (90% Transparente) */}
      {!user && !isEditor && (
        <div className="absolute top-8 right-8 z-30">
          <Button 
            onClick={handleLogin}
            variant="ghost"
            className="bg-white/10 backdrop-blur-xl border border-white/10 text-white rounded-full px-8 h-14 font-black hover:bg-white/20 gap-3 transition-all shadow-2xl tracking-widest text-sm uppercase italic"
          >
            <LogIn className="w-5 h-5" />
            INGRESAR
          </Button>
        </div>
      )}

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
            className="pointer-events-auto w-32 h-32 rounded-full bg-white/10 backdrop-blur-2xl border-2 border-white/20 text-white hover:bg-white/30 transition-all flex flex-col items-center justify-center gap-2 shadow-2xl group border-dashed"
          >
            {isUploading ? (
              <Loader2 className="w-10 h-10 animate-spin" />
            ) : (
              <>
                <Camera className="w-10 h-10 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Portada</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
