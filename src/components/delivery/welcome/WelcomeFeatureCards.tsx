
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function WelcomeFeatureCards() {
  return (
    <Card className="border-none shadow-[0_30px_100px_rgba(0,0,0,0.5)] rounded-[48px] bg-white overflow-hidden p-10 space-y-10 animate-in slide-in-from-bottom-10 duration-1000">
      <div className="space-y-8">
        <div className="flex items-start gap-6 group">
          <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-500 shrink-0 shadow-inner group-hover:bg-green-500 group-hover:text-white transition-all duration-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-black text-lg uppercase italic text-slate-900">
              <span className="text-primary">Genera</span> Ganancias
            </h4>
            <p className="text-xs text-slate-400 font-medium">Aumenta tus ingresos completando misiones logísticas en tiempo real.</p>
          </div>
        </div>

        <div className="flex items-start gap-6 group">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 shadow-inner group-hover:bg-primary group-hover:text-white transition-all duration-500">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <div className="space-y-1">
            <h4 className="font-black text-lg uppercase italic text-slate-900">Control Absoluto</h4>
            <p className="text-xs text-slate-400 font-medium">Tú eres el dueño de tu tiempo. Decide cuándo y dónde entrar en servicio.</p>
          </div>
        </div>
      </div>

      <Button asChild className="w-full h-20 rounded-[32px] bg-primary text-white font-black uppercase text-sm tracking-widest gap-3 border-b-[10px] border-blue-800 shadow-[0_20px_50px_rgba(59,130,246,0.3)] hover:translate-y-1 hover:border-b-[6px] active:translate-y-2 active:border-b-0 transition-all group">
        <Link href="/delivery/register" className="flex items-center gap-3">
          QUIERO SER REPARTIDOR 
          <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
        </Link>
      </Button>
    </Card>
  );
}
