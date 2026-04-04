
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Settings2, Clock, MapPin, Phone, Store as StoreIcon, LayoutGrid, Zap, ShieldCheck } from 'lucide-react';
import { useProfile } from '@/firebase/auth/use-profile';
import { useFirestore, useCollection, useMemoFirebase, useDoc, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, orderBy, doc, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

// COMPONENTES MODULARES
import { WasherHeader } from '../components/WasherHeader';
import { WasherDashboard } from '../components/WasherDashboard';
import { WasherDrivers } from '../components/WasherDrivers';
import { WasherOrders } from '../components/WasherOrders';
import { WasherLiveRadar } from '../components/WasherLiveRadar';

export default function WasherAdminPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user, profile, isLoading: profileLoading } = useProfile();
  const firestore = useFirestore();
  
  const [activeTab, setActiveTab] = useState<'stats' | 'drivers' | 'orders'>('stats');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const storeRef = useMemoFirebase(() => (!firestore || !id) ? null : doc(firestore, 'stores', id), [firestore, id]);
  const { data: store, isLoading: loadingStore } = useDoc(storeRef);

  useEffect(() => {
    if (!profileLoading && !loadingStore && store && user?.uid !== store.ownerId) {
      router.push('/');
    }
  }, [store, user, profileLoading, loadingStore, router]);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !id || !user?.uid) return null;
    return query(
      collection(firestore, 'orders'),
      where('storeId', '==', id),
      where('participants', 'array-contains', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, id, user?.uid]);

  const { data: orders, isLoading: loadingOrders } = useCollection(ordersQuery);

  const stats = useMemo(() => {
    if (!orders) return { dailyEarnings: [], totalNet: 0, totalPlatform: 0, totalGross: 0, totalCount: 0 };
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return format(date, 'yyyy-MM-dd');
    }).reverse();

    const earningsMap: Record<string, number> = {};
    let totalGross = 0;

    orders.filter(o => o.status === 'delivered' || o.status === 'delivered_to_driver').forEach(o => {
      const dateKey = o.createdAt ? format(o.createdAt.toDate(), 'yyyy-MM-dd') : 'unknown';
      const amount = o.totalPrice || 0;
      earningsMap[dateKey] = (earningsMap[dateKey] || 0) + amount;
      totalGross += amount;
    });

    const dailyEarnings = last7Days.map(date => ({
      name: format(new Date(date), 'EEE', { locale: es }).toUpperCase(),
      monto: earningsMap[date] || 0
    }));

    const platformFee = totalGross * 0.05;
    const netProfit = totalGross - platformFee;

    return { dailyEarnings, totalNet: netProfit, totalPlatform: platformFee, totalGross, totalCount: orders.length };
  }, [orders]);

  const handleUpdateStore = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!storeRef) return;
    setIsUpdating(true);
    const fd = new FormData(e.currentTarget);
    const data = {
      name: fd.get('name'),
      phoneNumber: fd.get('phone'),
      address: fd.get('address'),
      openTime: fd.get('openTime'),
      closeTime: fd.get('closeTime'),
      updatedAt: serverTimestamp(),
    };

    try {
      updateDocumentNonBlocking(storeRef, data);
      toast({ title: "Configuración Actualizada", description: "Tu vitrina ha sido sincronizada." });
      setIsSettingsOpen(false);
    } catch (e) {
      toast({ title: "Error al actualizar", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  if (profileLoading || loadingStore) return <div className="fixed inset-0 flex items-center justify-center bg-white"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-10 max-w-5xl space-y-12 pb-32">
        <div className="flex flex-col gap-8 mb-4">
          <Button variant="ghost" onClick={() => router.push('/admin/manage')} className="w-fit gap-2 text-slate-400 font-bold hover:text-primary p-0 h-auto hover:bg-transparent">
            <ArrowLeft className="w-4 h-4" /> <span className="text-[10px] font-black uppercase tracking-widest">Panel Central</span>
          </Button>
          
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-slate-900 rounded-[32px] flex items-center justify-center text-white shadow-2xl relative border border-white/5">
              <Zap className="w-10 h-10 text-primary animate-pulse" />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-[#f8fafc] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none text-slate-900">Consola de Mando</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-1">ADMINISTRADOR: {store?.name?.toUpperCase()}</p>
            </div>
          </div>
        </div>

        <WasherHeader 
          storeName={store?.name} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          driverCount={store?.privateDrivers?.length || 0}
          orderCount={stats.totalCount}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* RADAR PRIORITARIO: EL DUEÑO ADMINISTRA LAS TARJETAS DESDE AQUÍ */}
        <section className="animate-in fade-in zoom-in duration-700">
          <WasherLiveRadar 
            storeId={id} 
            storeName={store?.name || 'Tienda'} 
            ownerId={store?.ownerId || ''} 
          />
        </section>

        {activeTab === 'stats' && (
          <WasherDashboard 
            stats={stats} 
            store={store} 
            onOpenSettings={() => setIsSettingsOpen(true)} 
          />
        )}
        {activeTab === 'drivers' && <WasherDrivers store={store} />}
        {activeTab === 'orders' && <WasherOrders orders={orders} router={router} />}
      </main>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="rounded-[40px] border-none shadow-2xl p-8 sm:max-w-[500px] overflow-y-auto max-h-[90vh]">
          <DialogHeader className="items-center text-center space-y-4">
            <div className="w-16 h-16 bg-slate-900 rounded-[24px] flex items-center justify-center text-primary shadow-xl">
              <Settings2 className="w-8 h-8" />
            </div>
            <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Ajustes de Vitrina</DialogTitle>
            <DialogDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Configuración Técnica y Horaria</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateStore} className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nombre Comercial</Label>
              <div className="relative">
                <StoreIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <Input name="name" defaultValue={store?.name} className="h-14 rounded-2xl bg-slate-50 border-none font-bold pl-12" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">WhatsApp de Contacto</Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <Input name="phone" defaultValue={store?.phoneNumber} className="h-14 rounded-2xl bg-slate-50 border-none font-bold pl-12" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Dirección Base</Label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <Input name="address" defaultValue={store?.address} className="h-14 rounded-2xl bg-slate-50 border-none font-bold pl-12" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Hora Apertura</Label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <Input name="openTime" type="time" defaultValue={store?.openTime || '08:00'} className="h-14 rounded-2xl bg-slate-50 border-none font-bold pl-12" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Hora Cierre</Label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <Input name="closeTime" type="time" defaultValue={store?.closeTime || '20:00'} className="h-14 rounded-2xl bg-slate-50 border-none font-bold pl-12" required />
                </div>
              </div>
            </div>

            <Button type="submit" disabled={isUpdating} className="w-full h-16 rounded-[24px] bg-primary text-white font-black uppercase tracking-widest gap-3 shadow-xl shadow-primary/20 active:scale-95 transition-all">
              {isUpdating ? <Loader2 className="animate-spin" /> : "GUARDAR Y SINCRONIZAR"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
