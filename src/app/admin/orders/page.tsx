
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
  ArrowRight,
  Calendar,
  MapPin
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, doc, serverTimestamp } from 'firebase/firestore';
import { format, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { OrderChat } from '@/components/chat/OrderChat';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Link from 'next/link';

const STATUS_CONFIG = {
  pending: { label: "PENDIENTE", color: "bg-orange-500", icon: Timer, desc: "Tienes 20 min para aceptar" },
  preparing: { label: "PREPARANDO", color: "bg-blue-500", icon: Package, desc: "Avisando a la red de despacho" },
  ready_for_pickup: { label: "LISTO PARA REPARTO", color: "bg-indigo-500", icon: CheckCircle2, desc: "Esperando recolección" },
  shipped: { label: "EN REPARTO", color: "bg-purple-500", icon: Truck, desc: "Producto en camino" },
  delivered: { label: "ENTREGADO", color: "bg-green-500", icon: CheckCircle2, desc: "Venta finalizada" },
  cancelled: { label: "CANCELADO", color: "bg-red-500", icon: AlertTriangle, desc: "Orden anulada" }
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

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || profileLoading) return null;
    return query(
      collection(firestore, 'orders'),
      where('participants', 'array-contains', user.uid)
    );
  }, [firestore, user?.uid, profileLoading]);

  const { data: rawOrders, isLoading: ordersLoading } = useCollection(ordersQuery);

  const orders = useMemo(() => {
    if (!rawOrders) return null;
    return [...rawOrders].sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || 0;
      return timeB - timeA;
    });
  }, [rawOrders]);

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', orderId);
    const updateData: any = { status: newStatus, updatedAt: serverTimestamp() };
    
    if (newStatus === 'preparing') updateData.isLogisticsPublic = true;
    
    updateDocumentNonBlocking(orderRef, updateData);
    toast({ title: "Estado Actualizado" });
  };

  const handleWhatsAppChat = (phone: string, productName: string) => {
    if (!phone) {
      toast({ title: "Sin número", description: "No se encontró teléfono de contacto.", variant: "destructive" });
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const message = `Hola, te hablo de Vitriniando sobre tu pedido de ${productName}.`;
    window.open(`https://wa.me/57${cleanPhone.startsWith('57') ? cleanPhone.slice(2) : cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
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
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex flex-col gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-primary/20">
              <ClipboardList className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Gestión de Pedidos</h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Panel de Control en Vivo</p>
            </div>
          </div>

          <div className="relative w-full">
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
          <div className="grid gap-8">
            {filteredOrders.map((order) => {
              const status = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
              const isVenta = order.storeOwnerId === user?.uid;
              const dateStr = order.createdAt ? format(order.createdAt.toDate(), "d 'de' MMMM, HH:mm", { locale: es }) : 'Cargando...';
              
              return (
                <Card key={order.id} id={order.id} className="border-none rounded-[48px] overflow-hidden shadow-2xl bg-white border border-slate-50">
                  <CardContent className="p-8 space-y-6">
                    {/* Badges Header */}
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className={cn("text-white border-none rounded-full px-5 h-9 text-[10px] font-black uppercase tracking-widest", isVenta ? "bg-secondary" : "bg-primary")}>
                        <Zap className="w-3.5 h-3.5 mr-2" />
                        {isVenta ? "VENTA RECIBIDA" : "MI COMPRA"}
                      </Badge>
                      <Badge className={cn(status.color, "text-white border-none rounded-full px-5 h-9 text-[10px] font-black uppercase tracking-widest gap-2")}>
                        <Clock className="w-3.5 h-3.5" /> {status.label}
                      </Badge>
                    </div>

                    {/* Date Badge */}
                    <div className="flex items-center gap-2 bg-slate-50 w-fit px-4 py-1.5 rounded-full border border-slate-100">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{dateStr}</span>
                    </div>

                    {/* Order Info */}
                    <div className="space-y-4">
                      <h3 className="text-4xl font-black text-slate-900 italic uppercase leading-tight tracking-tighter">
                        {order.productName}
                      </h3>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <UserIcon className="w-4 h-4 text-primary" />
                          <span className="text-xs font-black uppercase tracking-widest text-slate-400">CLIENTE: </span>
                          <Link 
                            href={`/profile/${isVenta ? order.customerId : order.storeOwnerId}`}
                            className="text-sm font-black text-slate-800 hover:text-primary transition-colors"
                          >
                            {isVenta ? order.customerName : order.storeName}
                          </Link>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-secondary" />
                          <span className="text-xs font-black uppercase tracking-widest text-slate-400">UBICACIÓN: </span>
                          <span className="text-sm font-black text-slate-800 italic">WhatsApp Cliente</span>
                        </div>
                      </div>

                      <div className="flex items-baseline gap-2 pt-2">
                        <span className="text-5xl font-black text-slate-900 tracking-tighter">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(order.totalPrice)}
                        </span>
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest italic">x{order.quantity}un.</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3 pt-4">
                      {isVenta && order.status === 'pending' && (
                        <Button 
                          onClick={() => handleUpdateStatus(order.id, 'preparing')} 
                          className="w-full h-16 rounded-full bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-widest gap-3 shadow-xl shadow-primary/20 transition-all active:scale-95"
                        >
                          <Package className="w-6 h-6" /> PREPARAR
                        </Button>
                      )}

                      {isVenta && order.status === 'preparing' && (
                        <Button 
                          onClick={() => handleUpdateStatus(order.id, 'ready_for_pickup')} 
                          className="w-full h-16 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-widest gap-3 shadow-xl shadow-indigo-100"
                        >
                          <CheckCircle2 className="w-6 h-6" /> LISTO EN TIENDA
                        </Button>
                      )}

                      {/* Botón WhatsApp - Chat Cliente */}
                      <Button 
                        onClick={() => handleWhatsAppChat(isVenta ? order.customerPhone : '', order.productName)}
                        className="w-full h-16 rounded-full bg-[#25d366] hover:bg-[#128c7e] text-white font-black text-sm uppercase tracking-widest gap-3 shadow-xl shadow-green-100 border-none transition-transform active:scale-95"
                      >
                        <MessageCircle className="w-6 h-6" /> CHAT CLIENTE
                      </Button>

                      {/* Botón Chat Directo (Opcional/Secundario) */}
                      <Button 
                        variant="ghost"
                        onClick={() => setSelectedOrderForChat(order)} 
                        className="w-full h-12 rounded-full text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50"
                      >
                        CHAT INTERNO DE SOPORTE
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border-none rounded-[48px] py-24 text-center px-10 shadow-sm border border-slate-100">
            <Package className="w-16 h-16 mx-auto text-slate-100 mb-6" />
            <h3 className="text-2xl font-black text-slate-900 italic uppercase">Sin órdenes activas</h3>
            <p className="text-slate-400 font-medium mt-2">Tus pedidos aparecerán aquí en tiempo real.</p>
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
