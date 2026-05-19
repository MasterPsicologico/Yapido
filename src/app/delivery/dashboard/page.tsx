
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, useDoc } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, doc, serverTimestamp, arrayUnion, arrayRemove, limit, or, documentId } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/image-compression';
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns';

import { WeeklyChallenge } from '@/components/delivery/weekly-challenge';
import { DashboardHeader } from '@/components/delivery/dashboard/DashboardHeader';
import { EconomyPanel } from '@/components/delivery/dashboard/economy/EconomyPanel';
import { ActiveMissionView } from '@/components/delivery/dashboard/ActiveMissionView';
import { DriverLiveMap } from '@/components/delivery/dashboard/driver-live-map/DriverLiveMap';
import { RoutesTab } from '@/components/delivery/dashboard/tabs/RoutesTab';
import { EarningsTab } from '@/components/delivery/dashboard/tabs/EarningsTab';
import { MyDeliveriesTab } from '@/components/delivery/dashboard/tabs/MyDeliveriesTab';
import { releaseOrder } from '@/ai/flows/release-order-flow';
import { AgentProgressOverlay } from '@/components/agents/AgentProgressOverlay';
import { FleetPanel } from '@/components/delivery/fleet/FleetPanel';

// IMPORTACIÓN DE COMPONENTES ATÓMICOS DE BIENVENIDA
import { WelcomeLanding } from '@/components/delivery/welcome/WelcomeLanding';

