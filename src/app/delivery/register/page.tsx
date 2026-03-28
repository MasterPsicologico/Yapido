
"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Truck, CheckCircle2, ShieldCheck, Zap, Loader2, ScrollText } from 'lucide-react';
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

  // CORRECCIÓN QUIRÚRGICA: La redirección debe ser un efecto secundario, no ocurrir durante el renderizado.
  useEffect(() => {
    if (profile?.role === 'repartidor') {
      router.push('/delivery/dashboard');
    }
  }, [profile, router]);

  const handleRegister = () => {
    if (!user || !firestore || !acceptedTerms) return;
    setLoading(true);
    const userRef = doc(firestore, 'users', user.uid);
    
    updateDocumentNonBlocking(userRef, {
      role: 'repartidor',
      deliveryActive: true,
      updatedAt: serverTimestamp()
    });

    toast({ title: "¡Bienvenido al Equipo!", description: "Ahora eres parte de Vitriniando Delivery." });
    setTimeout(() => router.push('/delivery/dashboard'), 1500);
  };

  // Si ya es repartidor, no renderizamos nada para evitar parpadeos visuales
  if (profile?.role === 'repartidor') {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-10 space-y-4">
          <div className="w-20 h-20 bg-primary rounded-[32px] flex items-center justify-center text-white mx-auto shadow-2xl shadow-primary/20"><Truck className="w-10 h-10" /></div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase">Únete a la Red de Delivery</h1>
          <p className="text-slate-500 font-medium max-w-md mx-auto">Genera ingresos entregando lo mejor de Aguachica a domicilio.</p>
        </div>

        <div className="space-y-6 mb-10">
          <Card className="border-none shadow-md rounded-[24px]">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4 text-primary font-black uppercase text-xs tracking-widest"><ScrollText className="w-4 h-4" /> Términos de Servicio</div>
              <div className="bg-slate-50 p-4 rounded-2xl h-48 overflow-y-auto text-xs text-slate-500 leading-relaxed font-medium">
                <p className="mb-2">1. Como repartidor de Vitriniando, te comprometes a entregar los productos en el menor tiempo posible y en perfecto estado.</p>
                <p className="mb-2">2. El trato con clientes y dueños de negocio debe ser estrictamente profesional y respetuoso.</p>
                <p className="mb-2">3. No somos responsables de los pagos directos entre tú y el negocio; actuamos solo como plataforma de despacho.</p>
                <p className="mb-2">4. El uso de la plataforma implica la aceptación del registro de tu ubicación para el rastreo del pedido.</p>
                <p>5. Cualquier reporte de mal servicio podrá resultar en la suspensión permanente de tu cuenta.</p>
              </div>
              <div className="mt-6 flex items-center gap-3 bg-slate-900 text-white p-4 rounded-2xl">
                <Checkbox id="terms" checked={acceptedTerms} onCheckedChange={(v) => setAcceptedTerms(!!v)} className="border-white data-[state=checked]:bg-primary" />
                <label htmlFor="terms" className="text-xs font-black uppercase tracking-widest cursor-pointer">Acepto el compromiso de servicio</label>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button onClick={handleRegister} disabled={loading || !acceptedTerms} className="w-full h-16 rounded-full text-xl font-black gap-3 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20">
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle2 className="w-6 h-6" /> Quiero ser Repartidor</>}
        </Button>
      </main>
    </div>
  );
}
