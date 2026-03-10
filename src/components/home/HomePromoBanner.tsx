
"use client";

import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HomePromoBannerProps {
  onAction: () => void;
}

export function HomePromoBanner({ onAction }: HomePromoBannerProps) {
  return (
    <div className="bg-slate-900 w-full p-8 md:p-14 flex flex-col lg:flex-row items-center gap-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="relative z-10 flex-1 space-y-4 text-center lg:text-left">
        <h3 className="text-3xl md:text-5xl font-black text-white tracking-tighter">¿Tienes un negocio <br className="hidden md:block" /> en Aguachica?</h3>
        <p className="text-slate-400 text-base font-medium mx-auto lg:mx-0 max-w-md">Lleva tu catálogo al mundo digital en segundos.</p>
      </div>
      <div className="relative z-10 shrink-0 w-full lg:w-auto">
        <Button onClick={onAction} size="lg" className="rounded-full h-14 px-8 text-lg font-black bg-white text-slate-900 hover:bg-slate-100 gap-2 w-full lg:w-auto">
          Empezar ahora <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
