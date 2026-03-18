
"use client";

import { Search, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface HomeHeaderProps {
  onSearch?: (term: string) => void;
}

export function HomeHeader({ onSearch }: HomeHeaderProps) {
  return (
    <div className="space-y-6 w-full lg:max-w-xl">
      <div className="space-y-1">
        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tighter leading-[0.85] uppercase italic">
          Aguachica <br /> <span className="text-primary">Digital</span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-lg font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-400" /> Las mejores vitrinas morrocoyeras
        </p>
      </div>

      <div className="relative group max-w-md">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
          <Input 
            type="text"
            placeholder="¿Qué buscas hoy? (Ej: Pizza, Ropa...)" 
            onChange={(e) => onSearch?.(e.target.value)}
            className="h-16 rounded-full bg-white border-none pl-14 pr-6 text-lg font-bold shadow-2xl shadow-slate-200/50 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-300"
          />
        </div>
      </div>
    </div>
  );
}
