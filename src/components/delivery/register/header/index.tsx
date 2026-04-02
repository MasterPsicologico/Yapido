
"use client";

import { Truck, Sparkles, ChevronDown } from 'lucide-react';

export function RegisterHeader() {
  return (
    <header className="text-center mb-16 space-y-8 animate-in fade-in zoom-in duration-1000">
      <div className="relative inline-block">
        {/* Aura de Energía Logística */}
        <div className="absolute inset-0 bg-primary/30 rounded-[45px] animate-pulse [animation-duration:4000ms] blur-xl" />
        <div className="absolute inset-0 bg-primary/20 rounded-[40px] animate-ping [animation-duration:3000ms]" />
        
        <div className="relative w-32 h-32 bg-gradient-to-br from-primary to-blue-700 rounded-[40px] flex items-center justify-center text-white shadow-[0_20px_50px_rgba(59,130,246,0.4)] border border-white/20 group hover:scale-105 transition-transform duration-500">
          <Truck className="w-16 h-16 group-hover:rotate-[-5deg] transition-transform" />
          <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-pulse" />
        </div>
      </div>

      <div className="space-y-4 px-4">
        <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter uppercase text-slate-900 leading-[0.9]">
          ¡Quiero ser <br /> <span className="text-primary">Repartidor!</span>
        </h1>
        <p className="text-slate-500 font-bold text-sm md:text-base max-w-sm mx-auto leading-relaxed uppercase tracking-tight opacity-80">
          Únete al motor que mueve a la ciudad. <br /> 
          <span className="text-slate-400 text-xs">Regístrate en 5 minutos y empieza a ganar hoy mismo.</span>
        </p>
      </div>

      <div className="flex justify-center opacity-20 animate-bounce pt-4">
        <ChevronDown className="w-6 h-6 text-slate-900" />
      </div>
    </header>
  );
}
