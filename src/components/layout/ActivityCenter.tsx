
"use client";

import { useMemo } from 'react';
import { Bell, Clock, Package, Truck, Zap, CheckCircle2, Navigation, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';

export function ActivityCenter() {
  const { user } = useUser();
  const { profile, isLoading: profileLoading } = useProfile();
  const firestore = useFirestore();

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid || profileLoading) return null;
    return query(
      collection(firestore, 'orders'),
      where('participants', 'array-contains', user.uid)
    );
  }, [firestore, user?.uid, profileLoading]);

  const { data: rawOrders } = useCollection(ordersQuery);

  const activities = useMemo(() => {
    if (!rawOrders || !user) return [];

    const orders = [...rawOrders].sort((a, b) => {
      const tA = a.createdAt?.toMillis?.() || 0;
      const tB = b.createdAt?.toMillis?.() || 0;
      return tB - tA;
    });

    return orders.map(order => {
      if (order.status === 'delivered' || order.status === 'cancelled') return null;

      let task = null;

      if (order.storeOwnerId === user.uid) {
        if (order.status === 'pending') {
          task = { label: "Venta: Nuevo Pedido", desc: order.productName, icon: Zap, color: "text-orange-500", bg: "bg-orange-50" };
        } else if (order.status === 'preparing') {
          task = { label: "Venta: Preparando", desc: order.productName, icon: Clock, color: "text-blue-500", bg: "bg-blue-50" };
        } else if (order.status === 'ready_for_pickup') {
          task = { label: "Venta: Listo en Tienda", desc: order.productName, icon: CheckCircle2, color: "text-indigo-500", bg: "bg-indigo-50" };
        } else if (order.status === 'shipped') {
          task = { label: "Venta: En Reparto", desc: order.productName, icon: Truck, color: "text-purple-500", bg: "bg-purple-50" };
        }
      } 
      else if (order.deliveryDriverId === user.uid) {
        if (order.status === 'shipped') {
          task = { label: "Ruta: Entrega en Curso", desc: order.productName, icon: Navigation, color: "text-secondary", bg: "bg-secondary/10" };
        }
      }
      else if (order.customerId === user.uid) {
        if (order.status === 'shipped') {
          task = { label: "Compra: Confirmar Entrega", desc: order.productName, icon: Package, color: "text-blue-500", bg: "bg-blue-50" };
        } else {
          task = { label: "Compra: En Seguimiento", desc: order.productName, icon: Timer, color: "text-slate-500", bg: "bg-slate-50" };
        }
      }
      
      if (!task && profile?.role === 'repartidor' && order.status === 'ready_for_pickup' && !order.deliveryDriverId) {
        task = { label: "Ruta: Disponible ahora", desc: order.productName, icon: Truck, color: "text-green-500", bg: "bg-green-50" };
      }

      if (task) {
        return { ...task, orderId: order.id };
      }
      return null;
    }).filter(Boolean);
  }, [rawOrders, user, profile]);

  const count = activities.length;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-slate-100 transition-colors h-9 w-9">
          <Bell className={cn("w-4.5 h-4.5", count > 0 ? "text-primary animate-vibrate" : "text-slate-400")} />
          {count > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              {count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-2 rounded-[28px] shadow-2xl border-none bg-white mt-2" align="center">
        <DropdownMenuLabel className="px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black italic uppercase tracking-tighter text-slate-900">Actividad Viva</span>
            <Badge variant="secondary" className="rounded-full text-[10px] font-black bg-primary/10 text-primary border-none">{count}</Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-50" />
        <div className="max-h-[350px] overflow-y-auto p-1 space-y-2 no-scrollbar">
          {activities.length > 0 ? activities.map((act, i) => {
            const Icon = act!.icon;
            return (
              <DropdownMenuItem key={i} asChild className="rounded-2xl p-3.5 cursor-pointer focus:bg-slate-50 border border-transparent focus:border-slate-100 transition-all hover:scale-[1.02]">
                <Link href={`/admin/orders#${act!.orderId}`} className="flex items-start gap-4">
                  <div className={cn("w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm", act!.bg, act!.color)}>
                    <Icon className="w-5.5 h-5.5" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 leading-none">{act!.label}</p>
                    <p className="text-[15px] font-black text-slate-900 leading-tight italic uppercase tracking-tighter truncate">
                      {act!.desc}
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            );
          }) : (
            <div className="py-10 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6 text-slate-200" />
              </div>
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
