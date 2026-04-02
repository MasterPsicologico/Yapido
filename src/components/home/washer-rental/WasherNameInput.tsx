
"use client";

import { User as UserIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface WasherNameInputProps {
  value: string;
  onChange: (v: string) => void;
}

/**
 * Función Aislada: Entrada de Nombre del Cliente
 * Mandamiento #1: Archivo único para evitar alteraciones por error.
 */
export function WasherNameInput({ value, onChange }: WasherNameInputProps) {
  return (
    <div className="space-y-1">
      <Label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">NOMBRE COMPLETO</Label>
      <div className="relative group">
        <div className="absolute left-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-focus-within:text-primary transition-colors">
          <UserIcon className="w-4 h-4" />
        </div>
        <Input 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          className="h-12 rounded-2xl border-none shadow-sm pl-16 font-black text-slate-800 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-slate-950 transition-all" 
          placeholder="Escribe tu nombre..." 
        />
      </div>
    </div>
  );
}
