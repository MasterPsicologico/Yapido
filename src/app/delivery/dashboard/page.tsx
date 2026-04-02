
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, useDoc, addDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, doc, serverTimestamp, arrayUnion, arrayRemove, orderBy } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

// Componentes Fragmentados
import { WeeklyChallenge } from '@/components/delivery/weekly-challenge';
import { DashboardHeader } from '@/components/delivery/dashboard/DashboardHeader';
import { ActiveMissionView } from '@/components/delivery/dashboard/ActiveMissionView';
import { RoutesTab } from '@/components/delivery/dashboard/tabs/RoutesTab';
import { EarningsTab } from '@/components/delivery/dashboard/tabs/EarningsTab';
import { releaseOrder } from '@/ai/flows/release-order-flow';
import { AgentProgressOverlay } from '@/components/agents/AgentProgressOverlay';

export default function DeliveryDashboardPage() {
  const { user } = useUser();
  const { profile, level, isLoading: loadingProfile } = useProfile();
  const firestore = useFirestore();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("available");
  const [isOnline, setIsOnline] = useState(true);
  const [isReleasing, setIsReleasing] = useState(false);
  const [releaseLogs, setReleaseLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!loadingProfile && profile && !profile.phoneNumber) {
      toast({ title: "Acceso Restringido", description: "Registra tu teléfono.", variant: "destructive" });
      router.push('/profile');
    }
  }, [profile, loadingProfile, router]);

  const isConfirmedRepartidor = profile?.role === 'repartidor' || profile?.role === 'admin';

  // CONSULTAS FIRESTORE OPTIMIZADAS PARA CUMPLIR CON REGLAS DE SEGURIDAD
  const availableOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !isConfirmedRepartidor || !isOnline) return null;
    
    // Si el repartidor tiene una tienda vinculada, vemos las de esa tienda que sean públicas para logística
    if (profile?.linkedStoreId) {
      return query(
        collection(firestore, 'orders'), 
        where('storeId', '==', profile.linkedStoreId),
        where('isLogisticsPublic', '==', true),
        where('status', 'in', ['pending', 'preparing', 'ready_for_pickup']),
        orderBy('createdAt', 'desc')
      );
    }

    // Si no, vemos las públicas generales
    return query(
      collection(firestore, 'orders'), 
      where('isLogisticsPublic', '==', true), 
      where('status', 'in', ['preparing', 'ready_for_pickup']),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, isConfirmedRepartidor, isOnline, profile?.linkedStoreId]);

  const myDeliveriesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !isConfirmedRepartidor) return null;
    return query(
      collection(firestore, 'orders'), 
      where('participants', 'array-contains', user.uid), 
      where('status', 'in', ['shipped', 'at_store', 'delivered_to_driver'])
    );
  }, [firestore, user?.uid, isConfirmedRepartidor]);

  const historyQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !isConfirmedRepartidor) return null;
    return query(
      collection(firestore, 'orders'), 
      where('participants', 'array-contains', user.uid), 
      where('status', '==', 'delivered')
    );
  }, [firestore, user?.uid, isConfirmedRepartidor]);

  const { data: rawAvailable } = useCollection(availableOrdersQuery);
  const { data: rawMy } = useCollection(myDeliveriesQuery);
  const { data: history } = useCollection(historyQuery);

  // ESTADOS DERIVADOS
  const stats = useMemo(() => ({
    rating: profile?.avgRating || 5.0,
    deliveredCount: history?.length || 0
  }), [profile, history]);

  const activeMission = useMemo(() => 
    rawMy?.find(o => o.deliveryDriverId === user?.uid && ['shipped', 'at_store', 'delivered_to_driver'].includes(o.status)),
    [rawMy, user?.uid]
  );

  const customerRef = useMemoFirebase(() => 
    (!firestore || !activeMission?.customerId) ? null : doc(firestore, 'users', activeMission.customerId), 
    [firestore, activeMission?.customerId]
  );
  const { data: customerProfile } = useDoc(customerRef);

  // ACCIONES MAESTRAS
  const handleAcceptOrder = (orderId: string) => {
    if (!firestore || !user) return;
    const orderRef = doc(firestore, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { 
      deliveryDriverId: user.uid, 
      deliveryDriverName: profile?.displayName || user.displayName || 'Repartidor', 
      status: 'shipped', 
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      participants: arrayUnion(user.uid)
    });
    toast({ title: "Ruta Aceptada", description: "Iniciando misión logística." });
    setActiveTab("my-deliveries");
  };

  const handleUpdateMissionStatus = (newStatus: string) => {
    if (!activeMission || !firestore) return;
    const orderRef = doc(firestore, 'orders', activeMission.id);
    const updateData: any = { 
      status: newStatus, 
      updatedAt: serverTimestamp() 
    };
    
    if (newStatus === 'delivered_to_driver') updateData.pickedUpAt = serverTimestamp();
    if (newStatus === 'delivered') updateData.deliveredAt = serverTimestamp();

    updateDocumentNonBlocking(orderRef, updateData);
    toast({ title: "Estado Actualizado", description: `Pedido movido a ${newStatus.toUpperCase()}` });
  };

  const handleReleaseOrder = async (reason: string) => {
    if (!activeMission || !user || !firestore || !reason) return;

    const orderRef = doc(firestore, 'orders', activeMission.id);
    const incidentRef = collection(firestore, 'incidents');
    
    addDocumentNonBlocking(incidentRef, {
      orderId: activeMission.id, driverId: user.uid, driverName: profile?.displayName || 'Repartidor',
      reason, hasProducts: activeMission.status === 'delivered_to_driver', orderValue: activeMission.totalPrice || 0,
      storeId: activeMission.storeId, storeName: activeMission.storeName, createdAt: serverTimestamp(),
      type: 'ORDER_RELEASE', agentOwner: 'soporte'
    });

    updateDocumentNonBlocking(orderRef, {
      status: 'ready_for_pickup', deliveryDriverId: null, deliveryDriverName: null,
      isLogisticsPublic: true, updatedAt: serverTimestamp(), participants: arrayRemove(user.uid)
    });

    setIsReleasing(true);
    setReleaseLogs(["Protocolo de liberación activado...", "Sincronizando Ciudadela de Agentes..."]);

    try {
      const result = await releaseOrder({
        orderId: activeMission.id, driverId: user.uid, reason,
        hasProducts: activeMission.status === 'delivered_to_driver', orderValue: activeMission.totalPrice || 0,
        storeId: activeMission.storeId, storeName: activeMission.storeName
      });
      setReleaseLogs(prev => [...prev, ...result.agentLogs]);
    } catch (e) {
      setReleaseLogs(prev => [...prev, "Finalizando procesos internos..."]);
    }
  };

  if (loadingProfile) return <div className="fixed inset-0 flex items-center justify-center bg-white"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;
  if (!isConfirmedRepartidor) return (
    <div className="flex flex-col min-h-screen items-center justify-center p-8 text-center gap-6">
      <h2 className="text-2xl font-black italic uppercase text-slate-400">Acceso Restringido</h2>
      <p className="text-slate-400 max-w-xs">Debes ser un repartidor verificado para acceder al dashboard.</p>
      <Button onClick={() => router.push('/profile')}>Configurar Perfil</Button>
    </div>
  );

  return (
    <div className="flex flex-col h-[100dvh] bg-[#f8fafc] overflow-hidden">
      <Navbar />
      
      <AgentProgressOverlay 
        isOpen={isReleasing} 
        logs={releaseLogs} 
        onComplete={() => { setIsReleasing(false); router.replace('/delivery/release-success'); }} 
      />

      {activeMission ? (
        <ActiveMissionView 
          mission={activeMission} 
          customerProfile={customerProfile} 
          onUpdateStatus={handleUpdateMissionStatus}
          onRelease={handleReleaseOrder} 
          onOpenMaps={(addr) => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`, '_blank')} 
        />
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <DashboardHeader 
            profile={profile} level={level} stats={stats} 
            isOnline={isOnline} onToggleOnline={() => setIsOnline(!isOnline)} 
          />

          <main className="container mx-auto px-4 py-8 max-w-2xl">
            <WeeklyChallenge orders={history} />
            
            <Tabs defaultValue="available" value={activeTab} onValueChange={setActiveTab} className="mt-10 space-y-8">
              <TabsList className="bg-white border h-16 p-1 rounded-full shadow-sm w-full grid grid-cols-3">
                <TabsTrigger value="available" className="rounded-full font-black text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white">RUTAS LIBRES</TabsTrigger>
                <TabsTrigger value="my-deliveries" className="rounded-full font-black text-[10px] data-[state=active]:bg-secondary data-[state=active]:text-white">ACTIVAS ({rawMy?.filter(o => o.deliveryDriverId === user?.uid).length || 0})</TabsTrigger>
                <TabsTrigger value="earnings" className="rounded-full font-black text-[10px] data-[state=active]:bg-slate-900 data-[state=active]:text-white">INGRESOS</TabsTrigger>
              </TabsList>

              <TabsContent value="available">
                <RoutesTab 
                  isOnline={isOnline} 
                  orders={rawAvailable || []} 
                  onAccept={handleAcceptOrder} 
                  onGoOnline={() => setIsOnline(true)} 
                />
              </TabsContent>

              <TabsContent value="my-deliveries">
                <div className="text-center py-20 text-slate-300 font-black uppercase italic tracking-widest">Sin entregas activas</div>
              </TabsContent>

              <TabsContent value="earnings">
                <EarningsTab balance={profile?.balance || 0} />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      )}
    </div>
  );
}
