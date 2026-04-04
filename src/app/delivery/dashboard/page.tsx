
"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Truck, CheckCircle2, Zap, ArrowRight, Clock, ShieldCheck, Camera, LayoutGrid, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, useDoc, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, doc, serverTimestamp, arrayUnion, arrayRemove, orderBy, limit } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { compressImage } from '@/lib/image-compression';

// Componentes Fragmentados
import { WeeklyChallenge } from '@/components/delivery/weekly-challenge';
import { DashboardHeader } from '@/components/delivery/dashboard/DashboardHeader';
import { ActiveMissionView } from '@/components/delivery/dashboard/ActiveMissionView';
import { RoutesTab } from '@/components/delivery/dashboard/tabs/RoutesTab';
import { EarningsTab } from '@/components/delivery/dashboard/tabs/EarningsTab';
import { releaseOrder } from '@/ai/flows/release-order-flow';
import { AgentProgressOverlay } from '@/components/agents/AgentProgressOverlay';

const CACHE_ACTIVE = 'vitriniando_delivery_bg_active';
const CACHE_INACTIVE = 'vitriniando_delivery_bg_inactive';

export default function DeliveryDashboardPage() {
  const { user } = useUser();
  const { profile, level, isAdmin, isLoading: loadingProfile } = useProfile();
  const firestore = useFirestore();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState("available");
  const [isOnline, setIsOnline] = useState(true);
  const [isReleasing, setIsReleasing] = useState(false);
  const [releaseLogs, setReleaseLogs] = useState<string[]>([]);
  const [isUploadingWelcome, setIsUploadingWelcome] = useState(false);
  const [isUploadingDashboard, setIsUploadingDashboard] = useState<'active' | 'inactive' | null>(null);
  const [adminForceWelcome, setAdminForceWelcome] = useState(false);

  useEffect(() => {
    if (!loadingProfile && profile?.role === 'repartidor' && profile?.hasSeenApproval === false && !isAdmin) {
      router.replace('/delivery/approved');
    }
  }, [profile, loadingProfile, router, isAdmin]);

  const welcomeConfigRef = useMemoFirebase(() => doc(firestore, 'appConfig', 'delivery_welcome'), [firestore]);
  const { data: welcomeConfig } = useDoc(welcomeConfigRef);

  const dashboardConfigRef = useMemoFirebase(() => doc(firestore, 'appConfig', 'delivery_dashboard'), [firestore]);
  const { data: dashboardConfig } = useDoc(dashboardConfigRef);

  useEffect(() => {
    if (!loadingProfile && profile && !profile.phoneNumber) {
      toast({ title: "Acceso Restringido", description: "Registra tu teléfono.", variant: "destructive" });
      router.push('/profile');
    }
  }, [profile, loadingProfile, router]);

  const isConfirmedRepartidor = profile?.role === 'repartidor' || isAdmin;

  const allActiveOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !isConfirmedRepartidor || !isOnline) return null;
    if (profile?.linkedStoreId) {
      return query(collection(firestore, 'orders'), where('storeId', '==', profile.linkedStoreId), limit(50));
    }
    return query(collection(firestore, 'orders'), where('isLogisticsPublic', '==', true), limit(50));
  }, [firestore, isConfirmedRepartidor, isOnline, profile?.linkedStoreId]);

  const { data: rawAllOrders, isLoading: loadingRoutes } = useCollection(allActiveOrdersQuery);

  const availableOrders = useMemo(() => {
    if (!rawAllOrders) return [];
    return rawAllOrders.filter(order => {
      const isSearchable = ['pending', 'preparing', 'ready_for_pickup'].includes(order.status);
      if (!isSearchable) return false;
      if (order.deliveryDriverId && order.deliveryDriverId !== user?.uid) return false;
      return true;
    }).sort((a, b) => {
      const timeA = a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
      const timeB = b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
      return timeB - timeA;
    });
  }, [rawAllOrders, user?.uid]);

  const myDeliveriesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !isConfirmedRepartidor) return null;
    return query(collection(firestore, 'orders'), where('participants', 'array-contains', user.uid), where('status', 'in', ['shipped', 'at_store', 'delivered_to_driver']));
  }, [firestore, user?.uid, isConfirmedRepartidor]);

  const historyQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || !isConfirmedRepartidor) return null;
    return query(collection(firestore, 'orders'), where('participants', 'array-contains', user.uid), where('status', '==', 'delivered'), limit(50));
  }, [firestore, user?.uid, isConfirmedRepartidor]);

  const { data: rawMy } = useCollection(myDeliveriesQuery);
  const { data: history } = useCollection(historyQuery);

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
    toast({ title: "Ruta Aceptada" });
    setActiveTab("my-deliveries");
  };

  const handleUpdateMissionStatus = (newStatus: string) => {
    if (!activeMission || !firestore) return;
    const orderRef = doc(firestore, 'orders', activeMission.id);
    const updateData: any = { status: newStatus, updatedAt: serverTimestamp() };
    if (newStatus === 'delivered_to_driver') updateData.pickedUpAt = serverTimestamp();
    if (newStatus === 'delivered') updateData.deliveredAt = serverTimestamp();
    updateDocumentNonBlocking(orderRef, updateData);
    toast({ title: "Estado Actualizado" });
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
        hasProducts: activeMission.status === 'delivered_to_driver', orderValue: activeMission.totalPrice || 0,
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
      const cacheKey = target === 'active' ? CACHE_ACTIVE : CACHE_INACTIVE;
      
      // ACTUALIZACIÓN INSTANTÁNEA EN LOCAL
      localStorage.setItem(cacheKey, compressed);
      
      await setDocumentNonBlocking(dashboardConfigRef, {
        [updateKey]: compressed,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid
      }, { merge: true });
      
      toast({ title: `Fondo de ${target === 'active' ? 'Turno' : 'Descanso'} actualizado` });
    } catch (error) {
      toast({ title: "Error al actualizar", variant: "destructive" });
    } finally {
      setIsUploadingDashboard(null);
    }
  };

  if (loadingProfile) return <div className="fixed inset-0 flex items-center justify-center bg-white"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

  const showWelcome = !isConfirmedRepartidor || (isAdmin && adminForceWelcome);

  if (showWelcome) {
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
                  <div className="space-y-1"><h4 className="font-black text-lg uppercase italic tracking-tighter">Gana por cada entrega</h4><p className="text-xs text-slate-400 font-medium">Recibe el 70% del valor de cada envío de forma inmediata.</p></div>
                </div>
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 shadow-inner"><Zap className="w-6 h-6" /></div>
                  <div className="space-y-1"><h4 className="font-black text-lg uppercase italic tracking-tighter">Autonomía Logística</h4><p className="text-xs text-slate-400 font-medium">Tú controlas tu tiempo. Conéctate cuando quieras.</p></div>
                </div>
              </div>
              <Button onClick={() => router.push(isAdmin ? '#' : '/delivery/register')} className="w-full h-20 rounded-[32px] bg-primary text-white font-black uppercase tracking-widest gap-3 border-b-[10px] border-blue-800 shadow-xl active:translate-y-2 active:border-b-0 transition-all">
                {isAdmin ? "PANEL DE CONTROL ACTIVO" : "QUIERO SER REPARTIDOR"} <ArrowRight className="w-4 h-4" />
              </Button>
              {isAdmin && <Button onClick={() => setAdminForceWelcome(false)} variant="ghost" className="w-full h-12 font-black uppercase text-[10px] tracking-widest text-slate-400">VOLVER AL MONITOR</Button>}
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
        <ActiveMissionView mission={activeMission} customerProfile={customerProfile} onUpdateStatus={handleUpdateMissionStatus} onRelease={handleReleaseOrder} onOpenMaps={(addr) => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`, '_blank')} />
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <DashboardHeader 
            profile={profile} level={level} stats={stats} 
            isOnline={isOnline} onToggleOnline={() => setIsOnline(!isOnline)} 
            isAdmin={isAdmin} 
            dashboardConfig={dashboardConfig} 
            onImageUpload={handleDashboardImageUpload} 
            isUploading={isUploadingDashboard}
          />
          <main className="container mx-auto px-4 py-8 max-w-2xl">
            {isAdmin && (
              <Button 
                onClick={() => setAdminForceWelcome(true)}
                variant="outline" 
                className="w-full mb-10 h-12 rounded-2xl border-dashed border-2 border-primary/30 text-primary font-black uppercase text-[10px] tracking-widest gap-2 hover:bg-primary/5"
              >
                <Edit3 className="w-4 h-4" /> EDITAR PORTADA DE BIENVENIDA
              </Button>
            )}

            <Tabs defaultValue="available" value={activeTab} onValueChange={setActiveTab} className="mb-12 space-y-8">
              <TabsList className="bg-white border h-16 p-1 rounded-full shadow-sm w-full grid grid-cols-3">
                <TabsTrigger value="available" className="rounded-full font-black text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white">RUTAS LIBRES</TabsTrigger>
                <TabsTrigger value="my-deliveries" className="rounded-full font-black text-[10px] data-[state=active]:bg-secondary data-[state=active]:text-white">ACTIVAS ({rawMy?.length || 0})</TabsTrigger>
                <TabsTrigger value="earnings" className="rounded-full font-black text-[10px] data-[state=active]:bg-slate-900 data-[state=active]:text-white">INGRESOS</TabsTrigger>
              </TabsList>
              <TabsContent value="available">
                {loadingRoutes ? (
                  <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
                ) : (
                  <RoutesTab isOnline={isOnline} orders={availableOrders} onAccept={handleAcceptOrder} onGoOnline={() => setIsOnline(true)} />
                )}
              </TabsContent>
              <TabsContent value="my-deliveries"><div className="text-center py-20 text-slate-300 font-black uppercase italic tracking-widest">Sin entregas activas</div></TabsContent>
              <TabsContent value="earnings"><EarningsTab balance={profile?.balance || 0} /></TabsContent>
            </Tabs>

            <WeeklyChallenge orders={history} />
          </main>
        </div>
      )}
    </div>
  );
}
