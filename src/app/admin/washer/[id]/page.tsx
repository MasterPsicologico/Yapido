
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Settings2, Clock, MapPin, Phone, Store as StoreIcon, Zap, ShieldCheck, Timer } from 'lucide-react';
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
import { WasherActiveRentals } from '../components/WasherActiveRentals';

export default function WasherAdminPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user, profile, isLoading: profileLoading } = useProfile();
  const firestore = useFirestore();
  
  const [activeTab, setActiveTab] = useState<'stats' | 'active' | 'drivers' | 'orders'>('stats');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const storeRef = useMemoFirebase(() => (!firestore || !id) ? null : doc(firestore, 'stores', id), [firestore, id]);
  const { data: store, isLoading: loadingStore } = useDoc(storeRef);

  // QUERY MAESTRA: Pedidos finalizados para historial
  const historyQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(
      collection(firestore, 'orders'),
      where('storeId', '==', id),
      where('status', '==', 'completed'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, id]);

  const { data: history } = useCollection(historyQuery);

  // QUERY MAESTRA: Alquileres vivos para el panel activo
  const activeRentalsQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(
      collection(firestore, 'orders'),
      where('storeId', '==', id),
      where('status', 'in', ['shipped', 'at_destination', 'delivered']),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, id]);

  const { data: activeRentals } = useCollection(activeRentalsQuery);

  const stats = useMemo(() => {
    if (!history) return { dailyEarnings: [], totalNet: 0, totalPlatform: 0, totalGross: 0, totalCount: 0 };
    let totalGross = 0;
    history.forEach(o => totalGross += (o.totalPrice || 0));
    const platformFee = totalGross * 0.05;
    return { dailyEarnings: [], totalNet: totalGross - platformFee, totalPlatform: platformFee, totalGross, totalCount: history.length };
  }, [history]);

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
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-[#f8fafc] flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-white" /></div>
            </div>
            <div className="space-y-1">
              <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none text-slate-900">Consola de Mando</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-1">{store?.name?.toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* NAVEGACIÓN DE PESTAÑAS ACTUALIZADA */}
        <div className="flex gap-2 bg-white p-1.5 rounded-full shadow-sm border border-slate-100 w-fit overflow-x-auto no-scrollbar">
          {[
            { id: 'stats', label: 'Dashboard' },
            { id: 'active', label: 'Alquileres Activos' },
            { id: 'drivers', label: 'Repartidores' },
            { id: 'orders', label: 'Historial' }
          ].map(tab => (
            <Button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              variant={activeTab === tab.id ? 'default' : 'ghost'} 
              className="rounded-full h-10 text-[9px] font-black uppercase px-5 tracking-widest"
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {activeTab === 'active' && <WasherActiveRentals rentals={activeRentals} />}
        {activeTab === 'stats' && <WasherDashboard stats={stats} store={store} onOpenSettings={() => setIsSettingsOpen(true)} />}
        {activeTab === 'drivers' && <WasherDrivers store={store} />}
        {activeTab === 'orders' && <WasherOrders orders={history} router={router} />}
        
        {/* RADAR SIEMPRE VISIBLE EN EL FONDO O SEGÚN NECESIDAD */}
        <WasherLiveRadar storeId={id} storeName={store?.name || 'Tienda'} ownerId={store?.ownerId || ''} />
      </main>
    </div>
  );
}
