
"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Truck, CheckCircle2, ShieldCheck, Zap, Loader2, ScrollText, Clock } from 'lucide-react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useProfile } from '@/firebase/auth/use-profile';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Checkbox } from "@/components/ui/checkbox";

export default function DeliveryRegisterPage() {
  const { user } = useUser();
  const { profile } = useProfile();
  const firestore = useFirestore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    // Si ya es repartidor o ya envió solicitud, lo mandamos al dashboard que ahora gestiona esos estados
    if (profile?.role === 'repartidor' || profile?.deliveryRequested) {
      router.push('/delivery/dashboard');
    }
  }, [profile, router]);

  const handleRegister = () => {
    if (!user || !firestore || !acceptedTerms) return;
    setLoading(true);
    const userRef = doc(firestore, 'users', user.uid);
    
    // CAMBIO LÓGICO: No se otorga el rol inmediatamente, se marca como solicitado para aprobación del admin.
    updateDocumentNonBlocking(userRef, {
      deliveryRequested: true,
      deliveryRequestDate: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    toast({ 
      title: "Solicitud Recibida", 
      description: "Tu perfil está en revisión por el administrador.",
      className: "bg-slate-900 text-white border-none"
    });
    
    setTimeout(() => router.push('/delivery/dashboard'), 1500);
  };

  if (profile?.role === 'repartidor' || profile?.deliveryRequested) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl animate-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-12 space-y-4">
          <div className="w-24 h-24 bg-primary rounded-[36px] flex items-center justify-center text-white mx-auto shadow-2xl shadow-primary/20">
            <Truck className="w-12 h-12" />
          </div>
          <h1 className="text-5xl font-black italic tracking-tighter uppercase text-slate-900 leading-none">Únete al Equipo</h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">Registro de Flota Profesional</p>
        </div>

        <div className="space-y-8 mb-12">
          <Card className="border-none shadow-2xl rounded-[40px] bg-white ring-1 ring-black/[0.03]">
            <CardContent className="p-10">
              <div className="flex items-center gap-3 mb-6 text-primary font-black uppercase text-[10px] tracking-[0.3em] italic">
                <ScrollText className="w-4 h-4" /> Compromiso de Servicio
              </div>
              <div className="bg-slate-50 p-6 rounded-[28px] h-64 overflow-y-auto text-xs text-slate-500 leading-relaxed font-medium no-scrollbar border border-slate-100 shadow-inner">
                <p className="mb-4">1. Como repartidor verificado de Vitriniando, te comprometes a entregar los productos en el menor tiempo posible y en perfecto estado físico.</p>
                <p className="mb-4">2. El trato con clientes y dueños de negocio debe ser estrictamente profesional, respetuoso y puntual.</p>
                <p className="mb-4">3. La plataforma retiene una comisión del 30% del valor del envío para mantenimiento del sistema y seguros operativos.</p>
                <p className="mb-4">4. El uso de la plataforma implica la aceptación obligatoria del registro de tu ubicación GPS en tiempo real durante cada misión activa.</p>
                <p className="mb-4">5. El administrador principal tiene la facultad de suspender permanentemente cualquier cuenta con reportes de mal servicio o fraude.</p>
                <p>6. Al registrarte, entras en un proceso de revisión manual. Serás notificado cuando tu cuenta sea activada.</p>
              </div>
              <div className="mt-8 flex items-center gap-4 bg-slate-900 text-white p-6 rounded-[28px] shadow-xl">
                <Checkbox 
                  id="terms" 
                  checked={acceptedTerms} 
                  onCheckedChange={(v) => setAcceptedTerms(!!v)} 
                  className="w-6 h-6 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:text-white rounded-lg" 
                />
                <label htmlFor="terms" className="text-[10px] font-black uppercase tracking-widest cursor-pointer leading-tight">
                  Acepto el compromiso de servicio y los términos de operación
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button 
          onClick={handleRegister} 
          disabled={loading || !acceptedTerms} 
          className="w-full h-20 rounded-[32px] text-xl font-black gap-4 bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/20 transition-all active:scale-95 disabled:grayscale"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle2 className="w-6 h-6" /> ENVIAR SOLICITUD</>}
        </Button>
        <p className="text-[8px] text-center text-slate-300 font-black uppercase tracking-[0.4em] mt-8">VERIFICACIÓN REQUERIDA POR EL ADMINISTRADOR</p>
      </main>
    </div>
  );
}
