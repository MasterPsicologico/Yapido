
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle2, Zap, ArrowRight, Hourglass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, useDoc, setDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, doc, serverTimestamp, arrayUnion, arrayRemove, limit, or } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import Image from 'next/image';
import { compressImage } from '@/lib/image-compression';

// Componentes Fragmentados
import { WeeklyChallenge } from '@/components/delivery/weekly-challenge';
import { DashboardHeader } from '@/components/delivery/dashboard/DashboardHeader';
import { ActiveMissionView } from '@/components/delivery/dashboard/ActiveMissionView';
import { RoutesTab } from '@/components/delivery/dashboard/tabs/RoutesTab';
import { EarningsTab } from '@/components/delivery/dashboard/tabs/EarningsTab';
import { MyDeliveriesTab } from '@/components/delivery/dashboard/tabs/MyDeliveriesTab';
import { releaseOrder } from '@/ai/flows/release-order-flow';
import { AgentProgressOverlay } from '@/components/agents/AgentProgressOverlay';

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

  // Redirección de onboarding si es necesario
  useEffect(() => {
    if (!loadingProfile && profile?.role === 'repartidor' && profile?.hasSeenApproval === false && !isAdmin) {
      router.replace('/delivery/approved');
    }
  }, [profile, loadingProfile, router, isAdmin]);

  const welcomeConfigRef = useMemoFirebase(() => doc(firestore, 'appConfig', 'delivery_welcome'), [firestore]);
  const { data: welcomeConfig } = useDoc(welcomeConfigRef);

  const dashboardConfigRef = useMemoFirebase(() => doc(firestore, 'appConfig', 'delivery_dashboard'), [firestore]);
  const { data: dashboardConfig } = useDoc(dashboardConfigRef);

  // Filtro de Órdenes Disponibles (Radar) - Blindado contra errores de permisos
  const allActiveOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !isOnline || loadingProfile) return null;
    
    const canSeeRadar = isRepartidor || isAdmin;
    if (!canSeeRadar) return null;

    const publicConstraint = where('isLogisticsPublic', '==', true);
    
    // Si tiene tienda vinculada, puede ver las de su tienda o las públicas
    if (profile?.linkedStoreId) {
      const storeConstraint = where('storeId', '==', profile.linkedStoreId);
      return query(collection(firestore, 'orders'), or(publicConstraint, storeConstraint), limit(50));
    }
    
    return query(collection(firestore, 'orders'), publicConstraint, limit(50));
  }, [firestore, user?.uid, isOnline, profile?.linkedStoreId, isRepartidor, isAdmin, loadingProfile]);

  const { data: rawAllOrders } = useCollection(allActiveOrdersQuery);

  const availableOrders = useMemo(() => {
    if (!rawAllOrders) return [];
    return rawAllOrders.filter(order => 
      ['pending', 'preparing', 'ready_for_pickup'].includes(order.status) &&
      (!order.deliveryDriverId || order.deliveryDriverId === user?.uid)
    ).sort((a, b) => (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0));
  }, [rawAllOrders, user?.uid]);

  // Filtro de Mis Entregas (Alineado con regla de participantes)
  const myDeliveriesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'orders'), 
      where('participants', 'array-contains', user.uid), 
      where('status', 'in', ['shipped', 'at_destination', 'delivered'])
    );
  }, [firestore, user?.uid]);

  const { data: rawMy } = useCollection(myDeliveriesQuery);

  // Misión Heroica: Solo bloquea pantalla en trayecto o al llegar
  const activeMission = useMemo(() => 
    rawMy?.find(o => 
      o.deliveryDriverId === user?.uid && 
      ['shipped', 'at_destination'].includes(o.status)
    ),
    [rawMy, user?.uid]
  );

  const inUseRentals = useMemo(() => 
    rawMy?.filter(o => o.deliveryDriverId === user?.uid && o.status === 'delivered') || [],
    [rawMy, user?.uid]
  );

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
      status: 'shipped', 
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      participants: arrayUnion(user.uid),
      isLogisticsPublic: false
    });
    toast({ title: "Ruta Aceptada" });
  };

  const handleUpdateMissionStatus = (newStatus: string, metadata: any = {}) => {
    const id = metadata.id || activeMission?.id;
    if (!firestore || !id) return;
    
    const orderRef = doc(firestore, 'orders', id);
    const updateData: any = { ...metadata, status: newStatus, updatedAt: serverTimestamp() };
    
    if (newStatus === 'delivered') {
      updateData.deliveredAt = serverTimestamp();
      toast({ title: "¡Lavadora Instalada!", description: "Misión movida a segundo plano." });
      setActiveTab("my-deliveries");
    }
    
    updateDocumentNonBlocking(orderRef, updateData);
  };

  const handleReleaseOrder = async (reason: string) => {
    if (!activeMission || !user || !firestore || !reason) return;
    const orderRef = doc(firestore, 'orders', activeMission.id);
    updateDocumentNonBlocking(orderRef, {
      status: 'ready_for_pickup', deliveryDriverId: null, deliveryDriverName: null,
      isLogisticsPublic: true, updatedAt: serverTimestamp(), participants: arrayRemove(user.uid)
    });
    setIsReleasing(true);
    setReleaseLogs(["Protocolo de liberación activado..."]);
    try {
      const result = await releaseOrder({
        orderId: activeMission.id, driverId: user.uid, reason,
        hasProducts: false, orderValue: activeMission.totalPrice || 0,
        storeId: activeMission.storeId, storeName: activeMission.storeName
      });
      setReleaseLogs(prev => [...prev, ...result.agentLogs]);
    } catch (e) {
      setReleaseLogs(prev => [...prev, "Finalizando procesos..."]);
    }
  };

  const handleDashboardImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'active' | 'inactive') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingDashboard(target);
    try {
      const compressed = await compressImage(file, 1920, 1080, 0.85);
      const updateKey = target === 'active' ? 'bgActive' : 'bgInactive';
      await setDocumentNonBlocking(dashboardConfigRef, { [updateKey]: compressed, updatedAt: serverTimestamp() }, { merge: true });
      toast({ title: "Fondo actualizado" });
    } finally {
      setIsUploadingDashboard(null);
    }
  };

  if (loadingProfile) return <div className="fixed inset-0 flex items-center justify-center bg-white"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

  const isConfirmedRepartidor = profile?.role === 'repartidor' || isAdmin;
  const isPendingApproval = profile?.deliveryRequested === true && profile?.role !== 'repartidor';

  if (!isConfirmedRepartidor) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f8fafc]">
        <Navbar />
        <main className="flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
          <div className="relative w-full aspect-[16/10] mb-2 overflow-hidden shadow-xl">
            {welcomeConfig?.backgroundImage ? (
              <Image src={welcomeConfig.backgroundImage} alt="Portada" fill className="object-cover object-top" priority />
            ) : (
              <div className="absolute inset-0 bg-slate-900" />
            )}
          </div>
          <div className="container mx-auto px-4 max-w-2xl -mt-6 relative z-20">
            <Card className="border-none shadow-2xl rounded-[48px] bg-white overflow-hidden p-10 space-y-10">
              <div className="space-y-8">
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-500 shrink-0 shadow-inner"><CheckCircle2 className="w-6 h-6" /></div>
                  <div className="space-y-1"><h4 className="font-black text-lg uppercase italic tracking-tighter">Genera Ganancias</h4><p className="text-xs text-slate-400 font-medium">Aumenta tus ingresos completando misiones locales.</p></div>
                </div>
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 shadow-inner"><Zap className="w-6 h-6" /></div>
                  <div className="space-y-1"><h4 className="font-black text-lg uppercase italic tracking-tighter">Control Absoluto</h4><p className="text-xs text-slate-400 font-medium">Tú decides tu horario y tu zona.</p></div>
                </div>
              </div>
              {isPendingApproval ? (
                <div className="bg-orange-50 border border-orange-100 p-6 rounded-[32px] flex items-center gap-4 animate-pulse">
                  <Hourglass className="w-8 h-8 text-orange-500" />
                  <div><p className="text-xs font-black uppercase text-orange-600 tracking-widest">Estado: Pendiente</p><p className="text-[10px] font-bold text-orange-400 uppercase">Tu solicitud está en revisión</p></div>
                </div>
              ) : (
                <Button asChild className="w-full h-20 rounded-[32px] bg-primary text-white font-black uppercase tracking-widest gap-3 border-b-[10px] border-blue-800 shadow-xl active:translate-y-2 active:border-b-0 transition-all">
                  <Link href="/delivery/register">QUIERO SER REPARTIDOR <ArrowRight className="w-4 h-4" /></Link>
                </Button>
              )}
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-[#f8fafc] overflow-hidden">
      <Navbar />
      <AgentProgressOverlay isOpen={isReleasing} logs={releaseLogs} onComplete={() => { setIsReleasing(false); router.replace('/delivery/release-success'); }} />

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
            profile={profile} level={level} stats={{ rating: profile?.avgRating || 5.0, deliveredCount: 0 }} 
            isOnline={isOnline} onToggleOnline={() => setIsOnline(!isOnline)} 
            isAdmin={isAdmin} dashboardConfig={dashboardConfig} 
            onImageUpload={handleDashboardImageUpload} isUploading={isUploadingDashboard}
          />
          <main className="container mx-auto px-4 py-8 max-w-2xl">
            <Tabs defaultValue="available" value={activeTab} onValueChange={setActiveTab} className="mb-12 space-y-8">
              <div className="w-full overflow-x-auto no-scrollbar">
                <TabsList className="bg-white border h-16 p-1 rounded-full shadow-sm w-full min-w-[320px] grid grid-cols-3">
                  <TabsTrigger value="available" className="rounded-full font-black text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white uppercase">Radar Rutas</TabsTrigger>
                  <TabsTrigger value="my-deliveries" className="rounded-full font-black text-[10px] data-[state=active]:bg-secondary data-[state=active]:text-white uppercase relative">
                    En Curso
                    {inUseRentals.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-black animate-in zoom-in">{inUseRentals.length}</span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="earnings" className="rounded-full font-black text-[10px] data-[state=active]:bg-slate-900 data-[state=active]:text-white uppercase">Balance</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="available">
                <RoutesTab isOnline={isOnline} orders={availableOrders} onAccept={handleAcceptOrder} onGoOnline={() => setIsOnline(true)} />
              </TabsContent>
              <TabsContent value="my-deliveries">
                <MyDeliveriesTab rentals={inUseRentals} onUpdateStatus={handleUpdateMissionStatus} />
              </TabsContent>
              <TabsContent value="earnings">
                <EarningsTab balance={profile?.balance || 0} />
              </TabsContent>
            </Tabs>
            <WeeklyChallenge orders={[]} />
          </main>
        </div>
      )}
    </div>
  );
}
