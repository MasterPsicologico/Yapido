
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  Truck, 
  MessageCircle, 
  Package, 
  Search, 
  Loader2, 
  Zap,
  User as UserIcon,
  Timer,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, orderBy, doc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { format, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { OrderChat } from '@/components/chat/OrderChat';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Link from 'next/link';

const STATUS_CONFIG = {
  pending: { label: "Por Confirmar", color: "bg-orange-500", icon: Timer, desc: "Tienes 20 min para aceptar" },
  preparing: { label: "Preparando", color: "bg-blue-500", icon: Package, desc: "Avisando a la red de despacho" },
  ready_for_pickup: { label: "Listo en Tienda", color: "bg-indigo-500", icon: CheckCircle2, desc: "Esperando recolección" },
  shipped: { label: "En Reparto", color: "bg-purple-500", icon: Truck, desc: "Producto en camino" },
  delivered: { label: "Entregado", color: "bg-green-500", icon: CheckCircle2, desc: "Venta finalizada" },
  cancelled: { label: "Cancelado", color: "bg-red-500", icon: AlertTriangle, desc: "Orden anulada" }
};

function OrderTimer({ createdAt, status }: { createdAt: any, status: string }) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (status !== 'pending' || !createdAt) return;
    const tick = () => {
      const diff = 20 - differenceInMinutes(new Date(), createdAt.toDate());
      setTimeLeft(diff > 0 ? diff : 0);
    };
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [createdAt, status]);

  if (status !== 'pending' || timeLeft === null) return null;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
      timeLeft <= 5 ? "bg-red-50 text-red-600 border-red-100 animate-pulse" : "bg-orange-50 text-orange-600 border-orange-100"
    )}>
      <Clock className="w-3 h-3" />
      {timeLeft > 0 ? `${timeLeft}m restante` : "TIEMPO EXPIRADO"}
    </div>
  );
}

