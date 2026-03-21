
"use client";

import { Search, Sparkles, Camera, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HomeHeaderProps {
  onSearch?: (term: string) => void;
  bgImage?: string | null;
  isAdmin?: boolean;
  onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading?: boolean;
}

export function HomeHeader({ onSearch, bgImage, isAdmin, onImageUpload, isUploading }: HomeHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative w-full lg:max-w-2xl rounded-[40px] overflow-hidden min-h-[320px] flex flex-col justify-end p-8 sm:p-12 shadow-2xl transition-all duration-700 bg-slate-900 group/header">
      {/* Fondo de Imagen Dinámico con Overlay */}
      <div className="absolute inset-0 z-0">
        {bgImage ? (
          <Image 
            src={bgImage} 
            alt="Cabecera Aguachica" 
            fill 
            className="object-cover opacity-60 group-hover/header:scale-105 transition-transform duration-[2000ms]" 
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
      </div>

      {/* Control Maestro de Imagen (Solo Admin) */}
      {isAdmin && (
        <div className="absolute top-6 right-6 z-20">
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
            className="rounded-full h-12 w-12 sm:w-auto sm:px-5 bg-white/10 backdrop-blur-xl border-white/20 text-white hover:bg-white/20 gap-2 shadow-2xl transition-all active:scale-90"
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5 text-primary" />}
            <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Cambiar Fondo</span>
          </Button>
        </div>
      )}

      {/* Contenido de la Cabecera */}
      <div className="relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-7xl font-black text-white tracking-tighter leading-[0.85] uppercase italic drop-shadow-2xl">
            Aguachica <br /> <span className="text-primary drop-shadow-[0_0_30px_rgba(59,130,246,0.5)]">Digital</span>
          </h1>
          <p className="text-white/60 text-[10px] sm:text-xs font-black uppercase tracking-[0.4em] flex items-center gap-2 ml-1">
            <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse" /> Las mejores vitrinas morrocoyeras
          </p>
        </div>

        <div className="relative group max-w-md">
          <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-primary transition-colors" />
            <Input 
              type="text"
              placeholder="¿Qué buscas hoy? (Ej: Pizza, Ropa...)" 
              onChange={(e) => onSearch?.(e.target.value)}
              className="h-16 rounded-full bg-white/10 backdrop-blur-2xl border-white/10 pl-16 pr-6 text-lg font-bold text-white placeholder:text-white/20 focus:ring-4 focus:ring-primary/20 transition-all shadow-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