export default function DeliveryDashboardPage() {
  const { user } = useUser();
  const { profile, level, isAdmin, isRepartidor, isLoading: loadingProfile } = useProfile();
  const firestore = useFirestore();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("available");
  const [isOnline, setIsOnline] = useState(true);
  const [isReleasing, setIsReleasing] = useState(false);
  const [releaseLogs, setReleaseLogs] = useState<string[]>([]);
  const [isUploadingDashboard, setIsUploadingDashboard] = useState<'active' | 'inactive' | null>(null);
  const [isFleetPanelOpen, setIsFleetPanelOpen] = useState(false);
  const [showLiveMap, setShowLiveMap] = useState(false);
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  
  useEffect(() => {
    if (!loadingProfile && profile) {
      setIsOnline(profile.deliveryActive ?? true);
    }
  }, [loadingProfile, profile?.deliveryActive]);
  
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleOnline = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    
    if (firestore && user?.uid) {
      try {
        const userRef = doc(firestore, 'users', user.uid);
        await updateDocumentNonBlocking(userRef, { 
          deliveryActive: newStatus,
          lastOnlineToggle: serverTimestamp()
        });
        toast({ 
          title: newStatus ? "¡Estás en línea!" : "Te has desconectado", 
          description: newStatus ? "Recibirás notificaciones de pedidos" : "No recibirás nuevos pedidos",
          className: newStatus ? "bg-green-600 text-white" : "bg-slate-600 text-white"
        });
      } catch (err) {
        console.error('Error toggling online status:', err);
        toast({ title: "Error de conexión", variant: "destructive" });
      }
    }
  };

  useEffect(() => {
    if (!loadingProfile && profile?.role === 'repartidor' && profile?.hasSeenApproval === false && !isAdmin) {
      router.replace('/delivery/approved');
    }
  }, [profile, loadingProfile, router, isAdmin]);

  const dashboardConfigRef = useMemoFirebase(() => doc(firestore, 'appConfig', 'delivery_dashboard'), [firestore]);
  const { data: dashboardConfig } = useDoc(dashboardConfigRef);

  const welcomeConfigRef = useMemoFirebase(() => doc(firestore, 'appConfig', 'delivery_welcome'), [firestore]);
  const { data: welcomeConfig } = useDoc(welcomeConfigRef);

  // Leer configuración de comisión del store vinculado al repartidor
  const linkedStoreRef = useMemoFirebase(() => 
    (!firestore || !profile?.linkedStoreId) ? null : doc(firestore, 'stores', profile.linkedStoreId), 
    [firestore, profile?.linkedStoreId]
  );
  const { data: linkedStoreData } = useDoc(linkedStoreRef);
  const commissionRate = linkedStoreData?.commissionRate ?? 0.20;

  // ─── FLEET: Query the store owned by this user ───
  const ownedStoreQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'stores'), where('ownerId', '==', user.uid), limit(1));
  }, [firestore, user?.uid]);
  const { data: ownedStores } = useCollection(ownedStoreQuery);
  const ownedStore = ownedStores?.[0] || null;

  // Resolve driver profiles from privateDrivers array
  const fleetDriverUids: string[] = ownedStore?.privateDrivers || [];
  const fleetDriversQuery = useMemoFirebase(() => {
    if (!firestore || fleetDriverUids.length === 0) return null;
    // Firestore 'in' supports up to 10 items max
    return query(collection(firestore, 'users'), where(documentId(), 'in', fleetDriverUids.slice(0, 10)));
  }, [firestore, JSON.stringify(fleetDriverUids)]);
  const { data: fleetDriverProfiles } = useCollection(fleetDriversQuery);
  const fleetDrivers = fleetDriverProfiles || [];

  const allActiveOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !isOnline || loadingProfile) return null;
    if (!isRepartidor && !isAdmin) return null;

    const publicConstraint = where('isLogisticsPublic', '==', true);
    if (profile?.linkedStoreId) {
      return query(collection(firestore, 'orders'), or(publicConstraint, where('storeId', '==', profile.linkedStoreId)), limit(50));
    }
    return query(collection(firestore, 'orders'), publicConstraint, limit(50));
  }, [firestore, user?.uid, isOnline, profile?.linkedStoreId, isRepartidor, isAdmin, loadingProfile]);

  const { data: rawAllOrders } = useCollection(allActiveOrdersQuery);

  const availableOrders = useMemo(() => {
    if (!rawAllOrders) return [];
    return rawAllOrders.filter(order => {
      if (!['pending', 'preparing', 'ready_for_pickup'].includes(order.status)) return false;
      if (order.deliveryDriverId && order.deliveryDriverId !== user?.uid) return false;
      
      const createdAt = order.createdAt?.toMillis?.() || (order.createdAt?.seconds * 1000) || 0;
      const ageInSeconds = (now - createdAt) / 1000;
      return ageInSeconds < 900; 
    }).sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
  }, [rawAllOrders, user?.uid, now]);

  const hasRecycledOrders = useMemo(() => {
    if (!rawAllOrders) return false;
    return rawAllOrders.some(order => {
      if (!['pending', 'preparing', 'ready_for_pickup'].includes(order.status)) return false;
      if (order.deliveryDriverId && order.deliveryDriverId !== user?.uid) return false;
      const createdAt = order.createdAt?.toMillis?.() || (order.createdAt?.seconds * 1000) || 0;
      const ageInSeconds = (now - createdAt) / 1000;
      return ageInSeconds >= 900;
    });
  }, [rawAllOrders, now, user?.uid]);

  const myDeliveriesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'orders'), 
      where('participants', 'array-contains', user.uid)
    );
  }, [firestore, user?.uid]);

  const { data: rawMy } = useCollection(myDeliveriesQuery);

  const sortedMyOrders = useMemo(() => {
    if (!rawMy) return [];
    const validStatuses = ['pending', 'preparing', 'ready_for_pickup', 'picking_up', 'at_pickup', 'shipped', 'at_destination', 'at_store', 'delivered_to_driver', 'delivered', 'completed'];
    return [...rawMy]
      .filter(o => validStatuses.includes(o.status))
      .sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || (a.createdAt?.seconds * 1000) || 0;
        const timeB = b.createdAt?.toMillis?.() || (b.createdAt?.seconds * 1000) || 0;
        return timeB - timeA;
      });
  }, [rawMy]);

  const activeMission = useMemo(() => 
    sortedMyOrders.find(o => 
      o.deliveryDriverId === user?.uid && 
      ['pending', 'preparing', 'ready_for_pickup', 'picking_up', 'at_pickup', 'shipped', 'at_destination', 'at_store', 'delivered_to_driver'].includes(o.status)
    ),
    [sortedMyOrders, user?.uid]
  );

  const activeBadgeCount = useMemo(() => 
    sortedMyOrders.filter(o => 
      o.deliveryDriverId === user?.uid && 
      ['delivered', 'picking_up', 'at_pickup', 'shipped', 'at_destination', 'at_store', 'delivered_to_driver'].includes(o.status)
    ).length,
    [sortedMyOrders, user?.uid]
  );

  const revenueToday = useMemo(() => {
    if (!sortedMyOrders) return 0;
    const start = startOfDay(new Date());
    const end = endOfDay(new Date());
    return sortedMyOrders.filter(o => {
      const ts = o.completedAt || o.deliveredAt || o.createdAt;
      const date = ts?.toDate?.() || (ts?.seconds ? new Date(ts.seconds * 1000) : null);
      if (!date) return false;
      return isWithinInterval(date, { start, end });
    }).reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
  }, [sortedMyOrders]);

  const customerRef = useMemoFirebase(() => 
    (!firestore || !activeMission?.customerId) ? null : doc(firestore, 'users', activeMission.customerId), 
    [firestore, activeMission?.customerId]
  );
  const { data: customerProfile } = useDoc(customerRef);

  const handleAcceptOrder = (orderId: string) => {
    if (!firestore || !user) return;
    const orderRef = doc(firestore, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, { 
      deliveryDriverId: user.uid, 
      deliveryDriverName: profile?.displayName || user.displayName || 'Repartidor', 
      status: 'ready_for_pickup', 
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      participants: arrayUnion(user.uid),
      isLogisticsPublic: false
    });
    toast({ title: "Ruta Aceptada", className: "bg-primary text-white" });
  };

  const handleUpdateMissionStatus = (newStatus: string, metadata: any = {}) => {
    const id = metadata.id || activeMission?.id;
    if (!firestore || !id) return;
    
    const orderRef = doc(firestore, 'orders', id);
    
    // Extract isPickupDone before spreading metadata into the update
    const { isPickupDone, ...restMetadata } = metadata;
    const updateData: any = { ...restMetadata, status: newStatus, updatedAt: serverTimestamp() };
    
    if (newStatus === 'delivered') {
      updateData.deliveredAt = serverTimestamp();
      toast({ title: "¡Instalación Exitosa!", description: "Equipo en uso." });
      setActiveTab("my-deliveries");
    }

    if (newStatus === 'completed') {
      updateData.completedAt = serverTimestamp();
      // Si viene del flujo de recogida, grabar metadata de pickup
      if (isPickupDone) {
        updateData.pickupCompletedAt = serverTimestamp();
        updateData.isPickupDone = true;
        toast({ title: "¡Lavadora Recogida!", description: "Misión finalizada exitosamente.", className: "bg-green-600 text-white" });
        
        // Liberar inventario
        if (activeMission?.storeId && activeMission?.washerId) {
          const invRef = doc(firestore, `stores/${activeMission.storeId}/inventory/${activeMission.washerId}`);
          updateDocumentNonBlocking(invRef, { status: 'available' }).catch(console.error);
        }
      } else {
        toast({ title: "Contrato Finalizado", className: "bg-green-600 text-white" });
      }
    }

    if (newStatus === 'debt_pending') {
      updateData.debtStatus = 'pending';
      updateData.debtCreatedAt = serverTimestamp();
      toast({ title: "Deuda Registrada", description: "Se ha marcado como deuda pendiente.", className: "bg-amber-500 text-white" });
      
      // Liberar inventario aunque no haya pagado, ya que físicamente se recogió
      if (activeMission?.storeId && activeMission?.washerId) {
        const invRef = doc(firestore, `stores/${activeMission.storeId}/inventory/${activeMission.washerId}`);
        updateDocumentNonBlocking(invRef, { status: 'available' }).catch(console.error);
      }
    }

    if (newStatus === 'shipped') {
      toast({ title: "En Camino", description: "Dirígete al destino del cliente.", className: "bg-blue-600 text-white" });
      
      // Marcar inventario como en uso
      const wId = restMetadata.washerId || activeMission?.washerId;
      if (activeMission?.storeId && wId) {
        const invRef = doc(firestore, `stores/${activeMission.storeId}/inventory/${wId}`);
        updateDocumentNonBlocking(invRef, { status: 'in_use' }).catch(console.error);
      }
    }

    if (newStatus === 'at_destination') {
      toast({ title: "¡Llegaste!", description: "Estás en el destino. Instala la lavadora.", className: "bg-blue-700 text-white" });
    }

    if (newStatus === 'picking_up') {
      toast({ title: "Recogida Iniciada", description: "En camino a recoger la lavadora.", className: "bg-orange-500 text-white" });
    }

    if (newStatus === 'at_pickup') {
      toast({ title: "En el Sitio", description: "Has llegado al punto de recogida.", className: "bg-orange-600 text-white" });
    }
    
    updateDocumentNonBlocking(orderRef, updateData);
  };

  const handleStartTracking = () => {
    setIsTrackingActive(true);
  };

  const handleStopTracking = () => {
    setIsTrackingActive(false);
    toast({ title: "Ruta finalizada", description: "Seguimiento detenido" });
  };

  const handleReleaseOrder = async (reason: string) => {
    if (!activeMission || !user || !firestore || !reason) return;
    const orderRef = doc(firestore, 'orders', activeMission.id);
    
    // Guardar info de la misión liberada para posible recuperación
    const releasedMissionId = activeMission.id;
    const releasedDriverId = activeMission.deliveryDriverId;
    
    updateDocumentNonBlocking(orderRef, {
      status: 'ready_for_pickup',
      deliveryDriverId: null,
      deliveryDriverName: null,
      isLogisticsPublic: true, // Se pone público para que otro repartidor pueda tomarlo
      updatedAt: serverTimestamp(),
      releasedBy: user.uid,
      releasedAt: serverTimestamp(),
      releaseReason: reason
    });
    
    // Limpiar la misión activa del repartidor
    setIsReleasing(true);
    setReleaseLogs(["Iniciando protocolo de liberación..."]);
    try {
      const result = await releaseOrder({
        orderId: activeMission.id, driverId: user.uid, reason,
        hasProducts: false, orderValue: activeMission.totalPrice || 0,
        storeId: activeMission.storeId, storeName: activeMission.storeName
      });
      setReleaseLogs(prev => [...prev, ...result.agentLogs]);
    } catch (e) {
      setIsReleasing(false);
    }
  };

  const handleDashboardImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'active' | 'inactive') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingDashboard(target);
    try {
      const compressed = await compressImage(file, 1920, 1080, 0.85);
      const updateKey = target === 'active' ? 'bgActive' : 'bgInactive';
      await updateDocumentNonBlocking(dashboardConfigRef, { [updateKey]: compressed, updatedAt: serverTimestamp() });
      toast({ title: "Fondo actualizado" });
    } finally {
      setIsUploadingDashboard(null);
    }
  };

  if (loadingProfile) return <div className="fixed inset-0 flex items-center justify-center bg-white"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

  const isConfirmedRepartidor = profile?.role === 'repartidor';

  if (!isConfirmedRepartidor) {
    return (
      <WelcomeLanding 
        isAdmin={isAdmin} 
        config={welcomeConfig} 
        onUpdateConfig={(data) => updateDocumentNonBlocking(welcomeConfigRef, { ...data, updatedAt: serverTimestamp() })} 
      />
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-[#f8fafc] overflow-hidden">
      <Navbar />
      <AgentProgressOverlay isOpen={isReleasing} logs={releaseLogs} onComplete={() => { setIsReleasing(false); router.replace('/delivery/release-success'); }} />

      {activeMission && showLiveMap ? (
        <DriverLiveMap
          order={activeMission}
          customerProfile={customerProfile}
          isActive={isTrackingActive}
          onStartTracking={handleStartTracking}
          onStopTracking={handleStopTracking}
          onClose={() => setShowLiveMap(false)}
          onUpdateStatus={handleUpdateMissionStatus}
          onOpenMaps={(addr) => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`, '_blank')}
        />
      ) : activeMission ? (
        <ActiveMissionView 
          mission={activeMission} 
          customerProfile={customerProfile} 
          onUpdateStatus={handleUpdateMissionStatus} 
          onRelease={handleReleaseOrder} 
          onOpenMaps={(addr) => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`, '_blank')}
          onOpenLiveMap={() => setShowLiveMap(true)}
        />
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <DashboardHeader 
            profile={profile} level={level} stats={{ rating: profile?.avgRating || 5.0, deliveredCount: 0 }} 
            isOnline={isOnline} onToggleOnline={handleToggleOnline} 
            isAdmin={isAdmin} dashboardConfig={dashboardConfig} 
            onImageUpload={handleDashboardImageUpload} isUploading={isUploadingDashboard}
          />
          <EconomyPanel activeCount={activeBadgeCount} revenueToday={revenueToday} orders={sortedMyOrders} commissionRate={commissionRate} isAdmin={isAdmin} />
          <main className="container mx-auto px-4 py-8 max-w-2xl">
            <Tabs defaultValue="available" value={activeTab} onValueChange={setActiveTab} className="mb-12 space-y-8">
              <TabsList className="bg-white border h-16 p-1 rounded-full shadow-sm w-full grid grid-cols-3 overflow-visible">
                <TabsTrigger value="available" className="rounded-full font-black text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white uppercase truncate">Radar</TabsTrigger>
                <TabsTrigger value="my-deliveries" className="rounded-full font-black text-[10px] data-[state=active]:bg-secondary data-[state=active]:text-white uppercase relative overflow-visible">
                  <div className="flex items-center justify-center gap-2">
                    <span>En Curso</span>
                    {activeBadgeCount > 0 && (
                      <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-lg animate-in zoom-in shrink-0 border-2 border-white">
                        {activeBadgeCount}
                      </span>
                    )}
                  </div>
                </TabsTrigger>
                <TabsTrigger value="earnings" className="rounded-full font-black text-[10px] data-[state=active]:bg-slate-900 data-[state=active]:text-white uppercase truncate">Balance</TabsTrigger>
              </TabsList>
              <TabsContent value="available">
                <RoutesTab 
                  isOnline={isOnline} 
                  orders={availableOrders} 
                  hasRecycled={hasRecycledOrders}
                  onAccept={handleAcceptOrder} 
                  onGoOnline={handleToggleOnline}
                  ownedStore={ownedStore}
                  fleetDrivers={fleetDrivers}
                  onOpenFleetPanel={() => setIsFleetPanelOpen(true)}
                />
              </TabsContent>
              <TabsContent value="my-deliveries">
                <MyDeliveriesTab rentals={sortedMyOrders} onUpdateStatus={handleUpdateMissionStatus} />
              </TabsContent>
              <TabsContent value="earnings">
                <EarningsTab balance={profile?.balance || 0} commissionRate={commissionRate} revenueToday={revenueToday} />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      )}

      {/* Fleet Management Panel Overlay */}
      <FleetPanel
        isOpen={isFleetPanelOpen}
        onClose={() => setIsFleetPanelOpen(false)}
        store={ownedStore}
        drivers={fleetDrivers}
        orders={rawAllOrders || []}
      />
    </div>
  );
}