export default function OrdersManagementPage() {
  const { user } = useUser();
  const { profile, isLoading: profileLoading } = useProfile();
  const firestore = useFirestore();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrderForChat, setSelectedOrderForChat] = useState<any | null>(null);

  // CONSULTA MAESTRA: Filtrada quirúrgicamente por 'viewers' para evitar errores de permisos
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || profileLoading) return null;
    return query(
      collection(firestore, 'orders'),
      where('viewers', 'array-contains', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user?.uid, profileLoading]);

  const { data: orders, isLoading: ordersLoading } = useCollection(ordersQuery);

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    const updateData: any = { status: newStatus, updatedAt: serverTimestamp() };
    
    // Al preparar, el pedido se vuelve visible para la red de despacho (Logística Pública)
    if (newStatus === 'preparing') updateData.isLogisticsPublic = true;
    
    updateDocumentNonBlocking(orderRef, updateData);
    toast({ title: "Estado Actualizado" });
  };

  const filteredOrders = orders?.filter(o => 
    o.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (profileLoading || (user && ordersLoading)) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f8fafc]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando Órdenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-primary/20">
              <ClipboardList className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Gestión de Pedidos</h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Panel de Control en Vivo</p>
            </div>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar cliente o producto..." 
              className="pl-10 h-12 rounded-2xl border-none bg-white shadow-sm font-medium" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        {filteredOrders && filteredOrders.length > 0 ? (
          <div className="grid gap-6">
            {filteredOrders.map((order) => {
              const status = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
              const StatusIcon = status.icon;
              const isVenta = order.storeOwnerId === user?.uid;
              const dateStr = order.createdAt ? format(order.createdAt.toDate(), "d 'de' MMMM, HH:mm", { locale: es }) : 'Cargando...';
              
              return (
                <Card key={order.id} id={order.id} className="border-none rounded-[36px] overflow-hidden shadow-sm bg-white hover:shadow-2xl transition-all duration-500 border border-slate-100">
                  <div className="flex flex-col lg:flex-row">
                    <div className={cn("w-full lg:w-2", isVenta ? "bg-secondary" : "bg-primary")} />
                    
                    <CardContent className="flex-1 p-6 lg:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                      <div className="space-y-5 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <Badge className={cn("text-white border-none rounded-full px-4 h-7 text-[9px] font-black uppercase tracking-widest", isVenta ? "bg-secondary" : "bg-primary")}>
                            {isVenta ? "Venta Recibida" : "Mi Compra"}
                          </Badge>
                          <Badge className={cn(status.color, "text-white border-none rounded-full px-4 h-7 text-[9px] font-black uppercase tracking-widest gap-1.5")}>
                            <StatusIcon className="w-3.5 h-3.5" /> {status.label}
                          </Badge>
                          <OrderTimer createdAt={order.createdAt} status={order.status} />
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                             <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">#{order.id.slice(-6)}</span>
                             <span className="text-[10px] font-bold text-primary uppercase bg-primary/5 px-2 rounded-md italic">{status.desc}</span>
                          </div>
                          <h3 className="text-3xl font-black text-slate-900 italic uppercase leading-none">{order.productName}</h3>
                          <div className="flex flex-col gap-1 mt-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center"><UserIcon className="w-3 h-3 text-slate-500" /></div>
                              {/* ENLACE AL PERFIL PÚBLICO: HOJA DE VIDA */}
                              <Link 
                                href={`/profile/${isVenta ? order.customerId : order.storeOwnerId}`}
                                className="text-sm font-black text-slate-700 hover:text-primary transition-colors underline decoration-dotted underline-offset-4"
                              >
                                {isVenta ? order.customerName : order.storeName}
                              </Link>
                            </div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-8">{dateStr}</div>
                          </div>
                        </div>

                        <div className="text-4xl font-black text-slate-900 tracking-tighter flex items-baseline gap-2">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(order.totalPrice)}
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">x{order.quantity}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <Button onClick={() => setSelectedOrderForChat(order)} className="rounded-full h-14 px-8 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs uppercase tracking-widest gap-2 shadow-sm">
                          <MessageCircle className="w-5 h-5 text-primary" /> Chat Directo
                        </Button>
                        
                        {isVenta && order.status === 'pending' && (
                          <div className="flex gap-2 w-full lg:w-auto">
                            <Button onClick={() => handleUpdateStatus(order.id, 'preparing')} className="flex-1 lg:flex-none rounded-full h-14 px-10 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-widest gap-2 shadow-xl">
                              <Zap className="w-5 h-5 text-yellow-300" /> Preparar
                            </Button>
                            <Button onClick={() => handleUpdateStatus(order.id, 'cancelled')} variant="outline" className="rounded-full h-14 px-5 border-red-100 text-red-500 hover:bg-red-50">
                              <AlertTriangle className="w-5 h-5" />
                            </Button>
                          </div>
                        )}

                        {isVenta && order.status === 'preparing' && (
                          <Button onClick={() => handleUpdateStatus(order.id, 'ready_for_pickup')} className="rounded-full h-14 px-10 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest gap-2 shadow-xl">
                            <CheckCircle2 className="w-5 h-5" /> Listo en Tienda
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border-none rounded-[48px] py-24 text-center px-10 shadow-sm border border-slate-100">
            <Package className="w-16 h-16 mx-auto text-slate-100 mb-6" />
            <h3 className="text-2xl font-black text-slate-900 italic uppercase">Sin órdenes activas</h3>
            <p className="text-slate-400 font-medium mt-2">Tus pedidos y ventas aparecerán aquí en tiempo real.</p>
          </div>
        )}
      </main>

      <Dialog open={!!selectedOrderForChat} onOpenChange={(v) => !v && setSelectedOrderForChat(null)}>
        <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-[450px]">
          {selectedOrderForChat && <OrderChat orderId={selectedOrderForChat.id} orderData={selectedOrderForChat} onClose={() => setSelectedOrderForChat(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
