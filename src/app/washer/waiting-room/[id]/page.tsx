
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Loader2 } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase, useCollection, updateDocumentNonBlocking, useUser } from '@/firebase';
import { doc, collection, query, orderBy, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

// IMPORTACIÓN DE MÓDULOS FRAGMENTADOS EN SU MÁXIMA EXPRESIÓN
import { TimerHero } from './components/TimerHero';
import { StatusIdentityCard } from './components/StatusIdentityCard';
import { OffersRadarSection } from './components/OffersRadarSection';
import { RetrySearchSection } from './components/RetrySearchSection';

export default function WasherWaitingRoom() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Listener Maestro de la Orden
  const orderRef = useMemoFirebase(() => (!firestore || !id || !user) ? null : doc(firestore, 'orders', id), [firestore, id, user]);
  const { data: order, isLoading: loadingOrder } = useDoc(orderRef);

  // Listener Maestro de Contraofertas
  const offersQuery = useMemoFirebase(() => {
    if (!firestore || !id || !user) return null;
    return query(collection(firestore, 'orders', id, 'offers'), orderBy('createdAt', 'desc'));
  }, [firestore, id, user]);
  const { data: offers } = useCollection(offersQuery);

  // MOTOR DE TIEMPO SINCRONIZADO CON LA NUBE
  useEffect(() => {
    if (!order?.createdAt) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const created = order.createdAt.toMillis?.() || (order.createdAt.seconds * 1000);
      const diffInSeconds = Math.floor((now - created) / 1000);
      const remaining = Math.max(0, 300 - diffInSeconds); // 5 minutos (300s) de protocolo
      
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [order?.createdAt]);

  const handleAcceptOffer = (offer: any) => {
    if (!firestore || !orderRef) return;
    
    // ASIGNACIÓN MAESTRA Y PROTOCOLO DE CIERRE DE TRATO
    updateDocumentNonBlocking(orderRef, {
      status: 'shipped',
      deliveryDriverId: offer.driverId,
      deliveryDriverName: offer.driverName,
      storeId: offer.storeId,
      storeName: offer.storeName,
      totalPrice: offer.price,
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      participants: arrayUnion(offer.driverId, offer.storeOwnerId || 'SYSTEM'),
      isLogisticsPublic: false // Bloqueo de radar público
    });

    // Sincronización de Historial de Proveedores
    if (user?.uid) {
      const userRef = doc(firestore, 'users', user.uid);
      updateDocumentNonBlocking(userRef, {
        contractedStores: arrayUnion(offer.storeId),
        lastContractedStore: offer.storeId
      });
    }

    toast({ title: "¡Trato Cerrado!", className: "bg-green-600 text-white" });
  };

  if (loadingOrder) return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Sincronizando Radar...</p>
      </div>
    </div>
  );

  const isAssigned = order?.status === 'shipped' || order?.status === 'delivered' || order?.status === 'at_destination';
  const minutes = timeLeft !== null ? Math.floor(timeLeft / 60) : 5;
  const seconds = timeLeft !== null ? timeLeft % 60 : 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl space-y-10 pb-32">
        
        {/* MÓDULO 1: CRONÓMETRO ÉLITE */}
        <TimerHero 
          isAssigned={isAssigned} 
          timeLeft={timeLeft} 
          minutes={minutes} 
          seconds={seconds} 
        />

        {/* MÓDULO 2: TARJETA DE IDENTIDAD Y ESTADO */}
        <StatusIdentityCard 
          order={order} 
          isAssigned={isAssigned} 
          onGoToTracking={() => router.push('/admin/orders')} 
        />

        {/* MÓDULO 3: RADAR DE CONTRAOFERTAS (SOLO SI NO ESTÁ ASIGNADO) */}
        {!isAssigned && (
          <OffersRadarSection 
            offers={offers} 
            onAccept={handleAcceptOffer} 
          />
        )}

        {/* MÓDULO 4: PROTOCOLO DE REINTENTO (SI EL TIEMPO AGOTA) */}
        {timeLeft === 0 && !isAssigned && (
          <RetrySearchSection />
        )}

      </main>
    </div>
  );
}
