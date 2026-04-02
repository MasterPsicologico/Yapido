
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Truck, CheckCircle2, Zap, ArrowRight, Clock, ShieldCheck, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, useDoc, addDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, doc, serverTimestamp, arrayUnion, arrayRemove, orderBy } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
  const { profile, level, isAdmin, isLoading: loadingProfile } = useProfile();
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

  const isConfirmedRepartidor = profile?.role === 'repartidor' || isAdmin;

  // CONSULTAS FIRESTORE OPTIMIZADAS
  const availableOrdersQuery = useMemoFirebase(() => {
    if (!firestore || !isConfirmedRepartidor || !isOnline) return null;
    
    if (profile?.linkedStoreId) {
      return query(
        collection(firestore, 'orders'), 
        where('storeId', '==', profile.linkedStoreId),
        where('isLogisticsPublic', '==', true),
        where('status', 'in', ['pending', 'preparing', 'ready_for_pickup']),
        orderBy('createdAt', 'desc')
      );
    }

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
    toast({ title: "Ruta Aceptada", description: "Iniciando misión logística." });
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

  // PANTALLAS DE FLUJO DE REGISTRO SI NO ES REPARTIDOR CONFIRMADO
  if (!isConfirmedRepartidor) {
    if (profile?.deliveryRequested) {
      return (
        <div className="flex flex-col min-h-screen bg-[#f8fafc]">
          <Navbar />
          <main className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8 animate-in zoom-in duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/20 rounded-[40px] animate-ping [animation-duration:3000ms]" />
              <div className="relative w-28 h-28 bg-white rounded-[40px] shadow-2xl flex items-center justify-center text-orange-500 border border-orange-100">
                <Clock className="w-14 h-14" />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Solicitud en Proceso</h2>
              <p className="text-slate-500 max-w-sm mx-auto font-medium text-sm leading-relaxed uppercase tracking-tight">
                Tu registro ha sido enviado. El administrador principal debe verificar tus datos para activarte en la red global de repartos.
              </p>
            </div>
            <Button variant="outline" className="rounded-full h-12 px-8 font-black uppercase text-[10px] tracking-widest border-slate-200" onClick={() => router.push('/')}>
              VOLVER AL MARKETPLACE
            </Button>
          </main>
        </div>
      );
    }

    return (
      <div className="flex flex-col min-h-screen bg-[#f8fafc]">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center mb-12 space-y-4">
            <div className="w-24 h-24 bg-primary rounded-[36px] flex items-center justify-center text-white mx-auto shadow-2xl shadow-primary/20">
              <Truck className="w-12 h-12" />
            </div>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter text-slate-900">Bienvenido a Delivery</h1>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">Centro de Operaciones de Flota</p>
          </div>
          
          <Card className="border-none shadow-2xl rounded-[48px] bg-white overflow-hidden ring-1 ring-black/[0.03]">
            <CardContent className="p-12 space-y-10">
              <div className="space-y-8">
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-500 shrink-0 shadow-inner">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-lg uppercase italic tracking-tighter text-slate-900">Gana por cada entrega</h4>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">Recibe el 70% del valor de cada envío de forma inmediata y directa a tu saldo.</p>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 shadow-inner">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-lg uppercase italic tracking-tighter text-slate-900">Autonomía Logística</h4>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">Tú controlas tu tiempo. Conéctate cuando quieras y acepta las rutas que mejor te convengan.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                {/* BOTÓN 3D AVANZADO DE ANCHO TOTAL */}
                <Button 
                  onClick={() => router.push('/delivery/register')}
                  className={cn(
                    "w-full h-20 rounded-[32px] bg-primary text-white font-black text-[10px] sm:text-sm uppercase tracking-[0.2em] gap-3",
                    "relative transition-all duration-75 ease-out",
                    "border-b-[10px] border-blue-800", // Efecto de profundidad física
                    "shadow-[0_15px_35px_-5px_rgba(59,130,246,0.5)]",
                    "hover:border-b-[6px] hover:translate-y-[4px] hover:shadow-[0_10px_25px_-5px_rgba(59,130,246,0.4)]",
                    "active:border-b-0 active:translate-y-[10px] active:shadow-inner"
                  )}
                >
                  QUIERO SER REPARTIDOR <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[8px] text-center text-slate-300 font-black uppercase tracking-[0.4em]">SISTEMA PROTEGIDO • VITRINIANDO AI KERNEL</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

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
