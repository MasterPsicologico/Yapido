"use client";

import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { format, addHours, differenceInSeconds, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { OrderChat } from '@/components/chat/OrderChat';

// COMPONENTES ATÓMICOS SUBDIVIDIDOS
import { DateSelector } from './my-deliveries/components/DateSelector';
import { DeliveryListItem } from './my-deliveries/components/DeliveryListItem';
import { TerminalView } from './my-deliveries/components/TerminalView';

interface MyDeliveriesTabProps {
  rentals: any[];
  onUpdateStatus: (status: string, metadata?: any) => void;
}

export function MyDeliveriesTab({ rentals, onUpdateStatus }: MyDeliveriesTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [now, setNow] = useState(new Date());
  const [internalChatOrder, setInternalChatOrder] = useState<any | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (expandedId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [expandedId]);

  const monthDays = useMemo(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    return eachDayOfInterval({ start, end });
  }, []);

  // LÓGICA DE AUDITORÍA: Días con lavadoras que no se han traído (En uso)
  const pendingDates = useMemo(() => {
    return rentals
      .filter(order => order.status === 'delivered')
      .map(order => {
        const ts = order.createdAt || order.deliveredAt;
        const date = ts?.toDate?.() || (ts?.seconds ? new Date(ts.seconds * 1000) : null);
        return date ? format(date, 'yyyy-MM-dd') : null;
      })
      .filter(Boolean) as string[];
  }, [rentals]);

  const handleAdjustHours = (orderId: string, extra: number, currentHours: number) => {
    if (!firestore) return;
    if (extra < 0 && currentHours <= 1) {
      toast({ title: "Acción Denegada", description: "Mínimo 1 hora de servicio.", variant: "destructive" });
      return;
    }
    const orderRef = doc(firestore, 'orders', orderId);
    updateDocumentNonBlocking(orderRef, {
      requestHours: increment(extra),
      totalPrice: increment(extra * 3500),
      updatedAt: serverTimestamp()
    });
    toast({ title: extra > 0 ? "+1 Hora Añadida" : "-1 Hora Removida", className: extra > 0 ? "bg-green-600 text-white" : "bg-red-600 text-white" });
  };

  // Pedidos en fase de recogida: SIEMPRE visibles, no dependen del filtro de fecha
  const activePickupOrders = useMemo(() => {
    return rentals.filter(o => ['picking_up', 'at_pickup'].includes(o.status));
  }, [rentals]);

  const filteredRentals = useMemo(() => {
    return rentals.filter(order => {
      // Los pedidos de recogida activa ya están en su propia sección, no duplicar
      if (['picking_up', 'at_pickup'].includes(order.status)) return false;

      // EXCEPCIÓN DE PERSISTENCIA CONTINUA:
      // Cualquier pedido que no esté finalizado (completed o cancelled)
      // SIEMPRE debe ser visible para garantizar la continuidad de la misión.
      // Así el repartidor nunca pierde de vista una lavadora activa, incluso si cambia el día.
      if (order.status !== 'completed' && order.status !== 'cancelled') {
        return true;
      }

      const orderDate = order.createdAt?.toDate?.() || (order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000) : null);
      if (!orderDate) return false;
      return isSameDay(orderDate, selectedDate);
    });
  }, [rentals, selectedDate]);

  const activeCount = filteredRentals.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length + activePickupOrders.length;

  const handleFinalizePickUp = (orderId: string) => {
    onUpdateStatus('completed', { 
      id: orderId, 
      isPickupDone: true
    });
    setExpandedId(null);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      <DateSelector 
        monthDays={monthDays} 
        selectedDate={selectedDate} 
        onSelectDate={setSelectedDate} 
        pendingDates={pendingDates}
      />

      <div className="grid gap-4">
        <div className="flex items-center justify-between px-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">Control de Campo <span className="text-slate-400 ml-1">/ {format(selectedDate, "dd MMM", { locale: es })}</span></h3>
          <Badge className="bg-secondary text-white border-none font-black text-[8px] px-3">{activeCount} ACTIVOS</Badge>
        </div>

        {/* SECCIÓN DE RECOGIDA ACTIVA — anclada, no depende del filtro de fecha */}
        {activePickupOrders.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-4">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 italic">Recogida en Curso</h3>
            </div>
            {activePickupOrders.map((order) => {
              const isExpanded = expandedId === order.id;
              const deliveredAt = order.deliveredAt?.toDate?.() || (order.deliveredAt?.seconds ? new Date(order.deliveredAt.seconds * 1000) : null);
              const durationHours = order.requestHours || 5;
              const expiryTime = deliveredAt ? addHours(deliveredAt, durationHours) : null;
              const remaining = expiryTime ? differenceInSeconds(expiryTime, now) : 0;
              const isExpired = remaining < 0;
              const absRemaining = Math.abs(remaining);
              const timeIn = deliveredAt ? format(deliveredAt, "HH:mm") : "--:--";
              const timeOut = expiryTime ? format(expiryTime, "HH:mm") : "--:--";
              return (
                <div key={order.id}>
                  <DeliveryListItem
                    order={order}
                    isCompleted={false}
                    isExpired={isExpired}
                    timeIn={timeIn}
                    onClick={() => setExpandedId(order.id)}
                  />
                  {isExpanded && (
                    <TerminalView
                      order={order}
                      isCompleted={false}
                      isExpired={isExpired}
                      timeIn={timeIn}
                      timeOut={timeOut}
                      absRemaining={absRemaining}
                      durationHours={durationHours}
                      remaining={remaining}
                      onClose={() => setExpandedId(null)}
                      onAdjustHours={(delta) => handleAdjustHours(order.id, delta, order.requestHours)}
                      onInternalChat={() => setInternalChatOrder(order)}
                      onUpdateStatus={onUpdateStatus}
                      onFinalize={handleFinalizePickUp}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* LISTA FILTRADA POR FECHA */}
        {filteredRentals.length === 0 ? (
          activePickupOrders.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[48px] border-2 border-dashed border-slate-100">
              <p className="text-slate-300 font-black uppercase tracking-widest italic text-xs">Sin registros para la fecha seleccionada</p>
            </div>
          )
        ) : (
          filteredRentals.map((order) => {
            const isExpanded = expandedId === order.id;
            const isCompleted = order.status === 'completed';
            const deliveredAt = order.deliveredAt?.toDate?.() || (order.deliveredAt?.seconds ? new Date(order.deliveredAt.seconds * 1000) : null);
            const durationHours = order.requestHours || 5;
            const expiryTime = deliveredAt ? addHours(deliveredAt, durationHours) : null;
            const remaining = expiryTime ? differenceInSeconds(expiryTime, now) : 0;
            const isExpired = remaining < 0 && !isCompleted;
            const absRemaining = Math.abs(remaining);
            const timeIn = deliveredAt ? format(deliveredAt, "HH:mm") : "--:--";
            const timeOut = expiryTime ? format(expiryTime, "HH:mm") : "--:--";

            return (
              <div key={order.id}>
                <DeliveryListItem 
                  order={order}
                  isCompleted={isCompleted}
                  isExpired={isExpired}
                  timeIn={timeIn}
                  onClick={() => setExpandedId(order.id)}
                />

                {isExpanded && (
                  <TerminalView 
                    order={order}
                    isCompleted={isCompleted}
                    isExpired={isExpired}
                    timeIn={timeIn}
                    timeOut={timeOut}
                    absRemaining={absRemaining}
                    durationHours={durationHours}
                    remaining={remaining}
                    onClose={() => setExpandedId(null)}
                    onAdjustHours={(delta) => handleAdjustHours(order.id, delta, order.requestHours)}
                    onInternalChat={() => setInternalChatOrder(order)}
                    onUpdateStatus={onUpdateStatus}
                    onFinalize={handleFinalizePickUp}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      <Dialog open={!!internalChatOrder} onOpenChange={v => !v && setInternalChatOrder(null)}>
        <DialogContent className="p-0 border-none bg-white shadow-none max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 sm:p-4 md:p-8 flex flex-col z-[700] [&>button:last-child]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Canal Seguro</DialogTitle>
            <DialogDescription>Comunicación directa y protegida.</DialogDescription>
          </DialogHeader>
          {internalChatOrder && (
            <div className="flex-1 min-h-0 w-full animate-in zoom-in duration-300">
              <OrderChat orderId={internalChatOrder.id} orderData={internalChatOrder} onClose={() => setInternalChatOrder(null)} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
