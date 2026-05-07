
'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  ShieldCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

// Constante de audio
const ALERT_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

const SYNC_KEY = 'vitriniando_status_sync_v2';

// ── NOTIFICACIONES DE FASE DE ENTREGA (sin deliveredAt) ──
const DELIVERY_STATUS_CONTENT: Record<string, any> = {
  ready_for_pickup: {
    title: "¡TIENDA ASIGNADA!",
    desc: "Un establecimiento ha aceptado tu solicitud. El equipo está entrando en fase de alistamiento.",
    icon: Sparkles,
    color: "text-amber-500",
    bg: "bg-amber-50"
  },
  picking_up: {
    title: "¡PEDIDO ACEPTADO!",
    desc: "El repartidor ha aceptado la misión y va en camino a recoger tu equipo en la tienda.",
    icon: Truck,
    color: "text-primary",
    bg: "bg-blue-50"
  },
  shipped: {
    title: "¡PEDIDO EN RUTA!",
    desc: "El repartidor ha iniciado el trayecto. Sigue su recorrido en tiempo real hasta tu ubicación.",
    icon: Truck,
    color: "text-primary",
    bg: "bg-blue-50"
  },
  at_destination: {
    title: "¡LLEGAMOS AL SITIO!",
    desc: "El equipo está en la puerta de tu dirección. Por favor, prepara el acceso para la instalación.",
    icon: MapPin,
    color: "text-green-600",
    bg: "bg-green-50"
  },
  delivered: {
    title: "¡EQUIPO INSTALADO!",
    desc: "La entrega se ha concretado. Tu tiempo de uso ha comenzado a correr oficialmente.",
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-50"
  },
  completed: {
    title: "CONTRATO CERRADO",
    desc: "El servicio ha concluido exitosamente. Gracias por confiar en Vitriniando.",
    icon: ShoppingBag,
    color: "text-slate-900",
    bg: "bg-slate-50"
  }
};

// ── NOTIFICACIONES DE FASE DE RECOGIDA (cuando deliveredAt ya existe) ──
const PICKUP_STATUS_CONTENT: Record<string, any> = {
  picking_up: {
    title: "¡RECOGIDA EN CAMINO!",
    desc: "El repartidor va en camino a recoger tu lavadora. Por favor, prepárala y desconéctala para la devolución.",
    icon: Truck,
    color: "text-orange-500",
    bg: "bg-orange-50"
  },
  at_pickup: {
    title: "¡REPARTIDOR EN TU PUERTA!",
    desc: "El repartidor ha llegado a tu ubicación para recoger la lavadora. Por favor, abre la puerta.",
    icon: MapPin,
    color: "text-orange-600",
    bg: "bg-orange-50"
  },
  completed: {
    title: "¡LAVADORA RECOGIDA!",
    desc: "La lavadora ha sido recogida exitosamente. Tu servicio ha finalizado. ¡Gracias por usar Vitriniando!",
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-50"
  }
};

/**
 * Selecciona el contenido de notificación correcto según el contexto de la orden.
 * Si la orden ya tiene `deliveredAt`, está en fase de recogida → mensajes de pickup.
 * Si no tiene `deliveredAt`, está en fase de entrega → mensajes de delivery.
 */
function getStatusContent(order: any): any | null {
  const isPickupPhase = !!order.deliveredAt;
  
  if (isPickupPhase && PICKUP_STATUS_CONTENT[order.status]) {
    return PICKUP_STATUS_CONTENT[order.status];
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
        // Incluimos tanto al cliente como al dueño de la tienda para que ambos vean las alertas
        .filter(order => (order.customerId === user.uid || order.storeOwnerId === user.uid) && getStatusContent(order))
        .filter(order => order.status !== currentSync[order.id]) // Filtramos los que ya hemos visto
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
    });

    return () => unsubscribe();
  }, [firestore, user?.uid]);

  const handleAcknowledge = (goToOrder: boolean) => {
    if (!activeAlert) return;

    const currentSync = JSON.parse(localStorage.getItem(SYNC_KEY) || '{}');
    const nextSync = { ...currentSync, [activeAlert.id]: activeAlert.status };
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
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Vitriniando AI Central</span>
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
