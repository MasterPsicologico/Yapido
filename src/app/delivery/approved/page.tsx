
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Sparkles, 
  Truck, 
  Zap, 
  TrendingUp, 
  ArrowRight,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { useProfile } from '@/firebase/auth/use-profile';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function DeliveryApprovedPage() {
  const { user, profile, isLoading } = useProfile();
  const firestore = useFirestore();
  const router = useRouter();
  const [isFinishing, setIsFinishing] = useState(false);

  // Protección: Solo para repartidores aprobados que no han visto la página
  useEffect(() => {
    if (!isLoading) {
      if (profile?.role !== 'repartidor' || profile?.hasSeenApproval === true) {
        router.replace('/delivery/dashboard');
      }
    }
  }, [profile, isLoading, router]);

  const handleFinishOnboarding = () => {
    if (!user || !firestore) return;
    setIsFinishing(true);
    
    const userRef = doc(firestore, 'users', user.uid);
    updateDocumentNonBlocking(userRef, {
      hasSeenApproval: true,
      updatedAt: serverTimestamp()
    });

    toast({ 
      title: "¡Bienvenido a bordo!", 
      description: "Tu panel operativo está listo.",
      className: "bg-primary text-white border-none" 
    });

    setTimeout(() => {
      router.replace('/delivery/dashboard');
    }, 1000);
  };

  if (isLoading || isFinishing) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-white overflow-hidden selection:bg-primary selection:text-white">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Efectos de fondo Élite */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full pointer-events-none">
          <div className="absolute top-1/4 left-0 w-64 h-64 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-secondary/20 rounded-full blur-[120px] animate-pulse [animation-duration:4s]" />
        </div>

        <div className="max-w-xl w-full space-y-12 relative z-10 animate-in fade-in zoom-in duration-1000">
          
          {/* Cabecera de Triunfo */}
          <div className="text-center space-y-6">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-green-500/20 rounded-[40px] animate-ping [animation-duration:3s]" />
              <div className="relative w-28 h-28 bg-gradient-to-br from-green-400 to-green-600 rounded-[40px] flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.4)] border border-white/20">
                <CheckCircle2 className="w-14 h-14 text-white" />
                <Sparkles className="absolute -top-3 -right-3 w-10 h-10 text-yellow-400 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-6xl md:text-7xl font-black italic tracking-tighter uppercase leading-none">
                ¡CUENTA <br /> <span className="text-primary">APROBADA!</span>
              </h1>
              <p className="text-slate-400 font-bold text-sm uppercase tracking-[0.4em] pt-2">
                Bienvenido a la Flota Élite
              </p>
            </div>
          </div>

          {/* Tarjetas de Entrenamiento Rápido */}
          <div className="grid gap-4">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] flex items-start gap-5 group hover:bg-white/10 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0 shadow-inner">
                <Zap className="w-6 h-6 fill-current" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-lg uppercase italic tracking-tight">Activa tu Turno</h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">Usa el botón central para entrar en servicio. Recuerda subir una foto de "Turno" para personalizar tu dashboard.</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] flex items-start gap-5 group hover:bg-white/10 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center text-secondary shrink-0 shadow-inner">
                <Truck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-lg uppercase italic tracking-tight">Acepta Rutas Libres</h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">Mira las órdenes disponibles en el mapa. Una vez aceptada, el sistema guiará tu navegación.</p>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] flex items-start gap-5 group hover:bg-white/10 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-yellow-500 shrink-0 shadow-inner">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-lg uppercase italic tracking-tight">Gana Reputación</h4>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">Entrega con una sonrisa y cumple los tiempos para subir a nivel Élite o Leyenda.</p>
              </div>
            </div>
          </div>

          {/* Acción Final */}
          <div className="pt-6 space-y-6">
            <Button 
              onClick={handleFinishOnboarding}
              className="w-full h-20 rounded-[32px] bg-primary hover:bg-primary/90 text-white font-black text-xl uppercase tracking-[0.1em] italic gap-4 shadow-[0_20px_50px_rgba(59,130,246,0.3)] border-b-[8px] border-blue-800 active:border-b-0 active:translate-y-2 transition-all group"
            >
              ¡ENTENDIDO, INICIAR MISIÓN! <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </Button>
            
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-slate-500">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Protocolo de Seguridad Activo</span>
              </div>
              <div className="h-1 w-20 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-progress-loading" />
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer Minimalista */}
      <footer className="p-10 text-center relative z-10">
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em]">Vitriniando AI Central • Aguachica Digital</p>
      </footer>
    </div>
  );
}
