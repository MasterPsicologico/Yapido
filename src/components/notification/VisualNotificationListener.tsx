
'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  CheckCircle2, 
  Truck, 
  MapPin, 
  Clock, 
  ShoppingBag, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const SYNC_KEY = 'vitriniando_status_sync_v1';

const STATUS_CONTENT: Record<string, any> = {
  ready_for_pickup: {
    title: "¡TRATO CONFIRMADO!",
    desc: "Tu solicitud ha sido aceptada por el establecimiento. El equipo está siendo preparado para el despacho.",
    icon: Sparkles,
    color: "text-amber-500",
    bg: "bg-amber-50"
  },
  shipped: {
    title: "¡PEDIDO EN RUTA!",
    desc: "Grandes noticias: El repartidor ha iniciado el trayecto hacia tu ubicación con la lavadora.",
    icon: Truck,
    color: "text-primary",
    bg: "bg-blue-50"
  },
  at_destination: {
    title: "¡REPARTIDOR EN EL SITIO!",
    desc: "El equipo ha llegado a tu dirección. Por favor, asegúrate de tener el espacio despejado para la instalación.",
    icon: MapPin,
    color: "text-green-600",
    bg: "bg-green-50"
  },
  delivered: {
    title: "¡EQUIPO INSTALADO!",
    desc: "La entrega se ha concretado con éxito. Tu tiempo de uso ha comenzado a correr oficialmente.",
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-50"
  },
  completed: {
    title: "MISIÓN FINALIZADA",
    desc: "El repartidor ha recogido el equipo. Gracias por confiar en el sistema de Vitriniando.",
    icon: ShoppingBag,
    color: "text-slate-900",
    bg: "bg-slate-50"
  }
};

/**
 * VisualNotificationListener - El Especialista en Notificaciones Inmersivas.
 * Monitorea cambios de estado y dispara ventanas de pantalla completa.
 */
export function VisualNotificationListener() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  
  const [activeAlert, setActiveAlert] = useState<any | null>(null);
  const [syncedStatus, setSyncedStatus] = useState<Record<string, string>>({});

  // Carga inicial de sincronización local
  useEffect(() => {
    const saved = localStorage.getItem(SYNC_KEY);
    if (saved) setSyncedStatus(JSON.parse(saved));
  }, []);

  // Listener de órdenes vivas del usuario
  useEffect(() => {
    if (!firestore || !user?.uid) return;

    const q = query(
      collection(firestore, 'orders'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const currentSync = JSON.parse(localStorage.getItem(SYNC_KEY) || '{}');
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified' || change.type === 'added') {
          const order = { id: change.doc.id, ...change.doc.data() as any };
          const lastStatus = currentSync[order.id];

          // REGLA MAESTRA: Solo notificar si el estado ha cambiado y es relevante
          if (order.status !== lastStatus && STATUS_CONTENT[order.status]) {
            // No notificar si el usuario fue quien cambió el estado (si fuera repartidor)
            // Aquí priorizamos la notificación al CLIENTE
            if (order.customerId === user.uid) {
              setActiveAlert(order);
            }
          }
        }
      });
    });

    return () => unsubscribe();
  }, [firestore, user?.uid]);

  const handleAcknowledge = (goToOrder: boolean) => {
    if (!activeAlert) return;

    // Actualizar sincronización local para no repetir
    const nextSync = { ...syncedStatus, [activeAlert.id]: activeAlert.status };
    setSyncedStatus(nextSync);
    localStorage.setItem(SYNC_KEY, JSON.stringify(nextSync));

    const alertId = activeAlert.id;
    setActiveAlert(null);

    if (goToOrder) {
      // REDIRECCIÓN DIRECTA: Inyectamos el ID en el hash para que admin/orders lo abra
      window.dispatchEvent(new CustomEvent('order-attended', { detail: { orderId: alertId } }));
      router.push(`/admin/orders#${alertId}`);
    }
  };

  const content = activeAlert ? STATUS_CONTENT[activeAlert.status] : null;
  const Icon = content?.icon || Zap;

  return (
    <Dialog open={!!activeAlert} onOpenChange={(v) => !v && handleAcknowledge(false)}>
      <DialogContent className="max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 rounded-none border-none shadow-none bg-white p-0 overflow-hidden flex flex-col z-[1000] animate-in slide-in-from-bottom duration-500 [&>button:last-child]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Notificación de Pedido</DialogTitle>
          <DialogDescription>Actualización de estado en tiempo real.</DialogDescription>
        </DialogHeader>

        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-12">
          {/* ORNATO SUPERIOR */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 text-primary">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Vitriniando AI Central</span>
            </div>
            <div className="h-0.5 w-12 bg-primary/20 rounded-full mx-auto" />
          </div>

          {/* ICONO HEROICO */}
          <div className="relative">
            <div className={cn("absolute inset-0 rounded-[40px] animate-ping opacity-20", content?.bg.replace('bg-', 'bg-'))} />
            <div className={cn(
              "relative w-32 h-32 rounded-[40px] flex items-center justify-center shadow-2xl border-b-8 transition-all duration-700",
              content?.bg, content?.color, 
              "border-slate-200"
            )}>
              <Icon className="w-16 h-16 animate-in zoom-in duration-500" />
              <Sparkles className="absolute -top-3 -right-3 w-8 h-8 text-yellow-400 animate-pulse" />
            </div>
          </div>

          {/* MENSAJE MAESTRO */}
          <div className="space-y-4 max-w-sm">
            <h2 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter leading-[0.9] text-slate-900">
              {content?.title}
            </h2>
            <p className="text-sm sm:text-base font-bold text-slate-400 uppercase tracking-tight leading-relaxed px-4">
              {content?.desc}
            </p>
          </div>

          {/* ACCIÓN DIRECTA */}
          <div className="w-full max-w-xs space-y-6">
            <Button 
              onClick={() => handleAcknowledge(true)}
              className="w-full h-24 rounded-[32px] bg-primary hover:bg-primary/90 text-white font-black text-xl uppercase italic tracking-widest gap-4 shadow-[0_20px_50px_rgba(59,130,246,0.3)] border-b-[10px] border-blue-800 active:border-b-0 active:translate-y-2 transition-all group"
            >
              GESTIONAR AHORA <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </Button>

            <button 
              onClick={() => handleAcknowledge(false)}
              className="text-[10px] font-black text-slate-300 hover:text-slate-500 uppercase tracking-[0.3em] transition-colors"
            >
              ENTENDIDO, CERRAR
            </button>
          </div>
        </main>

        <footer className="h-16 bg-slate-50 border-t flex items-center justify-center px-8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em]">Protocolo de Sincronización Élite Activo</span>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
