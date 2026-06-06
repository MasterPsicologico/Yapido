
"use client";

import { X, Navigation, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function LogisticsHeader() {
  const router = useRouter();

  return (
    <div className="h-20 bg-slate-900 flex items-center justify-between px-6 sm:px-8 text-white shrink-0 shadow-2xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />

      <div className="flex items-center gap-4 relative z-10">
        <div className="w-12 h-12 rounded-[18px] bg-primary/20 flex items-center justify-center border border-white/5 relative">
          <Navigation className="w-6 h-6 text-primary" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter leading-none">
            Orquestador Logístico
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Wifi className="w-3 h-3 text-green-400" />
            <span className="text-[9px] font-black text-green-400 uppercase tracking-[0.3em]">
              Tiempo Real Activo
            </span>
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => router.push('/admin/agents')}
        className="h-12 w-12 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all relative z-10"
      >
        <X className="w-6 h-6" />
      </Button>
    </div>
  );
}
