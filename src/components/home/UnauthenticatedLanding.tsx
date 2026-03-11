
"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Sparkles, ArrowRight, Camera, Loader2, LogIn } from 'lucide-react';
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
}

export function UnauthenticatedLanding({ auth, isAdmin, user }: UnauthenticatedLandingProps) {
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Obtener la configuración de la app (Imagen de Portada)
  const configRef = useMemoFirebase(() => doc(firestore, 'appConfig', 'home'), [firestore]);
  const { data: appConfig } = useDoc(configRef);

  const handleLogin = () => initiateGoogleSignIn(auth);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isAdmin) return;

    setIsUploading(true);
    try {
      const compressed = await compressImage(file, 1920, 1080, 0.8);
      
      // Guardar la imagen de portada universalmente
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

  const coverImage = appConfig?.coverImageUrl || "https://picsum.photos/seed/morrocoy/1920/1080";

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden flex items-center justify-center bg-black">
      {/* Portada Universal Adaptable */}
      <div className="absolute inset-0 z-0">
        <Image 
          src={coverImage} 
          alt="Portada Vitriniando" 
          fill 
          className="object-cover opacity-70 transition-opacity duration-1000" 
          priority 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
      </div>

      {/* Botón de Login Superior Derecho (Semi-transparente) */}
      {!user && (
        <div className="absolute top-6 right-6 z-30">
          <Button 
            onClick={handleLogin}
            variant="ghost"
            className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full px-6 h-12 font-bold hover:bg-white/20 gap-2 transition-all"
          >
            <LogIn className="w-4 h-4" />
            Ingresar
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
            className="pointer-events-auto w-24 h-24 rounded-full bg-white/20 backdrop-blur-xl border-2 border-white/30 text-white hover:bg-white/40 transition-all flex flex-col items-center justify-center gap-1 shadow-2xl group"
          >
            {isUploading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <>
                <Camera className="w-8 h-8 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Portada</span>
              </>
            )}
          </Button>
        </div>
      )}

      {/* Contenido Central */}
      <div className="container relative z-10 px-6 text-center space-y-8 max-w-4xl">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-secondary" />
          <span className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-white/90">Aguachica • Cesar</span>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-6xl sm:text-8xl md:text-9xl font-black text-white leading-none tracking-tighter uppercase italic">
            Vitriniando <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-gradient block">Marketplace</span>
          </h1>
          <p className="text-white/60 text-sm sm:text-lg font-bold uppercase tracking-[0.3em] max-w-lg mx-auto">
            La vitrina digital más grande de la ciudad
          </p>
        </div>

        {!user && (
          <div className="pt-8">
            <Button 
              onClick={handleLogin} 
              size="lg" 
              className="bg-primary text-white font-black h-16 px-12 rounded-full text-lg shadow-2xl transition-all group w-full sm:w-auto hover:scale-105 active:scale-95"
            >
              ENTRAR A VITRINIAR <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
