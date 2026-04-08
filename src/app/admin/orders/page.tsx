
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  MessageCircle, 
  Package, 
  Loader2, 
  Timer,
  AlertTriangle,
  ArrowRight,
  Store as StoreIcon,
  ChevronRight,
  ArrowLeft,
  Wallet,
  ShieldCheck,
  Lock,
  Star,
  RotateCcw,
  MapPin,
  TrendingUp,
  Zap,
  Truck,
  User as UserIcon,
  XCircle,
  Award
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, doc, serverTimestamp } from 'firebase/firestore';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { OrderChat } from '@/components/chat/OrderChat';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RatingDialog } from '@/components/order/RatingDialog';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const STATUS_CONFIG = {
  inquiry: { label: "CONSULTA", color: "text-cyan-500", bg: "bg-cyan-50", border: "border-cyan-100", icon: MessageCircle },
  pending: { label: "PENDIENTE", color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100", icon: Timer },
  preparing: { label: "PREPARANDO", color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100", icon: Package },
  ready_for_pickup: { label: "LISTO EN TIENDA", color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-100", icon: CheckCircle2 },
  at_store: { label: "REPARTIDOR EN TIENDA", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", icon: ShieldCheck },
  delivered_to_driver: { label: "CON REPARTIDOR", color: "text-purple-500", bg: "bg-purple-100", border: "border-purple-200", icon: Zap },
  shipped: { label: "EN REPARTO", color: "text-purple-500", bg: "bg-purple-100", border: "border-purple-200", icon: Zap },
  delivered: { label: "ENTREGADO", color: "text-green-500", bg: "bg-green-100", border: "border-green-200", icon: CheckCircle2 },
  cancelled: { label: "CANCELADO", color: "text-red-500", bg: "bg-red-100", border: "border-red-200", icon: AlertTriangle }
};

export default function OrdersManagementPage() {
  const { user } = useUser();
  const { profile, isLoading: profileLoading } = useProfile();
  const firestore = useFirestore();
  const router = useRouter();
  
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [showMyPurchases, setShowMyPurchases] = useState(false);

  // EFECTO DE NAVEGACIÓN DIRECTA: Detecta ID en el hash para abrir el chat de inmediato
  useEffect(() => {
    const handleHash = () => {
      const hashId = window.location.hash.replace('#', '');
      if (hashId && hashId.length > 5) {
        setActiveOrderId(hashId);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    if (!profileLoading && profile && !profile.phoneNumber) {
      toast({ title: "Acceso Restringido", description: "Registra tu teléfono.", variant: "destructive" });
      router.push('/profile');
    }
  }, [profile, profileLoading, router]);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'orders'), where('participants', 'array-contains', user.uid));
  }, [firestore, user?.uid]);
  const { data: rawOrders, isLoading: ordersLoading } = useCollection(ordersQuery);

  const myStoresQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'stores'), where('ownerId', '==', user.uid));
  }, [firestore, user?.uid]);
  const { data: myStores, isLoading: storesLoading } = useCollection(myStoresQuery);

  const contractedStoreIds = profile?.contractedStores || [];
  const trustedStoresQuery = useMemoFirebase(() => {
    if (!firestore || contractedStoreIds.length === 0) return null;
    return query(collection(firestore, 'stores'), where('id', 'in', contractedStoreIds.slice(0, 10)));
  }, [firestore, contractedStoreIds]);
  const { data: trustedStores } = useCollection(trustedStoresQuery);

  const storeSummaries = useMemo(() => {
    if (!myStores || !rawOrders) return [];
    return myStores.map(store => {
      const storeOrders = rawOrders.filter(o => o.storeId === store.id);
      const active = storeOrders.filter(o => !['delivered', 'cancelled', 'inquiry'].includes(o.status));
      const todayDelivered = storeOrders.filter(o => o.status === 'delivered' && o.createdAt && isToday(o.createdAt.toDate()));
      const revenueToday = todayDelivered.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
      return { ...store, activeCount: active.length, todayCount: todayDelivered.length, revenueToday };
    });
  }, [myStores, rawOrders]);

  if (profileLoading || ordersLoading || storesLoading) return <div className="fixed inset-0 flex items-center justify-center bg-white"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

  const isDetailView = selectedStoreId || showMyPurchases;
  const filteredOrders = isDetailView ? rawOrders?.filter(o => {
    if (showMyPurchases) return o.customerId === user?.uid;
    return o.storeId === selectedStoreId;
  }).sort((a, b) => {
    const timeA = a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
    const timeB = b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
    return timeB - timeA;
  }) : [];

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      
      {isDetailView ? (
        <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl animate-in fade-in">
          <Button variant="ghost" onClick={() => { setSelectedStoreId(null); setShowMyPurchases(false); }} className="mb-6 gap-2 text-slate-400 font-bold hover:text-primary">
            <ArrowLeft className="w-4 h-4" /> Volver al Panel
          </Button>
          <div className="grid gap-8">
            {filteredOrders?.map(order => (
              <Card key={order.id} id={order.id} className="border-none rounded-[40px] shadow-xl bg-white overflow-hidden ring-1 ring-black/[0.03]">
                <CardContent className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <Badge className={cn("text-[9px] font-black uppercase px-3 h-6 border-none", order.storeOwnerId === user?.uid ? "bg-primary" : "bg-secondary")}>
                      {order.storeOwnerId === user?.uid ? "VENTA" : "COMPRA"}
                    </Badge>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{order.createdAt ? format(order.createdAt.toDate(), "dd MMM, HH:mm", { locale: es }) : ''}</span>
                  </div>
                  <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">{order.productName}</h3>
                  <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3"><StoreIcon className="w-4 h-4 text-primary" /><span className="text-xs font-bold uppercase italic">{order.storeName}</span></div>
                    <span className="text-lg font-black text-primary">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(order.totalPrice || 0)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setActiveOrderId(order.id)} className="flex-1 h-12 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest gap-2">CHAT INTERNO</Button>
                    <Button onClick={() => window.open(`https://wa.me/57${(order.customerPhone || '').replace(/\D/g, '')}`)} className="flex-1 h-12 rounded-2xl bg-[#25d366] text-white font-black text-[10px] uppercase tracking-widest gap-2">WHATSAPP</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      ) : (
        <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl space-y-12">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-primary rounded-[24px] flex items-center justify-center text-white shadow-xl"><StoreIcon className="w-8 h-8" /></div>
            <div><h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-slate-900">Panel Maestro</h1><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Centro de Comando Digital</p></div>
          </div>

          {trustedStores && trustedStores.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 italic">Mis Proveedores de Confianza</h3>
              </div>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                {trustedStores.map(store => (
                  <Link key={store.id} href={`/stores/${store.id}`}>
                    <Card className="min-w-[160px] border-none rounded-[32px] bg-white shadow-md hover:shadow-xl transition-all p-4 text-center space-y-3 group">
                      <div className="relative w-16 h-16 mx-auto rounded-2xl overflow-hidden shadow-inner bg-slate-50 border border-slate-100">
                        <Image src={store.imageUrl || 'https://picsum.photos/seed/store/200'} alt={store.name} fill className="object-cover group-hover:scale-110 transition-transform" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase italic tracking-tighter text-slate-900 truncate">{store.name}</p>
                        <Badge className="bg-primary/10 text-primary border-none text-[7px] font-black uppercase px-2 h-4 mt-1">VOLVER A PEDIR</Badge>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="grid gap-6">
            {storeSummaries.map((store) => (
              <Card key={store.id} onClick={() => setSelectedStoreId(store.id)} className="group border-none rounded-[40px] shadow-lg bg-white cursor-pointer hover:shadow-2xl transition-all overflow-hidden p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 group-hover:text-primary transition-colors">{store.name}</h2>
                  <ChevronRight className="w-6 h-6 text-slate-300 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-orange-50 p-4 rounded-3xl"><p className="text-[8px] font-black text-orange-400 uppercase tracking-widest mb-1">Órdenes Vivas</p><span className="text-2xl font-black text-orange-600">{store.activeCount}</span></div>
                  <div className="bg-blue-50 p-4 rounded-3xl"><p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Ventas Hoy</p><span className="text-sm font-black text-blue-600">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(store.revenueToday)}</span></div>
                </div>
              </Card>
            ))}

            <Card onClick={() => setShowMyPurchases(true)} className="group border-none rounded-[40px] shadow-lg bg-slate-900 text-white cursor-pointer hover:bg-black transition-all p-8 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-primary"><TrendingUp className="w-6 h-6" /></div>
                <div><h3 className="text-2xl font-black italic uppercase tracking-tighter">Mis Compras</h3><p className="text-slate-500 font-bold text-[8px] uppercase tracking-[0.3em]">Historial Personal</p></div>
              </div>
              <ChevronRight className="w-6 h-6 text-slate-600 group-hover:translate-x-1 transition-transform" />
            </Card>
          </div>
        </main>
      )}

      <Dialog open={!!activeOrderId} onOpenChange={(v) => { if(!v) { setActiveOrderId(null); window.location.hash = ''; } }}>
        <DialogContent className="p-0 border-none bg-white max-w-none w-screen h-[100dvh] flex flex-col z-[500] [&>button:last-child]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Chat Maestro de Órdenes</DialogTitle>
            <DialogDescription>Gestión centralizada de comunicación.</DialogDescription>
          </DialogHeader>
          {activeOrderId && <OrderChat orderId={activeOrderId} orderData={rawOrders?.find(o => o.id === activeOrderId)} onClose={() => { setActiveOrderId(null); window.location.hash = ''; }} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
