
"use client";

import { useRef } from 'react';
import { Smartphone, Monitor, Plus, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdminWelcomeControlsProps {
  isUploading: 'mobile' | 'pc' | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, target: 'mobile' | 'pc') => void;
}

export function AdminWelcomeControls({ isUploading, onUpload }: AdminWelcomeControlsProps) {
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const pcInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="absolute top-6 right-6 z-[100] flex flex-col gap-4 animate-in slide-in-from-right-4 duration-700">
      <div className="flex flex-col items-end gap-3">
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl">
          <Sparkles className="w-3 h-3 text-primary animate-pulse" />
          <span className="text-[8px] font-black text-white/60 uppercase tracking-widest">Admin Visual</span>
        </div>

        {/* CARGAR MÓVIL */}
        <div className="group relative">
          <input 
            type="file" 
            ref={mobileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={(e) => onUpload(e, 'mobile')} 
          />
          <Button 
            onClick={() => mobileInputRef.current?.click()}
            disabled={!!isUploading}
            className={cn(
              "w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-primary transition-all shadow-2xl active:scale-90",
              isUploading === 'mobile' && "animate-pulse"
            )}
          >
            {isUploading === 'mobile' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Smartphone className="w-5 h-5" />}
          </Button>
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-900 text-white text-[7px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/5">
            SUBIR PORTADA MÓVIL
          </div>
        </div>

        {/* BOTÓN CENTRAL (+) */}
        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white shadow-[0_0_30px_rgba(59,130,246,0.5)] border-4 border-slate-950 animate-pulse">
          <Plus className="w-7 h-7 stroke-[3]" />
        </div>

        {/* CARGAR PC */}
        <div className="group relative">
          <input 
            type="file" 
            ref={pcInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={(e) => onUpload(e, 'pc')} 
          />
          <Button 
            onClick={() => pcInputRef.current?.click()}
            disabled={!!isUploading}
            className={cn(
              "w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-secondary transition-all shadow-2xl active:scale-90",
              isUploading === 'pc' && "animate-pulse"
            )}
          >
            {isUploading === 'pc' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Monitor className="w-5 h-5" />}
          </Button>
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-900 text-white text-[7px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/5">
            SUBIR PORTADA PC
          </div>
        </div>
      </div>
    </div>
  );
}
