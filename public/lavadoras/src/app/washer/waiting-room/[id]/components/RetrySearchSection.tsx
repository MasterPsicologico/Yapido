
"use client";

import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * RetrySearchSection - UI de contingencia cuando la búsqueda inicial falla.
 */
export function RetrySearchSection() {
  return (
    <div className="text-center space-y-4 animate-in fade-in">
      <div className="p-6 rounded-[32px] bg-amber-50 border border-amber-100 flex items-center gap-4 text-left shadow-inner">
        <ShieldCheck className="w-8 h-8 text-amber-500 shrink-0" />
        <p className="text-xs font-bold text-amber-700 uppercase leading-relaxed">
          Aún nos encontramos en el proceso para asignarle una lavadora. El radar sigue activo buscando la mejor opción.
        </p>
      </div>
      <Button 
        onClick={() => window.location.reload()} 
        variant="outline" 
        className="rounded-full h-12 px-8 font-black uppercase text-[10px] tracking-widest border-slate-200 hover:bg-slate-50 transition-colors"
      >
        REINTENTAR BÚSQUEDA
      </Button>
    </div>
  );
}
