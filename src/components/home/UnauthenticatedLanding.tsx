
"use client";

import Image from 'next/image';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';

export function UnauthenticatedLanding({ auth }: { auth: any }) {
  const handleLogin = () => initiateGoogleSignIn(auth);
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden flex items-center justify-center bg-black">
      <div className="absolute inset-0 z-0">
        <Image src="https://picsum.photos/seed/morrocoy/1920/1080" alt="Aguachica" fill className="object-cover opacity-60" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
      </div>
      <div className="container relative z-10 px-6 text-center space-y-8 max-w-4xl">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-secondary" />
          <span className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-white/90">Aguachica • Cesar</span>
        </div>
        <h1 className="text-6xl sm:text-8xl md:text-9xl font-black text-white leading-none tracking-tighter uppercase">
          Vitriniando <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-gradient block">Marketplace</span>
        </h1>
        <div className="pt-4">
          <Button onClick={handleLogin} size="lg" className="bg-primary text-white font-black h-16 px-10 rounded-full text-lg shadow-2xl transition-all group w-full sm:w-auto">
            ENTRAR A VITRINIAR <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
}
