
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, RotateCcw, Loader2, Sparkles, MessageCircle, Info } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { WasherRouteCard } from '@/components/delivery/dashboard/tabs/WasherRouteCard';
import { Badge } from '@/components/ui/badge';

/**
 * ZONA DE RECICLAJE ÉLITE - Misiones fuera de los 15 minutos iniciales.
 */
export default function RecycledMissionsPage() {
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const recycledQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'orders'),
      where('isLogisticsPublic', '==', true),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, [firestore, user?.uid]);

  const { data: rawOrders, isLoading } = useCollection(recycledQuery);

  const recycledOrders = useMemo(() => {
    if (!rawOrders) return [];
    return rawOrders.filter(order => {
      const createdAt = order.createdAt?.toMillis?.() || (order.createdAt?.seconds * 1000) || 0;
      const ageInSeconds = (now - createdAt) / 1000;
      return ageInSeconds >= 900; // Más de 15 minutos
    });
  }, [rawOrders, now]);

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl space-y-10 pb-32">
        <header className="space-y-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className="p-0 h-auto hover:bg-transparent text-slate-400 font-bold gap-2 group transition-colors hover:text-primary"
          >
            <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Volver al Radar</span>
          </Button>

          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-slate-900 rounded-[32px] flex items-center justify-center text-white shadow-2xl relative border border-white/5">
              <Trash2 className="w-10 h-10 text-primary" />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full border-4 border-[#f8fafc] flex items-center justify-center shadow-lg">
                <RotateCcw className="w-4 h-4 text-white animate-spin-slow" />
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none text-slate-900">Zona de Reciclaje</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-1">Protocolo de Recuperación • {recycledOrders.length} DISPONIBLES</p>
            </div>
          </div>
        </header>

        <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100 flex items-start gap-4 shadow-inner">
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-amber-500 shadow-sm shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase italic text-amber-900">¿Qué es esto?</h4>
            <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
              Aquí yacen las misiones que no fueron tomadas en sus primeros 15 minutos. Estas rutas son ideales para aplicar **contraofertas** y re-negociar el trato con el dueño.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>
        ) : recycledOrders.length > 0 ? (
          <div className="grid gap-8">
            {recycledOrders.map(order => (
              <WasherRouteCard 
                key={order.id} 
                order={order} 
                onAccept={() => {
                  toast({ title: "Iniciando Trato", description: "Envía una contraoferta ahora." });
                }} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-[64px] border-2 border-dashed border-slate-100">
            <Sparkles className="w-16 h-16 mx-auto text-slate-100 mb-6" />
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-300 leading-none">Sin misiones antiguas</h3>
            <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest mt-2 px-10">
              Todas las solicitudes están siendo atendidas en tiempo récord.
            </p>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 w-full h-16 bg-white/80 backdrop-blur-xl border-t flex items-center justify-center z-50">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Auditando Tratos en Tiempo Real</span>
        </div>
      </footer>
    </div>
  );
}
