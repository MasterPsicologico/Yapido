
"use client";

import { useMemo } from 'react';
import { Bell, Clock, Package, Truck, Zap, CheckCircle2, Navigation, Timer } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where } from 'firebase/firestore';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ActivityTrigger } from './ActivityTrigger';
import { ActivityItem } from './ActivityItem';

export function ActivityCenter() {
  const { user } = useUser();
  const { profile, isLoading: profileLoading } = useProfile();
  const firestore = useFirestore();

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || profileLoading) return null;
    return query(collection(firestore, 'orders'), where('participants', 'array-contains', user.uid));
  }, [firestore, user?.uid, profileLoading]);

  const { data: rawOrders } = useCollection(ordersQuery);

  const activities = useMemo(() => {
    if (!rawOrders || !user) return [];
    return rawOrders.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      .map(order => {
        if (order.status === 'delivered' || order.status === 'cancelled') return null;
        let task = null;
        if (order.storeOwnerId === user.uid) {
          if (order.status === 'pending') task = { label: "Venta: Nuevo Pedido", desc: order.productName, icon: Zap, color: "text-orange-500", bg: "bg-orange-50" };
          else if (order.status === 'preparing') task = { label: "Venta: Preparando", desc: order.productName, icon: Clock, color: "text-blue-500", bg: "bg-blue-50" };
          else if (order.status === 'ready_for_pickup') task = { label: "Venta: Listo en Tienda", desc: order.productName, icon: CheckCircle2, color: "text-indigo-500", bg: "bg-indigo-50" };
          else if (order.status === 'shipped') task = { label: "Venta: En Reparto", desc: order.productName, icon: Truck, color: "text-purple-500", bg: "bg-purple-50" };
        } 
        else if (order.deliveryDriverId === user.uid && order.status === 'shipped') task = { label: "Ruta: Entrega en Curso", desc: order.productName, icon: Navigation, color: "text-secondary", bg: "bg-secondary/10" };
        else if (order.customerId === user.uid) {
          if (order.status === 'shipped') task = { label: "Compra: Confirmar Entrega", desc: order.productName, icon: Package, color: "text-blue-500", bg: "bg-blue-50" };
          else task = { label: "Compra: En Seguimiento", desc: order.productName, icon: Timer, color: "text-slate-500", bg: "bg-slate-50" };
        }
        if (!task && profile?.role === 'repartidor' && order.status === 'ready_for_pickup' && !order.deliveryDriverId) task = { label: "Ruta: Disponible ahora", desc: order.productName, icon: Truck, color: "text-green-500", bg: "bg-green-50" };
        return task ? { ...task, orderId: order.id } : null;
      }).filter(Boolean);
  }, [rawOrders, user, profile]);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <ActivityTrigger count={activities.length} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-2 rounded-[28px] shadow-2xl border-none bg-white mt-2" align="center">
        <DropdownMenuLabel className="px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black italic uppercase tracking-tighter text-slate-900">Actividad Viva</span>
            <Badge variant="secondary" className="rounded-full text-[10px] font-black bg-primary/10 text-primary border-none">{activities.length}</Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-50" />
        <div className="max-h-[350px] overflow-y-auto p-1 space-y-2 no-scrollbar">
          {activities.length > 0 ? activities.map((act, i) => (
            <ActivityItem key={i} {...act!} />
          )) : (
            <div className="py-10 text-center">
              <Bell className="w-12 h-12 bg-slate-50 rounded-full p-3 mx-auto mb-3 text-slate-200" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Sin notificaciones</p>
            </div>
          )}
        </div>
        <DropdownMenuSeparator className="bg-slate-50" />
        <DropdownMenuItem asChild className="rounded-xl justify-center h-10 focus:bg-primary/5">
          <Link href="/admin/orders" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Ver historial completo</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
