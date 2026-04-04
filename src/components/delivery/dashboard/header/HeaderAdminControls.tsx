
"use client";

import { useRef } from 'react';
import { Camera, Loader2, Zap, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderAdminControlsProps {
  isAdmin?: boolean;
  isUploading?: 'active' | 'inactive' | null;
  onImageUpload?: (e: React.ChangeEvent<HTMLInputElement>, target: 'active' | 'inactive') => void;
  isOnline: boolean;
}

export function HeaderAdminControls({ isAdmin, isUploading, onImageUpload, isOnline }: HeaderAdminControlsProps) {
  const activeInputRef = useRef<HTMLInputElement>(null);
  const inactiveInputRef = useRef<HTMLInputElement>(null);

  if (!isAdmin) return null;

  return (
    <div className="absolute top-4 right-4 z-30 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <input type="file" ref={activeInputRef} className="hidden" accept="image/*" onChange={(e) => onImageUpload?.(e, 'active')} />
        <button 
          onClick={() => activeInputRef.current?.click()}
          disabled={!!isUploading}
          className={cn(
            "rounded-full h-10 px-4 bg-primary/20 backdrop-blur-md border border-primary/30 text-white hover:bg-primary/40 shadow-2xl transition-all active:scale-90 flex items-center gap-2 outline-none",
            isOnline && "ring-2 ring-primary ring-offset-2 ring-offset-slate-900"
          )}
        >
          {isUploading === 'active' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-primary" />}
          <span className="text-[8px] font-black uppercase tracking-widest">FONDO ACTIVO</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <input type="file" ref={inactiveInputRef} className="hidden" accept="image/*" onChange={(e) => onImageUpload?.(e, 'inactive')} />
        <button 
          onClick={() => inactiveInputRef.current?.click()}
          disabled={!!isUploading}
          className={cn(
            "rounded-full h-10 px-4 bg-slate-800/40 backdrop-blur-md border border-white/10 text-white hover:bg-slate-800/60 shadow-2xl transition-all active:scale-90 flex items-center gap-2 outline-none",
            !isOnline && "ring-2 ring-white ring-offset-2 ring-offset-slate-900"
          )}
        >
          {isUploading === 'inactive' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Moon className="w-4 h-4 text-slate-400" />}
          <span className="text-[8px] font-black uppercase tracking-widest">FONDO DESCANSO</span>
        </button>
      </div>
    </div>
  );
}
