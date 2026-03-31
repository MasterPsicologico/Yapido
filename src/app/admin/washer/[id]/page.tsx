"use client";

import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Waves, 
  Settings, 
  TrendingUp, 
  Wallet, 
  MessageCircle, 
  Calendar,
  Clock,
  ArrowLeft,
  Loader2,
  Users,
  Copy,
  Zap,
  MapPin,
  ShieldCheck
} from 'lucide-react';
import { useProfile } from '@/firebase/auth/use-profile';
import { useFirestore, useCollection, useMemoFirebase, useDoc, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, orderBy, doc, serverTimestamp } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Bar, 
  BarChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

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

    orders.filter(o => o.status === 'delivered' || o.status === 'pending').forEach(o => {
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

  const copyDriverCode = () => {
    if (store?.driverCode) {
      navigator.clipboard.writeText(store.driverCode);
      toast({ title: "Código Copiado", description: "Envíalo a tus repartidores." });
    }
  };

  if (profileLoading || loadingStore) return <div className="fixed inset-0 flex items-center justify-center bg-white"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-10 max-w-5xl">
        <div className="flex flex-col gap-10">
          {/* HEADER MAESTRO */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-slate-950 rounded-[32px] flex items-center justify-center text-white shadow-2xl relative border border-white/10">
                <Waves className="w-10 h-10 text-primary animate-pulse" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-4 border-[#f8fafc]">
                  <Settings className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none text-slate-900">{store?.name}</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-1">Panel de Control de Flota</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setActiveTab('stats')} variant={activeTab === 'stats' ? 'default' : 'ghost'} className="rounded-full h-12">Dashboard</Button>
              <Button onClick={() => setActiveTab('drivers')} variant={activeTab === 'drivers' ? 'default' : 'ghost'} className="rounded-full h-12">Repartidores</Button>
              <Button onClick={() => setActiveTab('orders')} variant={activeTab === 'orders' ? 'default' : 'ghost'} className="rounded-full h-12">Historial</Button>
            </div>
          </div>

          {activeTab === 'stats' && (
            <>
              {/* GRID DE FINANZAS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none rounded-[40px] bg-slate-950 text-white p-8 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
                  <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-4">Ingresos Netos (95%)</p>
                  <h3 className="text-4xl font-black italic tracking-tighter leading-none">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(stats.totalNet)}
                  </h3>
                  <div className="mt-6 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Flujo Real</span>
                  </div>
                </Card>

                <Card className="border-none rounded-[40px] bg-white p-8 shadow-xl ring-1 ring-black/[0.03]">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Tasa Sistema (5%)</p>
                  <h3 className="text-4xl font-black italic tracking-tighter leading-none text-red-500">
                    -{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(stats.totalPlatform)}
                  </h3>
                  <div className="mt-6 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Servicio Activo</span>
                  </div>
                </Card>

                <Card className="border-none rounded-[40px] bg-primary text-white p-8 shadow-2xl">
                  <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.3em] mb-4">Total Bruto</p>
                  <h3 className="text-4xl font-black italic tracking-tighter leading-none">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(stats.totalGross)}
                  </h3>
                  <div className="mt-6 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-white" />
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest italic">Ventas Totales</span>
                  </div>
                </Card>
              </div>

              {/* GRÁFICO */}
              <Card className="border-none rounded-[48px] shadow-2xl bg-white p-10 ring-1 ring-black/[0.03]">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-10">Rendimiento de Alquiler</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.dailyEarnings}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} />
                      <Bar dataKey="monto" radius={[8, 8, 0, 0]}>
                        {stats.dailyEarnings.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.monto > 0 ? '#3b82f6' : '#f1f5f9'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </>
          )}

          {activeTab === 'drivers' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-4">
              <Card className="border-none rounded-[40px] bg-slate-900 text-white p-10 shadow-2xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter">Tu Flota Privada</h3>
                    <p className="text-slate-400 font-medium text-sm">Vicula repartidores usando este código único.</p>
                  </div>
                  <div className="flex items-center gap-4 bg-white/5 p-6 rounded-[32px] border border-white/10">
                    <span className="text-4xl font-black tracking-[0.3em] text-primary">{store?.driverCode}</span>
                    <Button onClick={copyDriverCode} variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full h-12 w-12"><Copy className="w-6 h-6" /></Button>
                  </div>
                </div>
              </Card>

              <div className="grid gap-4">
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 ml-4">Repartidores Vinculados ({store?.privateDrivers?.length || 0})</h4>
                {store?.privateDrivers && store.privateDrivers.length > 0 ? store.privateDrivers.map((driverId: string) => (
                  <Card key={driverId} className="border-none rounded-[32px] p-6 bg-white shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center"><Users className="w-6 h-6 text-primary" /></div>
                      <div>
                        <p className="text-sm font-black uppercase italic text-slate-900">ID: {driverId.slice(0, 12)}...</p>
                        <Badge className="bg-green-50 text-green-600 border-none text-[8px] font-black uppercase">Activo en Flota</Badge>
                      </div>
                    </div>
                    <Button variant="ghost" className="text-red-500 font-bold text-xs uppercase">Desvincular</Button>
                  </Card>
                )) : (
                  <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                    <Users className="w-16 h-16 mx-auto text-slate-100 mb-4" />
                    <p className="text-slate-300 font-black uppercase tracking-widest italic">Aún no tienes repartidores</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 ml-4">Log de Operaciones</h3>
              <div className="space-y-4">
                {orders && orders.length > 0 ? orders.map((order) => (
                  <Card key={order.id} className="border-none rounded-[32px] bg-white shadow-sm p-6 group">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center"><Clock className="w-7 h-7 text-slate-300 group-hover:text-primary transition-colors" /></div>
                        <div>
                          <div className="flex items-center gap-3"><span className="text-xs font-black uppercase italic text-slate-900">#{order.id.slice(-6).toUpperCase()}</span><Badge className={cn("text-[8px] font-black uppercase px-2 h-5 border-none", order.status === 'delivered' ? "bg-green-500 text-white" : "bg-orange-500 text-white")}>{order.status}</Badge></div>
                          <p className="text-lg font-black italic uppercase text-slate-700 tracking-tighter">{order.customerName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2 mt-1"><MapPin className="w-3 h-3" /> {order.customerAddress?.slice(0, 30)}...</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Monto</p>
                          <span className="text-2xl font-black italic text-slate-900">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(order.totalPrice || 0)}</span>
                        </div>
                        <Button onClick={() => router.push(`/admin/orders#${order.id}`)} size="icon" className="w-14 h-14 rounded-2xl bg-slate-900 text-white hover:bg-primary shadow-xl transition-all"><MessageCircle className="w-6 h-6" /></Button>
                      </div>
                    </div>
                  </Card>
                )) : (
                  <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                    <p className="text-slate-300 font-black uppercase tracking-widest italic">Sin registros de operaciones</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
