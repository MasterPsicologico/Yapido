"use client";

import { Camera, Loader2, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';

interface HomeHeaderProps {
  bgImage?: string | null;
  isAdmin?: boolean;
  onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading?: boolean;
}

export function HomeHeader({ bgImage, isAdmin, onImageUpload, isUploading }: HomeHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative w-full lg:max-w-3xl rounded-[48px] overflow-hidden min-h-[380px] flex flex-col justify-center items-center p-8 sm:p-16 shadow-2xl transition-all duration-700 bg-slate-900 group/header text-center mx-auto">
      {/* Fondo de Imagen Dinámico */}
      <div className="absolute inset-0 z-0">
        {bgImage ? (
          <Image 
            src={bgImage} 
            alt="Cabecera Aguachica" 
            fill 
            className="object-cover opacity-70 group-hover/header:scale-105 transition-transform duration-[3000ms] ease-out" 
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Control Maestro de Imagen (Solo Admin) */}
      {isAdmin && (
        <div className="absolute top-8 right-8 z-30">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={onImageUpload} 
          />
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            variant="outline"
            className="rounded-full h-12 w-12 bg-white/10 backdrop-blur-2xl border-white/20 text-white hover:bg-white/20 shadow-2xl transition-all active:scale-90"
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5 text-primary" />}
          </Button>
        </div>
      )}

      {/* Contenido de la Cabecera Centralizado */}
      <div className="relative z-10 space-y-8 w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="space-y-4">
          <h1 className="text-5xl sm:text-8xl font-black text-white tracking-tighter leading-none uppercase italic drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
            Aguachica
          </h1>
          <div className="inline-block px-8 py-2 bg-primary/20 backdrop-blur-2xl rounded-2xl border border-primary/30 transform -rotate-2 shadow-[0_0_40px_rgba(59,130,246,0.3)]">
            <span className="text-3xl sm:text-5xl font-black text-primary uppercase italic tracking-widest drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              Digital
            </span>
          </div>
          <div className="flex flex-col items-center gap-2 pt-4">
            <p className="text-white/60 text-[10px] sm:text-xs font-black uppercase tracking-[0.5em] flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse" /> Vitrinas Morrocoyeras
            </p>
            <div className="h-0.5 w-12 bg-primary/40 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
