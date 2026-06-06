
"use client";

import { User as UserIcon, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface WasherNameInputProps {
  value: string;
  onChange: (v: string) => void;
}

export function WasherNameInput({ value, onChange }: WasherNameInputProps) {
  return (
    <div className="space-y-2 group">
      <div className="flex items-center gap-2 ml-4">
        <Sparkles className="w-3 h-3 text-yellow-600 animate-pulse" />
        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Nombre Completo</Label>
      </div>
      <div className="relative overflow-hidden rounded-[24px]">
        {/* Efecto Shimmer de fondo */}
        <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-yellow-200/20 to-transparent skew-x-12 animate-shimmer pointer-events-none" />
        
        <div className="absolute left-5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-slate-900 shadow-md z-10">
          <UserIcon className="w-5 h-5" />
        </div>
        
        <Input 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          className={cn(
            "h-16 rounded-[24px] border-2 border-yellow-500/20 pl-16 pr-6 font-black text-slate-900 text-lg transition-all duration-500",
            "bg-gradient-to-r from-yellow-50/50 to-white focus:bg-white focus:border-yellow-500 focus:shadow-[0_0_25px_rgba(234,179,8,0.2)]"
          )}
          placeholder="Tu identidad maestra..." 
        />
      </div>
    </div>
  );
}
