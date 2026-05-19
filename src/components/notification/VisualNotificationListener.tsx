
'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import {
  Zap,
  CheckCircle2,
  Truck,
  MapPin,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

// Constante de audio
const ALERT_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

const SYNC_KEY = 'yapido_click_status_sync_v2';

// ── NOTIFICACIONES DE FASE DE ENTREGA (sin deliveredAt) - Cliente recibe lavadora ──
const DELIVERY_STATUS_CONTENT: Record<string, any> = {
  ready_for_pickup: {
    title: "✨ ¡Lavadora en camino!",
    desc: "Un repartidor ha aceptado llevar tu lavadora. Prepárate para recibirla.",
    icon: Sparkles,
    color: "text-amber-500",
    bg: "bg-amber-50"
  },
  picking_up: {
    title: "🚚 ¡El repartidor va en camino!",
    desc: "Se dirige a la tienda a recoger tu lavadora. Prepárate para la instalación.",
    icon: Truck,
    color: "text-primary",
    bg: "bg-blue-50"
  },
  shipped: {
    title: "🚚 ¡El repartidor viene en camino!",
    desc: "Trae tu lavadora hacia tu dirección. Mantente atento.",
    icon: Truck,
    color: "text-primary",
    bg: "bg-blue-50"
  },
  at_destination: {
    title: "🚪 ¡El repartidor ha llegado!",
    desc: "El repartidor está en tu puerta. Prepárate para recibir la lavadora.",
    icon: MapPin,
    color: "text-green-600",
    bg: "bg-green-50"
  },
  delivered: {
    title: "✅ ¡Lavadora instalada!",
    desc: "Tu lavadora está funcionando. El tiempo de uso ha comenzado.",
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-50"
  }
};

// ── NOTIFICACIONES DE FASE DE RECOGIDA (cuando deliveredAt ya existe) - Cliente devuelve lavadora ──
const PICKUP_STATUS_CONTENT: Record<string, any> = {
  picking_up: {
    title: "🚚 ¡Repartidor en camino!",
    desc: "Se dirige a tu ubicación para recoger la lavadora. Prepárala desconectada y lista.",
    icon: Truck,
    color: "text-orange-500",
    bg: "bg-orange-50"
  },
  completed: {
    title: "✅ Recogida completada",
    desc: "Tu lavadora ha sido retirada exitosamente.",
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-50"
  },
  debt_pending: {
    title: "⚠️ Deuda pendiente",
    desc: "El cobro no se ha completado. Se registrará para cobro posterior.",
    icon: AlertCircle,
    color: "text-amber-500",
    bg: "bg-amber-50"
  }
};

const SOS_STATUS_CONTENT: Record<string, any> = {
  sos: {
    title: "🚨 ¡S.O.S REPORTE DE AVERÍA!",
    desc: "El cliente ha reportado un problema urgente con la lavadora.",
    icon: AlertCircle,
    color: "text-red-600",
    bg: "bg-red-50"
  }
};

/**
 * Selecciona el contenido de notificación correcto según el contexto de la orden.
 * Si la orden ya tiene `deliveredAt` (y no es el mismo instante de 'delivered'), está en fase de recogida.
 */
function getStatusContent(order: any): any | null {
  if (order.isSosActive) {
    return SOS_STATUS_CONTENT['sos'];
  }

  // 'delivered' es la culminación de la entrega. Siempre debe mostrar la alerta de "instalada".
  if (order.status === 'delivered') {
    return DELIVERY_STATUS_CONTENT['delivered'];
  }

  const isPickupPhase = !!order.deliveredAt;

  if (isPickupPhase) {
    return PICKUP_STATUS_CONTENT[order.status] || null;
  }

  return DELIVERY_STATUS_CONTENT[order.status] || null;
}

/**
 * VisualNotificationListener - El Especialista en Sincronía de Causa y Efecto.
 * Interrumpe la navegación del cliente con una terminal inmersiva cuando cambia el estado.
 */
