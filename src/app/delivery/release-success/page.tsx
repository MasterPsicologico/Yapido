
"use client";

import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Truck, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function ReleaseSuccessPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500">
        <div className="relative mb-10">
          <div className="absolute inset-0 rounded-[40px] bg-green-500/20 animate-ping [animation-duration:3000ms]" />
          <div className="relative w-28 h-28 bg-green-500 rounded-[40px] flex items-center justify-center text-white shadow-2xl shadow-green-200">
            <CheckCircle2 className="w-14 h-14" />
          </div>
        </div>

        <div className="space-y-4 mb-12">
          <h1 className="text-4xl font-black italic tracking-tighter uppercase text-slate-900 leading-none">Pedido Liberado</h1>
          <p className="text-slate-500 font-bold text-sm max-w-sm mx-auto leading-relaxed uppercase tracking-tight">
            La Ciudadela de Agentes ha reasignado la ruta exitosamente. No te preocupes, puedes seguir operando.
          </p>
        </div>

        <div className="grid gap-4 w-full max-w-xs">
          <Button asChild className="h-16 rounded-[24px] bg-primary hover:bg-primary/90 text-white font-black text-lg uppercase tracking-widest gap-3 shadow-xl">
            <Link href="/delivery/dashboard">
              BUSCAR NUEVAS RUTAS <Truck className="w-6 h-6" />
            </Link>
          </Button>
          
          <div className="pt-6 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Protocolo Finalizado</span>
            </div>
            <div className="h-1 w-16 bg-slate-200 rounded-full" />
          </div>
        </div>
      </main>
    </div>
  );
}
