
"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  X, Clock, Store as StoreIcon, MapPinned, MessageCircle, Phone, 
  Wallet, ShieldCheck, AlertTriangle, RotateCcw 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { OrderChat } from '@/components/chat/OrderChat';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ActiveMissionViewProps {
  mission: any;
  customerProfile: any;
  onRelease: (reason: string) => void;
  onOpenMaps: (address: string) => void;
}

const RELEASE_REASONS = [
  "Falla técnica en el vehículo",
  "Emergencia personal",
  "Dirección inalcanzable",
  "Espera excesiva en tienda",
  "Otro motivo"
];

export function ActiveMissionView({ mission, customerProfile, onRelease, onOpenMaps }: ActiveMissionViewProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMissionChatOpen, setIsMissionChatOpen] = useState(false);
  const [isReleaseDialogOpen, setIsReleaseDialogOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hasProducts = mission.status === 'delivered_to_driver';

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] animate-in slide-in-from-bottom duration-500 overflow-hidden relative z-[40]">
      {/* HEADER DE MISIÓN */}
      <div className="h-16 bg-slate-900 flex items-center justify-between px-4 text-white shrink-0 shadow-xl z-20">
        <Button variant="ghost" size="icon" onClick={() => setIsReleaseDialogOpen(true)} className="h-10 w-10 text-white/40 hover:text-red-400 rounded-full">
          <RotateCcw className="w-5 h-5" />
        </Button>
        <Badge className={cn("text-white border-none font-black px-4 h-8 uppercase text-[10px] tracking-widest", hasProducts ? "bg-purple-600" : "bg-green-500")}>
          {hasProducts ? "CON PRODUCTO" : "EN TIENDA"}
        </Badge>
        <div className="flex items-center gap-3">
          <span className="text-sm font-black italic">{format(currentTime, 'HH:mm')}</span>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Clock className="w-4 h-4 text-primary" /></div>
        </div>
      </div>

      {/* CONTENIDO SCROLLABLE */}
      <main className="flex-1 overflow-y-auto no-scrollbar">
        <div className="px-6 py-10 pb-20 space-y-8 max-w-2xl mx-auto">
          <section className="text-center space-y-4">
            <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em]">MISIÓN ACTIVA #{mission.id.slice(-6).toUpperCase()}</p>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none text-slate-900">{mission.productName}</h1>
            <div className="flex flex-col items-center gap-2">
              <div className="bg-slate-900 text-white px-5 py-2 rounded-full"><StoreIcon className="w-4 h-4 text-primary inline mr-2" /><span className="text-xs font-black uppercase italic">{mission.storeName}</span></div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">{mission.storeAddress}</p>
            </div>
          </section>

          <Button onClick={() => onOpenMaps(mission.storeAddress)} className="w-full h-20 rounded-[28px] bg-primary text-white font-black text-xl uppercase italic gap-4 shadow-2xl active:scale-95 transition-all">
            <MapPinned className="w-7 h-7" /> RECOGER PEDIDO
          </Button>

          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">Lista de Artículos</h3>
            {mission.items?.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-3xl bg-white border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden border"><Image src={item.imageUrl || 'https://picsum.photos/seed/p/200'} alt={item.name} fill className="object-cover" /></div>
                  <div><p className="text-sm font-black uppercase italic leading-none">{item.name}</p><p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Cant: x{item.quantity}</p></div>
                </div>
                <Badge className="bg-slate-50 text-slate-400 border-none">#{idx+1}</Badge>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-[32px] bg-slate-900 text-white shadow-xl">
              <p className="text-[8px] font-black text-slate-400 uppercase">A cobrar</p>
              <p className="text-xl font-black italic">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(mission.totalPrice || 0)}</p>
            </div>
            <div className="p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm">
              <p className="text-[8px] font-black text-slate-400 uppercase">Pago</p>
              <div className="flex items-center gap-2"><Wallet className="w-4 h-4 text-green-500" /><p className="text-xs font-black uppercase italic">{mission.paymentMethod?.toUpperCase()}</p></div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-dashed">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14 border-4 border-white shadow-xl"><AvatarImage src={customerProfile?.photoURL} /><AvatarFallback className="bg-primary text-white font-black text-xl">{mission.customerName?.charAt(0)}</AvatarFallback></Avatar>
              <div><p className="text-[9px] font-black text-slate-400 uppercase">Cliente</p><p className="text-lg font-black uppercase italic leading-none">{mission.customerName}</p></div>
            </div>
            <div className="flex gap-2">
              <a href={`tel:${mission.customerPhone}`}><Button variant="ghost" size="icon" className="rounded-full bg-white text-slate-600 h-12 w-12 shadow-md"><Phone className="w-5 h-5" /></Button></a>
              <Button onClick={() => setIsMissionChatOpen(true)} className="rounded-full bg-slate-900 text-white h-12 w-12 shadow-xl"><MessageCircle className="w-5 h-5 text-primary" /></Button>
            </div>
          </div>

          <section className="pt-10 border-t space-y-4">
            <div className="flex items-center gap-3 text-orange-500">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-black uppercase tracking-widest italic">¿Problemas Críticos?</h3>
            </div>
            <Button onClick={() => setIsReleaseDialogOpen(true)} variant="outline" className="w-full h-14 rounded-2xl border-red-100 text-red-500 font-black uppercase text-[10px] tracking-widest gap-2 hover:bg-red-50">
              <RotateCcw className="w-4 h-4" /> LIBERAR PEDIDO AHORA
            </Button>
          </section>
        </div>
      </main>

      <div className="shrink-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-green-500" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Monitoreo Satelital Activo</span></div>
          <div className="h-1 w-20 bg-slate-100 rounded-full overflow-hidden relative"><div className="absolute inset-0 bg-green-500 animate-progress-loading" /></div>
        </div>
      </div>

      <Dialog open={isMissionChatOpen} onOpenChange={setIsMissionChatOpen}>
        <DialogContent className="p-0 border-none bg-white max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 flex flex-col z-[300] [&>button:last-child]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Chat de Misión</DialogTitle>
            <DialogDescription>Canal de comunicación seguro.</DialogDescription>
          </DialogHeader>
          <OrderChat orderId={mission.id} orderData={mission} onClose={() => setIsMissionChatOpen(false)} />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isReleaseDialogOpen} onOpenChange={setIsReleaseDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto no-scrollbar rounded-[40px] border-none shadow-2xl p-8 sm:max-w-[450px] z-[400] bg-slate-900/95 backdrop-blur-2xl text-white outline-none [&>button:last-child]:hidden">
          {/* BOTÓN X SUPERIOR DERECHA (EL ÚNICO QUE SE MANTIENE) */}
          <div className="absolute top-6 right-6 z-50">
            <button 
              onClick={() => setIsReleaseDialogOpen(false)} 
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <DialogHeader className="items-center text-center space-y-4 pt-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <RotateCcw className={cn("relative w-14 h-14", hasProducts ? "text-red-500" : "text-primary")} />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">Liberar Pedido</DialogTitle>
              <DialogDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Protocolo de Deserción Logística</DialogDescription>
            </div>
          </DialogHeader>
          
          {hasProducts && (
            <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-3xl space-y-2 animate-in fade-in zoom-in duration-500 my-4">
              <div className="flex items-center gap-2 text-red-500 font-black text-[10px] uppercase tracking-widest">
                <AlertTriangle className="w-4 h-4" /> AVISO DE PENALIZACIÓN
              </div>
              <p className="text-[11px] font-bold text-red-400/80 uppercase leading-relaxed text-left">
                Tienes productos en posesión. Se aplicará una deuda de {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(mission.totalPrice || 0)} a tu balance técnico.
              </p>
            </div>
          )}

          <div className="py-6 space-y-3">
            {RELEASE_REASONS.map((r, idx) => (
              <button 
                key={r} 
                onClick={() => setSelectedReason(r)} 
                className={cn(
                  "w-full p-4 rounded-2xl text-left text-[10px] font-black uppercase tracking-widest border transition-all duration-300 animate-in slide-in-from-left-4",
                  selectedReason === r 
                    ? "bg-primary text-white border-primary shadow-[0_0_20px_rgba(59,130,246,0.4)]" 
                    : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:border-white/20"
                )}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {r}
              </button>
            ))}
          </div>

          <DialogFooter className="flex flex-col sm:flex-col gap-4">
            <Button 
              onClick={() => onRelease(selectedReason)} 
              disabled={!selectedReason} 
              className={cn(
                "w-full h-16 rounded-[24px] font-black uppercase text-sm tracking-widest transition-all shadow-2xl",
                hasProducts 
                  ? "bg-red-600 hover:bg-red-700 text-white shadow-red-900/20" 
                  : "bg-primary hover:bg-primary/90 text-white shadow-primary/20",
                !selectedReason && "opacity-20"
              )}
            >
              CONFIRMAR LIBERACIÓN
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setIsReleaseDialogOpen(false)} 
              className="text-slate-500 hover:text-white font-black uppercase text-[10px] tracking-[0.3em] h-10"
            >
              CANCELAR Y VOLVER
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