export function VisualNotificationListener() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  
  const [activeAlert, setActiveAlert] = useState<any | null>(null);
  const lastPlayedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!firestore || !user?.uid) return;

    const q = query(
      collection(firestore, 'orders'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const currentSync = JSON.parse(localStorage.getItem(SYNC_KEY) || '{}');
      
      const targetOrders = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() as any }))
        // Solo cliente y dueño de tienda reciben notificaciones visuales.
        // El repartidor NUNCA debe ver estas alertas: él es quien dispara los cambios de status.
        .filter(order => {
          const isDriver = order.deliveryDriverId === user.uid;
          if (isDriver) return false; // El repartidor está excluido siempre
          return (order.customerId === user.uid || order.storeOwnerId === user.uid) && getStatusContent(order);
        })
        .filter(order => {
          // Usar clave compuesta para evitar confusión entre fases con mismo status
          const isPickupPhase = order.status !== 'delivered' && !!order.deliveredAt;
          const sosSuffix = order.isSosActive ? '-SOS' : '';
          const syncValue = `${order.status}:${isPickupPhase ? 'pickup' : 'delivery'}${sosSuffix}`;
          return syncValue !== currentSync[order.id]; // Solo los que no hemos visto en esta fase
        })
        .sort((a, b) => {
          const tA = a.updatedAt?.toMillis?.() || (a.updatedAt?.seconds * 1000) || 0;
          const tB = b.updatedAt?.toMillis?.() || (b.updatedAt?.seconds * 1000) || 0;
          return tB - tA;
        });

      if (targetOrders.length === 0) return;

      const latestOrder = targetOrders[0];
      const now = Date.now();
      const updatedAt = latestOrder.updatedAt?.toMillis?.() || (latestOrder.updatedAt?.seconds * 1000) || now;

      // Evitar disparar alertas de registros antiguos (> 30 min)
      // Usamos Math.abs para protegernos de relojes de sistema desincronizados
      if (Math.abs(now - updatedAt) < 1800000) {
        setActiveAlert(latestOrder);
        
        const isPickupPhase = latestOrder.status !== 'delivered' && !!latestOrder.deliveredAt;
        const sosSuffix = latestOrder.isSosActive ? '-SOS' : '';
        const alertSignature = `${latestOrder.id}-${latestOrder.status}-${isPickupPhase ? 'pickup' : 'delivery'}${sosSuffix}`;
        
        if (lastPlayedRef.current !== alertSignature) {
          lastPlayedRef.current = alertSignature;
          
          // Disparar feedback inmersivo (Sonido y Vibración)
          try {
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200, 100, 400]); // Patrón llamativo
            }
            const audio = new Audio(ALERT_SOUND);
            audio.volume = 0.8;
            audio.play().catch(e => console.warn("Audio autoplay blocked", e));
          } catch (e) {
            console.error("Error reproduciendo feedback", e);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [firestore, user?.uid]);

  const handleAcknowledge = (goToOrder: boolean) => {
    if (!activeAlert) return;

    const currentSync = JSON.parse(localStorage.getItem(SYNC_KEY) || '{}');
    // Clave compuesta: status + fase (entrega vs recogida)
    // Esto evita que picking_up de entrega y picking_up de recogida se confundan
    const isPickupPhase = activeAlert.status !== 'delivered' && !!activeAlert.deliveredAt;
    const sosSuffix = activeAlert.isSosActive ? '-SOS' : '';
    const syncValue = `${activeAlert.status}:${isPickupPhase ? 'pickup' : 'delivery'}${sosSuffix}`;
    const nextSync = { ...currentSync, [activeAlert.id]: syncValue };
    localStorage.setItem(SYNC_KEY, JSON.stringify(nextSync));

    const alertId = activeAlert.id;
    setActiveAlert(null);

    if (goToOrder) {
      window.dispatchEvent(new CustomEvent('order-attended', { detail: { orderId: alertId } }));
      window.dispatchEvent(new CustomEvent('open-global-chat', { detail: { orderId: alertId } }));
    }
  };

  const content = activeAlert ? getStatusContent(activeAlert) : null;
  const Icon = content?.icon || Zap;

  return (
    <Dialog open={!!activeAlert} onOpenChange={(v) => !v && handleAcknowledge(false)}>
      <DialogContent className="max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 rounded-none border-none shadow-none bg-white p-0 overflow-hidden flex flex-col z-[1000] animate-in slide-in-from-bottom duration-500 [&>button:last-child]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Estado de Misión</DialogTitle>
          <DialogDescription>Terminal de Sincronización Real.</DialogDescription>
        </DialogHeader>

        <main className="flex-1 overflow-y-auto no-scrollbar">
          <div className="min-h-full flex flex-col items-center justify-center p-8 text-center space-y-12 py-12">
            
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 text-primary animate-in fade-in slide-in-from-top-4 duration-700 delay-150">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">yapido.click AI Central</span>
              </div>
              <div className="h-0.5 w-12 bg-primary/20 rounded-full mx-auto animate-in zoom-in duration-500 delay-300" />
            </div>

            <div className="relative group">
              <div className={cn("absolute inset-0 rounded-[40px] animate-ping opacity-30", content?.bg.replace('bg-', 'bg-'))} />
              <div className={cn("absolute -inset-4 rounded-[50px] opacity-20 blur-xl animate-pulse", content?.bg)} />
              <div className={cn(
                "relative w-36 h-36 sm:w-40 sm:h-40 rounded-[40px] flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-b-8 transition-all duration-700 hover:scale-105 hover:-translate-y-2",
                content?.bg, content?.color, "border-slate-200"
              )}>
                <Icon className="w-16 h-16 sm:w-20 sm:h-20 animate-in zoom-in duration-700 spin-in-12" />
                <Sparkles className="absolute -top-4 -right-4 w-10 h-10 text-yellow-400 animate-[spin_3s_linear_infinite]" />
              </div>
            </div>

            <div className="space-y-6 max-w-md animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300">
              <h2 className="text-4xl sm:text-6xl font-black italic uppercase tracking-tighter leading-[0.9] text-slate-900 drop-shadow-sm">
                {content?.title}
              </h2>
              <p className="text-sm sm:text-base font-bold text-slate-500 uppercase tracking-tight leading-relaxed px-4">
                {content?.desc}
              </p>
            </div>

            <div className="w-full max-w-sm space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
              <Button 
                onClick={() => handleAcknowledge(true)}
                className="w-full h-16 sm:h-20 rounded-[28px] sm:rounded-[32px] bg-primary hover:bg-primary/90 text-white font-black text-xs sm:text-base uppercase italic tracking-wider gap-2 sm:gap-3 shadow-[0_20px_50px_rgba(59,130,246,0.4)] border-b-[6px] sm:border-b-[8px] border-blue-800 active:border-b-0 active:translate-y-2 transition-all group relative overflow-hidden truncate px-4"
              >
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <span className="truncate">GESTIONAR AHORA</span> <ArrowRight className="w-4 h-4 sm:w-6 sm:h-6 shrink-0 group-hover:translate-x-3 transition-transform" />
              </Button>

              <button 
                onClick={() => handleAcknowledge(false)}
                className="text-[10px] sm:text-xs font-black text-slate-300 hover:text-slate-500 uppercase tracking-[0.3em] sm:tracking-[0.4em] transition-colors"
              >
                CERRAR AVISO
              </button>
            </div>
          </div>
        </main>

        <footer className="h-16 bg-slate-50 border-t flex items-center justify-center px-8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em]">Sincronía Real Activa</span>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
