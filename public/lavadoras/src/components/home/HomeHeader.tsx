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
  cityName?: string;
}

export function HomeHeader({ bgImage, isAdmin, onImageUpload, isUploading, cityName = 'Yapido' }: HomeHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative w-full lg:max-w-3xl rounded-[40px] overflow-hidden min-h-[200px] flex flex-col justify-center items-center p-6 sm:p-10 shadow-2xl transition-all duration-700 bg-slate-900 group/header text-center mx-auto">
      {/* Fondo de Imagen Dinámico */}
      <div className="absolute inset-0 z-0">
        {bgImage ? (
          <Image 
            src={bgImage} 
            alt={`Cabecera ${cityName}`} 
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
        <div className="absolute top-4 right-4 z-30">
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
            className="rounded-full h-10 w-10 bg-white/10 backdrop-blur-2xl border-white/20 text-white hover:bg-white/20 shadow-2xl transition-all active:scale-90"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4 text-primary" />}
          </Button>
        </div>
      )}

      {/* Contenido de la Cabecera Centralizado y Compacto */}
      <div className="relative z-10 space-y-4 w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tighter leading-none uppercase italic drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
            {cityName}
          </h1>
          <div className="inline-block px-6 py-1 bg-primary/20 backdrop-blur-2xl rounded-xl border border-primary/30 transform -rotate-2 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
            <span className="text-2xl sm:text-4xl font-black text-primary uppercase italic tracking-widest drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
              Digital
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 pt-2">
            <p className="text-white/60 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-2">
              <Sparkles className="w-2.5 h-2.5 text-yellow-400 animate-pulse" /> Vitrinas Morrocoyeras
            </p>
            <div className="h-0.5 w-8 bg-primary/40 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
