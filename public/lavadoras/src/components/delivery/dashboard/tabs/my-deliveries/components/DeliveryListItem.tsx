
"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Timer, CheckCircle2, Clock, ChevronDown, Truck, Trash2, AlertTriangle, Droplets, WashingMachine, MapPin, PackageCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

interface DeliveryListItemProps {
  order: any;
  isCompleted: boolean;
  isExpired: boolean;
  timeIn: string;
  onClick: () => void;
}

// ═══ STATUS ACTIVITY ANIMATION ═══
function StatusActivity({ status }: { status: string }) {
  const configs: Record<string, { label: string; icon: React.ReactNode; color: string; animation: string }> = {
    ready_for_pickup: {
      label: 'Esperando recogida',
      icon: <PackageCheck className="w-3 h-3" />,
      color: 'text-blue-500',
      animation: 'animate-pulse'
    },
    shipped: {
      label: 'En camino a entregar',
      icon: <Truck className="w-3 h-3" />,
      color: 'text-indigo-500',
      animation: 'animate-bounce'
    },
    delivered: {
      label: 'Lavadora en uso',
      icon: <Droplets className="w-3 h-3" />,
      color: 'text-cyan-500',
      animation: ''
    },
    picking_up: {
      label: 'Recogiéndose',
      icon: <MapPin className="w-3 h-3" />,
      color: 'text-orange-500',
      animation: 'animate-bounce'
    },
    at_pickup: {
      label: 'En punto de recogida',
      icon: <MapPin className="w-3 h-3" />,
      color: 'text-amber-500',
      animation: 'animate-pulse'
    },
    completed: {
      label: 'Servicio completado',
      icon: <CheckCircle2 className="w-3 h-3" />,
      color: 'text-green-500',
      animation: ''
    },
  };

  const config = configs[status] || configs.delivered;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className={cn("flex items-center gap-1.5 mt-1", config.color)}
    >
      {/* Animated dot */}
      <span className="relative flex h-2 w-2">
        <span className={cn(
          "absolute inline-flex h-full w-full rounded-full opacity-75",
          status === 'delivered' ? "bg-cyan-400 animate-ping" : 
          status === 'shipped' || status === 'picking_up' ? "bg-current animate-ping" : 
          "bg-current animate-pulse"
        )} />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
      </span>

      {/* Activity icon */}
      <span className={config.animation}>{config.icon}</span>

      {/* Label with typing effect */}
      <span className="text-[8px] font-bold uppercase tracking-widest">
        {config.label}
      </span>

      {/* Washing machine animation for 'delivered' status */}
      {status === 'delivered' && (
        <motion.span
          animate={{ rotate: [0, 10, -10, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <WashingMachine className="w-3 h-3 text-cyan-400" />
        </motion.span>
      )}

      {/* Truck moving animation for shipping/pickup */}
      {(status === 'shipped' || status === 'picking_up') && (
        <motion.span
          animate={{ x: [0, 4, 0] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
        >
          <Truck className="w-3 h-3" />
        </motion.span>
      )}
    </motion.div>
  );
}

// ═══ DELETE CONFIRMATION DIALOG ═══
function DeleteConfirmation({ 
  customerName, 
  onConfirm, 
  onCancel 
}: { customerName: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl space-y-5"
      >
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-black text-slate-900 tracking-tight">¿Eliminar cliente?</h3>
          <p className="text-sm text-slate-500">
            Estás a punto de cancelar definitivamente el pedido de <span className="font-bold text-slate-700">{customerName}</span>. 
            Esta acción no se puede deshacer.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors active:scale-95"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-colors active:scale-95 shadow-lg shadow-red-500/30"
          >
            Sí, eliminar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function DeliveryListItem({ order, isCompleted, isExpired, timeIn, onClick }: DeliveryListItemProps) {
  const isPickupPhase = order.status === 'picking_up' || order.status === 'at_pickup';
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const firestore = useFirestore();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!firestore) return;
    const orderRef = doc(firestore, 'orders', order.id);
    updateDocumentNonBlocking(orderRef, {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
      cancelledBy: 'store_owner',
      updatedAt: serverTimestamp()
    });
    toast({ 
      title: "Cliente eliminado", 
      description: `El pedido de ${order.customerName} ha sido cancelado.`,
      className: "bg-red-600 text-white border-none"
    });
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <Card 
        onClick={onClick}
        className={cn(
          "border-none rounded-[32px] overflow-hidden transition-all duration-500 ring-2 cursor-pointer",
          "bg-white shadow-xl", 
          isExpired && "animate-pulse-red-glow ring-red-500/50",
          isCompleted && "ring-green-500/50",
          isPickupPhase && "ring-orange-400/50"
        )}
      >
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Status Icon */}
            <div className={cn(
              "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-inner",
              isCompleted ? "bg-green-500 text-white" : isPickupPhase ? "bg-orange-500 text-white" : isExpired ? "bg-red-500 text-white" : "bg-slate-50 text-slate-400"
            )}>
              {isCompleted ? <CheckCircle2 className="w-5 h-5 animate-in zoom-in" /> : isPickupPhase ? <Truck className="w-5 h-5 animate-bounce" /> : <Timer className={cn("w-5 h-5", isExpired && "animate-bounce")} />}
            </div>

            {/* Client Info */}
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-semibold uppercase tracking-wide leading-snug text-slate-800 break-words pr-2" style={{ fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif" }}>
                {order.customerName}
              </h4>

              {/* ═══ STATUS ACTIVITY ANIMATION ═══ */}
              <StatusActivity status={order.status} />

              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Clock className="w-2.5 h-2.5 text-slate-300" /><span className="text-[8px] font-bold uppercase text-slate-400 tracking-wider">Inicio: {timeIn}</span>
                {isCompleted && <Badge className="bg-green-500 text-white border-none text-[7px] font-black uppercase px-1.5 h-4 ml-1">FINALIZADO</Badge>}
                {isPickupPhase && <Badge className="bg-orange-500 text-white border-none text-[7px] font-black uppercase px-1.5 h-4 ml-1">RECOGIENDO</Badge>}
              </div>
            </div>
          </div>

          {/* Right Actions: Delete + Chevron */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <button
              onClick={handleDelete}
              className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors active:scale-90 group"
              aria-label="Eliminar cliente"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400 group-hover:text-red-600 transition-colors" />
            </button>
            <ChevronDown className="w-4 h-4 text-slate-300" />
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <DeleteConfirmation
            customerName={order.customerName}
            onConfirm={confirmDelete}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
