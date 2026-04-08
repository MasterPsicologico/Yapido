
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

const SYNC_KEY = 'vitriniando_status_sync_v2'; // Versión actualizada del protocolo de sincronización

const STATUS_CONTENT: Record<string, any> = {
  ready_for_pickup: {
    title: "¡TIENDA ASIGNADA!",
    desc: "Un establecimiento ha aceptado tu solicitud. El equipo está entrando en fase de alistamiento.",
    icon: Sparkles,
    color: "text-amber-500",
    bg: "bg-amber-50"
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
    title: "MISIÓN FINALIZADA",
    desc: "El servicio ha concluido exitosamente. Gracias por confiar en Vitriniando.",
    icon: ShoppingBag,
    color: "text-slate-900",
    bg: "bg-slate-50"
  }
};

/**
 * VisualNotificationListener - El Especialista en Sincronía de Causa y Efecto.
 * Monitorea cambios de estado en tiempo real con filtrado de relevancia temporal.
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
      // 1. Capturar cambios válidos en esta actualización
      const validChanges = snapshot.docChanges()
        .filter(change => change.type === 'modified' || change.type === 'added')
        .map(change => ({ id: change.doc.id, ...change.doc.data() as any }))
        .filter(order => order.customerId === user.uid && STATUS_CONTENT[order.status]);

      if (validChanges.length === 0) return;

      // 2. ORDENAMIENTO POR RELEVANCIA: Solo nos interesa el evento más reciente
      const latestOrder = validChanges.sort((a, b) => {
        const tA = a.updatedAt?.toMillis?.() || 0;
        const tB = b.updatedAt?.toMillis?.() || 0;
        return tB - tA;
      })[0];

      // 3. PROTOCOLO DE CAUSA Y EFECTO
      const currentSync = JSON.parse(localStorage.getItem(SYNC_KEY) || '{}');
      const lastSeenStatus = currentSync[latestOrder.id];

      if (latestOrder.status !== lastSeenStatus) {
        const now = Date.now();
        const updatedAt = latestOrder.updatedAt?.toMillis?.() || now;
        
        // Solo notificar si el cambio ocurrió en los últimos 30 minutos (Evita spam de datos viejos)
        if (now - updatedAt < 1800000) {
          setActiveAlert(latestOrder);
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
      router.push(`/admin/orders#${alertId}`);
    }
  };

  const content = activeAlert ? STATUS_CONTENT[activeAlert.status] : null;
  const Icon = content?.icon || Zap;

  return (
    <Dialog open={!!activeAlert} onOpenChange={(v) => !v && handleAcknowledge(false)}>
      <DialogContent className="max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 rounded-none border-none shadow-none bg-white p-0 overflow-hidden flex flex-col z-[1000] animate-in slide-in-from-bottom duration-500 [&>button:last-child]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Estado del Pedido</DialogTitle>
          <DialogDescription>Actualización operativa en tiempo real.</DialogDescription>
        </DialogHeader>

        <main className="flex-1 overflow-y-auto no-scrollbar">
          <div className="min-h-full flex flex-col items-center justify-center p-8 text-center space-y-10 sm:space-y-12 py-12">
            
            <div className="space-y-4 shrink-0">
              <div className="flex items-center justify-center gap-3 text-primary">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em]">Vitriniando AI Central</span>
              </div>
              <div className="h-0.5 w-12 bg-primary/20 rounded-full mx-auto" />
            </div>

            <div className="relative shrink-0">
              <div className={cn("absolute inset-0 rounded-[40px] animate-ping opacity-20", content?.bg.replace('bg-', 'bg-'))} />
              <div className={cn(
                "relative w-32 h-32 rounded-[40px] flex items-center justify-center shadow-2xl border-b-8 transition-all duration-700",
                content?.bg, content?.color, "border-slate-200"
              )}>
                <Icon className="w-16 h-16 animate-in zoom-in duration-500" />
                <Sparkles className="absolute -top-3 -right-3 w-8 h-8 text-yellow-400 animate-pulse" />
              </div>
            </div>

            <div className="space-y-4 max-w-sm shrink-0">
              <h2 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter leading-[0.9] text-slate-900">
                {content?.title}
              </h2>
              <p className="text-sm sm:text-base font-bold text-slate-400 uppercase tracking-tight leading-relaxed px-4">
                {content?.desc}
              </p>
            </div>

            <div className="w-full max-w-xs space-y-6 shrink-0">
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
                CERRAR AVISO
              </button>
            </div>
          </div>
        </main>

        <footer className="h-16 bg-slate-50 border-t flex items-center justify-center px-8 shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em]">Sincronía Real Activa</span>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
