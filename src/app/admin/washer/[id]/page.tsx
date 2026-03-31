
"use client";

import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Waves, 
  Settings, 
  TrendingUp, 
  History, 
  Wallet, 
  MessageCircle, 
  Calendar,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
  Zap,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { useProfile } from '@/firebase/auth/use-profile';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { useEffect, useMemo } from 'react';
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

export default function WasherAdminPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user, profile, isLoading: profileLoading } = useProfile();
  const firestore = useFirestore();

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
    if (!orders) return { dailyEarnings: [], totalNet: 0, totalPlatform: 0 };
    
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
                  <Settings className="w-4 h-4 text-white animate-spin-slow" />
                </div>
              </div>
              <div className="space-y-1">
                <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none text-slate-900">Panel Maestro</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-1">{store?.name} • Alquiler de Lavadoras</p>
              </div>
            </div>
            <Button onClick={() => router.push('/')} variant="ghost" className="rounded-full h-12 gap-2 text-slate-400 font-bold hover:text-primary">
              <ArrowLeft className="w-4 h-4" /> Volver al Marketplace
            </Button>
          </div>

          {/* GRID DE FINANZAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none rounded-[40px] bg-slate-950 text-white p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-all" />
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-4">Ingresos Netos (95%)</p>
              <h3 className="text-4xl font-black italic tracking-tighter leading-none">
                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(stats.totalNet)}
              </h3>
              <div className="mt-6 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Flujo de Caja Real</span>
              </div>
            </Card>

            <Card className="border-none rounded-[40px] bg-white p-8 shadow-xl ring-1 ring-black/[0.03]">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Tasa de Plataforma (5%)</p>
              <h3 className="text-4xl font-black italic tracking-tighter leading-none text-red-500">
                -{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(stats.totalPlatform)}
              </h3>
              <div className="mt-6 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Garantía del Sistema</span>
              </div>
            </Card>

            <Card className="border-none rounded-[40px] bg-primary text-white p-8 shadow-2xl shadow-primary/20">
              <p className="text-[9px] font-black text-white/60 uppercase tracking-[0.3em] mb-4">Total Bruto</p>
              <h3 className="text-4xl font-black italic tracking-tighter leading-none">
                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(stats.totalGross)}
              </h3>
              <div className="mt-6 flex items-center gap-2">
                <Zap className="w-4 h-4 text-white animate-vibrate" />
                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest italic">Ventas Acumuladas</span>
              </div>
            </Card>
          </div>

          {/* GRÁFICO DE GANANCIAS DIARIAS */}
          <Card className="border-none rounded-[48px] shadow-2xl bg-white p-10 ring-1 ring-black/[0.03]">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Actividad de Flota</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Últimos 7 días de alquiler</p>
              </div>
              <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[9px] px-4 h-8 uppercase tracking-widest">Sincronización en Vivo</Badge>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.dailyEarnings} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-950 p-4 rounded-2xl shadow-2xl border border-white/10">
                            <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">{payload[0].payload.name}</p>
                            <p className="text-lg font-black text-white italic tracking-tighter">
                              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(payload[0].value as number)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="monto" radius={[8, 8, 0, 0]}>
                    {stats.dailyEarnings.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.monto > 0 ? '#3b82f6' : '#f1f5f9'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* HISTORIAL DE SOLICITUDES */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Log de Operaciones</h3>
              </div>
              <Badge className="bg-primary text-white border-none font-black text-[9px] px-4 h-8 uppercase tracking-widest italic">{orders?.length || 0} Registros</Badge>
            </div>

            <div className="space-y-4">
              {loadingOrders ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-slate-200" /></div>
              ) : orders && orders.length > 0 ? (
                orders.map((order) => (
                  <Card key={order.id} className="border-none rounded-[32px] bg-white shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden ring-1 ring-black/[0.02] group/order">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center shadow-inner group-hover/order:bg-primary/10 transition-colors">
                            <Clock className="w-7 h-7 text-slate-300 group-hover/order:text-primary transition-colors" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-black uppercase italic text-slate-900">ID #{order.id.slice(-6).toUpperCase()}</span>
                              <Badge className={cn(
                                "text-[8px] font-black uppercase px-2 h-5 border-none",
                                order.status === 'delivered' ? "bg-green-500 text-white" : "bg-orange-500 text-white"
                              )}>
                                {order.status === 'delivered' ? 'COMPLETADO' : 'PENDIENTE'}
                              </Badge>
                            </div>
                            <p className="text-lg font-black italic uppercase text-slate-700 tracking-tighter leading-none">{order.customerName}</p>
                            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {order.createdAt ? format(order.createdAt.toDate(), "dd MMM", { locale: es }) : '...'}</span>
                              <div className="w-1 h-1 rounded-full bg-slate-200" />
                              <span className="flex items-center gap-1 text-primary italic"><MapPin className="w-3 h-3" /> {order.customerAddress?.slice(0, 20)}...</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Monto Cobrado</p>
                            <span className="text-2xl font-black italic text-slate-900 tracking-tighter">
                              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(order.totalPrice || 0)}
                            </span>
                          </div>
                          <Button 
                            onClick={() => router.push(`/admin/orders#${order.id}`)}
                            size="icon" 
                            className="w-14 h-14 rounded-2xl bg-slate-900 text-white hover:bg-primary shadow-xl transition-all active:scale-90"
                          >
                            <MessageCircle className="w-6 h-6" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
                  <History className="w-16 h-16 mx-auto text-slate-100 mb-4" />
                  <p className="text-slate-300 font-black uppercase tracking-widest italic">Sin solicitudes registradas</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="h-12 bg-white border-t flex items-center justify-center px-8 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Vitriniando Flota Maestro v1.0.2</span>
        </div>
      </footer>
    </div>
  );
}
