
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Loader2 } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase, useCollection, updateDocumentNonBlocking, useUser } from '@/firebase';
import { doc, collection, query, orderBy, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { format, addHours, differenceInSeconds } from 'date-fns';

// IMPORTACIÓN DE MÓDULOS FRAGMENTADOS
import { TimerHero } from './components/TimerHero';
import { StatusIdentityCard } from './components/StatusIdentityCard';
import { OffersRadarSection } from './components/OffersRadarSection';
import { RetrySearchSection } from './components/RetrySearchSection';
import { MissionUsageCountdown } from '@/components/delivery/dashboard/active-mission/components/timer/MissionUsageCountdown';

/**
 * WasherWaitingRoom - Centro de Comando del Cliente.
 * Monitorea en tiempo real la asignación de su pedido.
 */
export default function WasherWaitingRoom() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [hasNotifiedAccepted, setHasNotifiedAccepted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // LISTENER MAESTRO: La Orden
  const orderRef = useMemoFirebase(() => (!firestore || !id || !user) ? null : doc(firestore, 'orders', id), [firestore, id, user]);
  const { data: order, isLoading: loadingOrder } = useDoc(orderRef);

  // LISTENER DE CONTRAOFERTAS (PARA NEGOCIACIÓN)
  const offersQuery = useMemoFirebase(() => {
    if (!firestore || !id || !user) return null;
    return query(collection(firestore, 'orders', id, 'offers'), orderBy('createdAt', 'desc'));
  }, [firestore, id, user]);
  const { data: offers } = useCollection(offersQuery);

  // MOTOR DE RELOJ GLOBAL (para Usage Countdown)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // MOTOR DE CRONÓMETRO ÉLITE (Para Asignación)
  useEffect(() => {
    if (!order?.createdAt) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const created = order.createdAt.toMillis?.() || (order.createdAt.seconds * 1000);
      const diffInSeconds = Math.floor((now - created) / 1000);
      const remaining = Math.max(0, 300 - diffInSeconds); // 5 MINUTOS DE PROTOCOLO
      
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [order?.createdAt]);

  const handleAcceptOffer = (offer: any) => {
    if (!firestore || !orderRef) return;
    
    // PROTOCOLO DE CIERRE DE TRATO: Vinculación de Tienda y Repartidor
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
      isLogisticsPublic: false
    });

    // Actualizar historial del cliente
    if (user?.uid) {
      const userRef = doc(firestore, 'users', user.uid);
      updateDocumentNonBlocking(userRef, {
        lastContractedStore: offer.storeId
      });
    }

    toast({ title: "¡Trato Cerrado!", className: "bg-green-600 text-white" });
  };

  // NOTIFICACIÓN EN TIEMPO REAL CUANDO SE ACEPTA EL PEDIDO
  useEffect(() => {
    if (!hasNotifiedAccepted && order?.status && order.status !== 'pending' && order.status !== 'searching' && order.status !== 'cancelled') {
      const storeName = order.storeName || 'una tienda';
      toast({ 
        title: "¡Pedido Aceptado!", 
        description: `Tu pedido ha sido aceptado por ${storeName}. El proceso ha comenzado.`,
        className: "bg-primary text-white shadow-2xl border-none font-black" 
      });
      setHasNotifiedAccepted(true);
    }
  }, [order?.status, hasNotifiedAccepted]);

  const parseTimestamp = (ts: any) => {
    if (!ts) return null;
    if (typeof ts.toDate === 'function') return ts.toDate();
    if (ts.seconds) return new Date(ts.seconds * 1000);
    return new Date(ts);
  };

  const usageProgress = useMemo(() => {
    if (order?.status !== 'delivered' || !order?.deliveredAt) return null;
    const deliveredAt = parseTimestamp(order.deliveredAt);
    if (!deliveredAt) return null;
    
    const durationHours = Number(order.requestHours || 5);
    const expiryTime = addHours(deliveredAt, durationHours);
    const totalSeconds = durationHours * 3600;
    
    const diffInSecs = differenceInSeconds(expiryTime, currentTime);
    const isExpired = diffInSecs < 0;
    const absSeconds = Math.abs(diffInSecs);
    
    return {
      hours: Math.floor(absSeconds / 3600),
      minutes: Math.floor((absSeconds % 3600) / 60),
      seconds: absSeconds % 60,
      isExpired,
      expiryLabel: format(expiryTime, 'HH:mm'),
      percentage: Math.min(100, (1 - (diffInSecs / totalSeconds)) * 100),
      dropOffTime: format(deliveredAt, 'HH:mm'),
      originalExpiry: format(expiryTime, 'HH:mm')
    };
  }, [order?.status, order?.deliveredAt, order?.requestHours, currentTime]);

  const handleSOS = () => {
    if (!firestore || !orderRef) return;
    const isConfirm = window.confirm("¿Estás seguro de que deseas reportar una avería? Un técnico o repartidor será notificado.");
    if (!isConfirm) return;

    updateDocumentNonBlocking(orderRef, {
      isSosActive: true,
      sosReportedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    toast({ title: "S.O.S Reportado", description: "Hemos notificado a la tienda y al repartidor.", className: "bg-red-600 text-white font-bold" });
  };

  if (loadingOrder) return (
    <div className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Sincronizando Radar...</p>
      </div>
    </div>
  );

  const isAssigned = [
    'preparing', 'picking_up', 'at_pickup', 'ready_for_pickup', 
    'at_store', 'delivered_to_driver', 'shipped', 'at_destination', 'delivered'
  ].includes(order?.status);
  const minutes = timeLeft !== null ? Math.floor(timeLeft / 60) : 5;
  const seconds = timeLeft !== null ? timeLeft % 60 : 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl space-y-10 pb-32">
        
        {order?.status === 'delivered' && usageProgress ? (
          <>
            <div className="text-center space-y-2 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h1 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900">
                Tu lavadora está instalada
              </h1>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">
                Disfruta de tu servicio
              </p>
            </div>
            <MissionUsageCountdown 
              progress={usageProgress} 
              hideControls={true}
              onSOS={handleSOS}
            />
          </>
        ) : (
          <>
            <TimerHero 
              isAssigned={isAssigned} 
              timeLeft={timeLeft} 
              minutes={minutes} 
              seconds={seconds} 
            />

            <StatusIdentityCard 
              order={order} 
              isAssigned={isAssigned} 
              onGoToTracking={() => router.push('/admin/orders')} 
            />

            {!isAssigned && (
              <OffersRadarSection 
                offers={offers} 
                onAccept={handleAcceptOffer} 
              />
            )}

            {timeLeft === 0 && !isAssigned && (
              <RetrySearchSection />
            )}
          </>
        )}

      </main>
    </div>
  );
}
