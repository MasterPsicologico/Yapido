
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
        <Button variant="ghost" size="icon" onClick={() => setIsReleaseDialogOpen(true)} className="h-10 w-10 text-white/40 hover:text-red-400 rounded-full"><X className="w-5 h-5" /></Button>
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
        <DialogContent className="p-0 border-none bg-white max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 flex flex-col z-[300]">
          <DialogHeader className="sr-only"><DialogTitle>Chat de Misión</DialogTitle><DialogDescription>Canal de comunicación seguro.</DialogDescription></DialogHeader>
          <OrderChat orderId={mission.id} orderData={mission} onClose={() => setIsMissionChatOpen(false)} />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isReleaseDialogOpen} onOpenChange={setIsReleaseDialogOpen}>
        <DialogContent className="rounded-[40px] border-none shadow-2xl p-8 sm:max-w-[450px] z-[400]">
          <DialogHeader className="items-center text-center">
            <RotateCcw className={cn("w-12 h-12 mb-4", hasProducts ? "text-red-500" : "text-orange-500")} />
            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Liberar Pedido</DialogTitle>
            <DialogDescription className="text-slate-400 font-medium">Selecciona el motivo de deserción.</DialogDescription>
          </DialogHeader>
          
          {hasProducts && (
            <div className="bg-red-50 border-2 border-red-100 p-5 rounded-3xl space-y-2 animate-pulse mb-4">
              <div className="flex items-center gap-2 text-red-600 font-black text-[10px] uppercase"><AlertTriangle className="w-4 h-4" /> AVISO DE DEUDA</div>
              <p className="text-[10px] font-bold text-red-700 uppercase">Se aplicará deuda por: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(mission.totalPrice || 0)}</p>
            </div>
          )}

          <div className="py-6 space-y-2">
            {RELEASE_REASONS.map(r => (
              <button key={r} onClick={() => setSelectedReason(r)} className={cn("w-full p-4 rounded-2xl text-left text-[10px] font-black uppercase tracking-widest border-2 transition-all", selectedReason === r ? "bg-slate-900 text-white border-slate-900 shadow-lg" : "bg-slate-50 text-slate-400 border-transparent hover:border-slate-200")}>{r}</button>
            ))}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsReleaseDialogOpen(false)} className="font-black uppercase text-[10px]">VOLVER</Button>
            <Button onClick={() => onRelease(selectedReason)} disabled={!selectedReason} className={cn("flex-1 h-14 rounded-full font-black uppercase text-xs tracking-widest shadow-xl", hasProducts ? "bg-red-600" : "bg-slate-900 text-white")}>CONFIRMAR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
