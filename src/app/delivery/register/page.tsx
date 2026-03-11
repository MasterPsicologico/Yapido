
"use client";

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Truck, CheckCircle2, ShieldCheck, Zap, Loader2 } from 'lucide-react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useProfile } from '@/firebase/auth/use-profile';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function DeliveryRegisterPage() {
  const { user } = useUser();
  const { profile } = useProfile();
  const firestore = useFirestore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRegister = () => {
    if (!user || !firestore) return;
    setLoading(true);
    const userRef = doc(firestore, 'users', user.uid);
    
    updateDocumentNonBlocking(userRef, {
      role: 'repartidor',
      deliveryActive: true,
      updatedAt: serverTimestamp()
    });

    toast({
      title: "¡Bienvenido al Equipo!",
      description: "Ahora eres parte de Vitriniando Delivery.",
    });
    
    setTimeout(() => {
      router.push('/delivery/dashboard');
    }, 1500);
  };

  if (profile?.role === 'repartidor') {
    router.push('/delivery/dashboard');
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-10 space-y-4">
          <div className="w-20 h-20 bg-primary rounded-[32px] flex items-center justify-center text-white mx-auto shadow-2xl shadow-primary/20 animate-bounce">
            <Truck className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase">Únete a la Red de Delivery</h1>
          <p className="text-slate-500 font-medium max-w-md mx-auto">Genera ingresos entregando lo mejor de Aguachica a domicilio.</p>
        </div>

        <div className="grid gap-6 mb-10">
          <Card className="border-none shadow-md rounded-[24px]">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500 shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Pagos al Instante</h3>
                <p className="text-sm text-slate-400">Coordina tus pagos directamente con la tienda o el cliente.</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md rounded-[24px]">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Seguridad Pro</h3>
                <p className="text-sm text-slate-400">Plataforma verificada con registro de cada entrega.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button 
          onClick={handleRegister}
          disabled={loading}
          className="w-full h-16 rounded-full text-xl font-black gap-3 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><CheckCircle2 className="w-6 h-6" /> Quiero ser Repartidor</>}
        </Button>
      </main>
    </div>
  );
}
