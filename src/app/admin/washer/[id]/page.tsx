
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useProfile } from '@/firebase/auth/use-profile';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// COMPONENTES MODULARES
import { WasherHeader } from '../components/WasherHeader';
import { WasherDashboard } from '../components/WasherDashboard';
import { WasherDrivers } from '../components/WasherDrivers';
import { WasherOrders } from '../components/WasherOrders';

export default function WasherAdminPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user, profile, isLoading: profileLoading } = useProfile();
  const firestore = useFirestore();
  
  const [activeTab, setActiveTab] = useState<'stats' | 'drivers' | 'orders'>('stats');

  const storeRef = useMemoFirebase(() => (!firestore || !id) ? null : doc(firestore, 'stores', id), [firestore, id]);
  const { data: store, isLoading: loadingStore } = useDoc(storeRef);

  useEffect(() => {
    if (!profileLoading && !loadingStore && store && user?.uid !== store.ownerId) {
      router.push('/');
    }
  }, [store, user, profileLoading, loadingStore, router]);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(
      collection(firestore, 'orders'),
      where('storeId', '==', id),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, id]);

  const { data: orders, isLoading: loadingOrders } = useCollection(ordersQuery);

  const stats = useMemo(() => {
    if (!orders) return { dailyEarnings: [], totalNet: 0, totalPlatform: 0, totalGross: 0 };
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return format(date, 'yyyy-MM-dd');
    }).reverse();

    const earningsMap: Record<string, number> = {};
    let totalGross = 0;

    orders.filter(o => o.status === 'delivered').forEach(o => {
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

    return { dailyEarnings, totalNet: netProfit, totalPlatform: platformFee, totalGross };
  }, [orders]);

  if (profileLoading || loadingStore) return <div className="fixed inset-0 flex items-center justify-center bg-white"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-10 max-w-5xl space-y-10">
        <WasherHeader 
          storeName={store?.name} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />

        {activeTab === 'stats' && <WasherDashboard stats={stats} />}
        {activeTab === 'drivers' && <WasherDrivers store={store} />}
        {activeTab === 'orders' && <WasherOrders orders={orders} router={router} />}
      </main>
    </div>
  );
}
