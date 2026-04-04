
"use client";

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  X, Clock, Store as StoreIcon, MapPinned, MessageCircle, Phone, 
  Wallet, ShieldCheck, AlertTriangle, RotateCcw, CheckCircle2, Navigation,
  Settings2, ArrowUpCircle
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
  onUpdateStatus: (status: string) => void;
  onRelease: (reason: string) => void;
  onOpenMaps: (address: string) => void;
}

const RELEASE_REASONS = [
  { id: "pinchazo", label: "Me he pinchado", isAlarm: true },
  { id: "gasolina", label: "Sin gasolina", isAlarm: true },
  { id: "accidente", label: "Accidente en ruta", isAlarm: true },
  { id: "falla_tecnica", label: "Falla técnica vehículo", isAlarm: false },
  { id: "espera_excesiva", label: "Espera excesiva en tienda", isAlarm: false },
  { id: "otro", label: "Otro motivo", isAlarm: false }
];

export function ActiveMissionView({ mission, customerProfile, onUpdateStatus, onRelease, onOpenMaps }: ActiveMissionViewProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMissionChatOpen, setIsMissionChatOpen] = useState(false);
  const [isReleaseDialogOpen, setIsReleaseDialogOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<any>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isWithDriver = mission.status === 'delivered_to_driver' || mission.status === 'delivered';
  
  const parseTimestamp = (ts: any) => {
    if (!ts) return null;
    if (typeof ts.toDate === 'function') return ts.toDate();
    if (ts.seconds) return new Date(ts.seconds * 1000);
    return new Date(ts);
  };

  const pickupTime = useMemo(() => {
    const date = parseTimestamp(mission.acceptedAt) || parseTimestamp(mission.createdAt);
    if (!date) return '--:--';
    return format(date, 'HH:mm');
  }, [mission.acceptedAt, mission.createdAt]);

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] animate-in slide-in-from-bottom duration-500 overflow-hidden relative z-[40]">
      <div className="h-16 bg-slate-900 flex items-center justify-between px-4 text-white shrink-0 shadow-xl z-20">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsReleaseDialogOpen(true)} 
          className="h-10 w-10 text-white/60 hover:text-red-500 hover:bg-white/5 rounded-full transition-all"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full animate-pulse", isWithDriver ? "bg-purple-500" : "bg-green-500")} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isWithDriver ? "EN RUTA" : "BUSCANDO PAQUETE"}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-black italic">{format(currentTime, 'HH:mm')}</span>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Clock className="w-4 h-4 text-primary" /></div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto no-scrollbar">
        <div className="px-6 py-10 pb-20 space-y-8 max-w-2xl mx-auto">
          {/* IDENTIDAD DE MISIÓN */}
          <section className="text-center space-y-4">
            <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em]">MISIÓN ACTIVA #{mission.id.slice(-6).toUpperCase()}</p>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none text-slate-900">{mission.productName}</h1>
            <div className="flex flex-col items-center gap-2">
              <div className="bg-slate-900 text-white px-5 py-2 rounded-full"><StoreIcon className="w-4 h-4 text-primary inline mr-2" /><span className="text-xs font-black uppercase italic">{mission.storeName}</span></div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">{mission.storeAddress}</p>
            </div>
          </section>

          {/* DETALLES LOGÍSTICOS PRO */}
          <div className="bg-slate-950 text-white p-6 rounded-[40px] shadow-2xl space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Settings2 className="w-5 h-5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Especificaciones de Entrega</span>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Ubicación Piso</p>
                <div className="flex items-center gap-2">
                  <ArrowUpCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm font-black italic uppercase">Piso {mission.floor || '1'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Ascensor</p>
                <span className={cn("text-sm font-black italic uppercase", mission.hasElevator ? "text-green-400" : "text-red-400")}>{mission.hasElevator ? 'SÍ TIENE' : 'NO TIENE'}</span>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Dificultad</p>
                <span className={cn("text-sm font-black italic uppercase", mission.hasStairs ? "text-amber-400" : "text-slate-400")}>{mission.hasStairs ? `${mission.stairCount || 1} ESCALAS` : 'SIN ESCALAS'}</span>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Equipo</p>
                <span className="text-sm font-black italic uppercase text-slate-300">{mission.washerType || 'LAVADORA'}</span>
              </div>
            </div>
          </div>

          {!isWithDriver ? (
            <Button onClick={() => onUpdateStatus('delivered_to_driver')} className="w-full h-24 rounded-[32px] bg-primary text-white font-black text-2xl uppercase italic gap-4 shadow-2xl active:scale-95 transition-all">
              <CheckCircle2 className="w-8 h-8" /> RECOGÍ EL PEDIDO
            </Button>
          ) : (
            <Button onClick={() => onUpdateStatus('delivered')} className="w-full h-24 rounded-[32px] bg-green-500 text-white font-black text-2xl uppercase italic gap-4 shadow-2xl active:scale-95 transition-all">
              <Navigation className="w-8 h-8" /> ENTREGAR AL CLIENTE
            </Button>
          )}

          <Button variant="outline" onClick={() => onOpenMaps(isWithDriver ? mission.customerAddress : mission.storeAddress)} className="w-full h-16 rounded-[24px] border-slate-200 text-slate-600 font-black uppercase text-xs tracking-widest gap-3 shadow-inner">
            <MapPinned className="w-5 h-5 text-primary" /> VER EN EL MAPA
          </Button>

          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">Resumen de Cobro</h3>
            <div className="p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 shadow-inner"><MapPinned className="w-5 h-5 text-slate-400" /></div>
                <div><p className="text-[9px] font-black text-slate-400 uppercase">Punto de Entrega</p><p className="text-sm font-bold text-slate-700 leading-tight">{mission.customerAddress}</p></div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 shadow-inner"><Wallet className="w-5 h-5 text-slate-400" /></div>
                <div><p className="text-[9px] font-black text-slate-400 uppercase">Cobrar al Cliente</p><p className="text-2xl font-black text-slate-900 tracking-tighter">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(mission.totalPrice || 0)}</p></div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-dashed">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14 border-4 border-white shadow-xl"><AvatarImage src={customerProfile?.photoURL} /><AvatarFallback className="bg-primary text-white font-black text-xl">{mission.customerName?.charAt(0)}</AvatarFallback></Avatar>
              <div><p className="text-[9px] font-black text-slate-400 uppercase">Cliente VIP</p><p className="text-lg font-black uppercase italic leading-none">{mission.customerName}</p></div>
            </div>
            <div className="flex gap-2">
              <a href={`tel:${mission.customerPhone}`}><Button variant="ghost" size="icon" className="rounded-full bg-white text-slate-600 h-12 w-12 shadow-md hover:bg-slate-50"><Phone className="w-5 h-5" /></Button></a>
              <Button onClick={() => setIsMissionChatOpen(true)} className="rounded-full bg-slate-900 text-white h-12 w-12 shadow-xl hover:bg-black"><MessageCircle className="w-5 h-5 text-primary" /></Button>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER DE ESTADO */}
      <div className="shrink-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-green-500" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Protocolo Operativo Activo</span></div>
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
          <div className="absolute top-6 right-6 z-50">
            <button onClick={() => setIsReleaseDialogOpen(false)} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"><X className="w-6 h-6" /></button>
          </div>
          <DialogHeader className="items-center text-center space-y-4 pt-4">
            <div className="relative">
              <RotateCcw className="w-14 h-14 text-primary animate-spin-slow" />
              {selectedReason?.isAlarm && <AlertTriangle className="absolute -top-2 -right-2 w-6 h-6 text-red-500 animate-bounce" />}
            </div>
            <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">Liberar Pedido</DialogTitle>
            <DialogDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Protocolo de Deserción</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-3">
            <p className="text-xs text-slate-400 text-center px-4 mb-4">Selecciona el motivo. Si es una emergencia, el patrón será alertado inmediatamente.</p>
            {RELEASE_REASONS.map(r => (
              <button 
                key={r.id} 
                onClick={() => setSelectedReason(r)} 
                className={cn(
                  "w-full p-4 rounded-2xl text-left text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-between", 
                  selectedReason?.id === r.id ? "bg-primary text-white border-primary shadow-xl" : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
                )}
              >
                {r.label}
                {r.isAlarm && <Badge className="bg-red-500 text-white border-none text-[7px] px-2 h-4">ALARMA</Badge>}
              </button>
            ))}
          </div>
          <DialogFooter className="flex flex-col gap-4">
            <Button 
              onClick={() => onRelease(selectedReason?.label)} 
              disabled={!selectedReason} 
              className={cn(
                "w-full h-16 rounded-[24px] font-black uppercase text-sm tracking-widest shadow-lg active:scale-95 transition-all",
                selectedReason?.isAlarm ? "bg-red-600 hover:bg-red-700" : "bg-primary"
              )}
            >
              {selectedReason?.isAlarm ? "ALERTAR Y LIBERAR" : "CONFIRMAR LIBERACIÓN"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
