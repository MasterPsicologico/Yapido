
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { format, addHours, differenceInSeconds } from 'date-fns';
import { 
  X, Clock, Store as StoreIcon, MapPinned, MessageCircle, Phone, 
  Wallet, ShieldCheck, AlertTriangle, RotateCcw, CheckCircle2, Navigation,
  Settings2, ArrowUpCircle, Timer, Camera, Loader2, Map
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
  onUpdateStatus: (status: string, metadata?: any) => void;
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
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<any>(null);
  const [evidencePhoto, setEvidencePhoto] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isWithDriver = mission.status === 'delivered_to_driver' || mission.status === 'delivered';
  const isInUse = mission.status === 'delivered';
  
  const parseTimestamp = (ts: any) => {
    if (!ts) return null;
    if (typeof ts.toDate === 'function') return ts.toDate();
    if (ts.seconds) return new Date(ts.seconds * 1000);
    return new Date(ts);
  };

  const usageProgress = useMemo(() => {
    if (!isInUse || !mission.deliveredAt) return null;
    const deliveredAt = parseTimestamp(mission.deliveredAt);
    if (!deliveredAt) return null;
    
    const durationHours = Number(mission.requestHours || 5);
    const expiryTime = addHours(deliveredAt, durationHours);
    const totalSeconds = durationHours * 3600;
    const remainingSeconds = Math.max(0, differenceInSeconds(expiryTime, new Date()));
    
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    return {
      hours,
      minutes,
      seconds,
      isExpired: remainingSeconds <= 0,
      expiryLabel: format(expiryTime, 'HH:mm'),
      percentage: Math.min(100, (1 - (remainingSeconds / totalSeconds)) * 100)
    };
  }, [isInUse, mission.deliveredAt, mission.requestHours, currentTime]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsCameraOpen(true);
    } catch (e) {
      console.error("Error acceso camara", e);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setIsCameraOpen(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    
    setIsCompressing(true);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
    setEvidencePhoto(dataUrl);
    setIsCompressing(false);
    stopCamera();
  };

  const handleFinalDelivery = () => {
    if (!evidencePhoto) {
      startCamera();
      return;
    }
    onUpdateStatus('delivered', { deliveredAt: new Date(), deliveryEvidence: evidencePhoto });
  };

  const currentAddress = isWithDriver ? mission.customerAddress : mission.storeAddress;

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] animate-in slide-in-from-bottom duration-500 overflow-hidden relative z-[40]">
      {/* HEADER DE MISIÓN */}
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
          <div className={cn("w-2 h-2 rounded-full animate-pulse", isInUse ? "bg-amber-500" : isWithDriver ? "bg-purple-500" : "bg-green-500")} />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">
            {isInUse ? "EN USO" : isWithDriver ? "EN RUTA" : "BUSCANDO"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-black italic tracking-tighter">{format(currentTime, 'HH:mm')}</span>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Clock className="w-4 h-4 text-primary" /></div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto no-scrollbar bg-[#f8fafc]">
        <div className="px-6 py-8 pb-24 space-y-8 max-w-2xl mx-auto">
          
          {/* CRONÓMETRO REGRESIVO (CUANDO ESTÁ EN USO) */}
          {isInUse && usageProgress && (
            <section className="animate-in zoom-in duration-500">
              <Card className="border-none rounded-[40px] bg-slate-950 text-white p-8 shadow-2xl relative overflow-hidden ring-4 ring-amber-500/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] italic animate-pulse">
                    TIEMPO RESTANTE
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-7xl font-black italic tracking-tighter tabular-nums leading-none">
                      {usageProgress.hours}:{usageProgress.minutes < 10 ? `0${usageProgress.minutes}` : usageProgress.minutes}
                    </span>
                    <span className="text-sm font-black text-amber-500 uppercase tracking-widest">{usageProgress.seconds < 10 ? `0${usageProgress.seconds}` : usageProgress.seconds}s</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-amber-500 transition-all duration-1000 shadow-[0_0_15px_rgba(245,158,11,0.5)]" style={{ width: `${usageProgress.percentage}%` }} />
                  </div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                    Recoger a las <span className="text-white">{usageProgress.expiryLabel}</span>
                  </p>
                </div>
              </Card>
            </section>
          )}

          {/* TÍTULO COMPACTO Y ESTÉTICO */}
          <section className="text-center space-y-3">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.5em]">MISIÓN #{mission.id.slice(-6).toUpperCase()}</p>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
              ALQUILER DE LAVADORA <span className="text-primary">({mission.requestHours}H)</span>
            </h1>
          </section>

          {/* TARJETA DE DIRECCIÓN (LA MÁS IMPORTANTE) */}
          <section className="animate-in slide-in-from-right-4 duration-500">
            <Card className="border-none rounded-[36px] bg-white shadow-xl p-8 space-y-6 ring-1 ring-black/[0.03]">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 text-primary">
                    <MapPinned className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest italic">Destino de Entrega</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight uppercase italic tracking-tighter">
                    {currentAddress}
                  </h2>
                </div>
                <Button 
                  onClick={() => onOpenMaps(currentAddress)}
                  className="rounded-2xl h-14 w-14 bg-slate-900 text-white shadow-lg active:scale-90 transition-all group"
                >
                  <Navigation className="w-6 h-6 group-hover:animate-bounce" />
                </Button>
              </div>

              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border-2 border-slate-50 shadow-sm">
                    <AvatarImage src={customerProfile?.photoURL} />
                    <AvatarFallback className="bg-primary/10 text-primary font-black text-xs">{mission.customerName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase leading-none">Cliente</p>
                    <p className="text-sm font-black uppercase italic text-slate-700">{mission.customerName}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={`tel:${mission.customerPhone}`}>
                    <Button size="icon" variant="ghost" className="rounded-full h-10 w-10 bg-slate-50 text-slate-400 hover:text-primary"><Phone className="w-4 h-4" /></Button>
                  </a>
                  <Button onClick={() => setIsMissionChatOpen(true)} size="icon" variant="ghost" className="rounded-full h-10 w-10 bg-slate-50 text-slate-400 hover:text-primary"><MessageCircle className="w-4 h-4" /></Button>
                </div>
              </div>
            </Card>
          </section>

          {/* BOTONES DE ACCIÓN DINÁMICOS */}
          <section className="space-y-4">
            {!isWithDriver ? (
              <Button onClick={() => onUpdateStatus('delivered_to_driver')} className="w-full h-20 rounded-[32px] bg-primary text-white font-black text-xl uppercase italic gap-4 shadow-2xl active:scale-95 transition-all border-b-[8px] border-blue-800 active:border-b-0">
                <CheckCircle2 className="w-7 h-7" /> RECOGÍ EL EQUIPO
              </Button>
            ) : !isInUse ? (
              <div className="space-y-4">
                {evidencePhoto && (
                  <div className="relative aspect-video rounded-[36px] overflow-hidden border-4 border-white shadow-2xl">
                    <Image src={evidencePhoto} alt="Evidencia" fill className="object-cover" />
                    <button onClick={() => setEvidencePhoto(null)} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg"><X className="w-4 h-4" /></button>
                  </div>
                )}
                <Button onClick={handleFinalDelivery} className="w-full h-24 rounded-[36px] bg-green-500 text-white font-black text-2xl uppercase italic gap-4 shadow-2xl active:scale-95 transition-all border-b-[10px] border-green-700 active:border-b-0">
                  {evidencePhoto ? <><Timer className="w-8 h-8 animate-pulse" /> INICIAR TIEMPO</> : <><Navigation className="w-8 h-8" /> LLEGUÉ AL DESTINO</>}
                </Button>
              </div>
            ) : (
              <div className="bg-slate-900 rounded-[36px] p-8 text-center space-y-4 border-2 border-white/5 opacity-60">
                <ShieldCheck className="w-10 h-10 text-primary mx-auto" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Lavadora Entregada • Misión en Custodia</p>
              </div>
            )}
          </section>

          {/* BLOQUE TÉCNICO COMPACTO */}
          <div className="bg-white p-6 rounded-[36px] shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
              <Settings2 className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Ficha Técnica Logística</span>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-400 uppercase">Ubicación Piso</p>
                <div className="flex items-center gap-2">
                  <ArrowUpCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm font-black italic uppercase">Piso {mission.floor || '1'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-400 uppercase">Dificultad</p>
                <div className="flex items-center gap-2">
                  <AlertTriangle className={cn("w-4 h-4", mission.hasStairs ? "text-amber-500" : "text-slate-200")} />
                  <span className="text-sm font-black italic uppercase">{mission.hasStairs ? `${mission.stairCount} ESCALAS` : 'SIN ESCALAS'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-400 uppercase">Equipo</p>
                <span className="text-sm font-black italic uppercase text-slate-700">{mission.washerType || 'LAVADORA'}</span>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-400 uppercase">Cobro Sugerido</p>
                <span className="text-sm font-black italic text-primary">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(mission.totalPrice || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* OVERLAY DE CAMARA */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[500] bg-black flex flex-col p-6 animate-in fade-in">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-white font-black uppercase text-[10px] tracking-[0.3em] italic">Evidencia de Instalación</h4>
            <Button variant="ghost" size="icon" onClick={stopCamera} className="text-white"><X className="w-6 h-6" /></Button>
          </div>
          <div className="flex-1 relative rounded-[40px] overflow-hidden bg-slate-900 border-2 border-white/10 shadow-2xl">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          </div>
          <div className="py-10 flex justify-center">
            <Button onClick={capturePhoto} className="w-24 h-24 rounded-full bg-white text-black border-[10px] border-slate-300 active:scale-90 shadow-2xl flex items-center justify-center">
              {isCompressing ? <Loader2 className="w-10 h-10 animate-spin text-primary" /> : <Camera className="w-10 h-10" />}
            </Button>
          </div>
        </div>
      )}

      {/* DIÁLOGO DE CHAT */}
      <Dialog open={isMissionChatOpen} onOpenChange={setIsMissionChatOpen}>
        <DialogContent className="p-0 border-none bg-white max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 flex flex-col z-[300] [&>button:last-child]:hidden">
          <OrderChat orderId={mission.id} orderData={mission} onClose={() => setIsMissionChatOpen(false)} />
        </DialogContent>
      </Dialog>
      
      {/* DIÁLOGO DE LIBERACIÓN */}
      <Dialog open={isReleaseDialogOpen} onOpenChange={setIsReleaseDialogOpen}>
        <DialogContent className="rounded-[40px] border-none shadow-2xl p-8 sm:max-w-[450px] z-[400] bg-slate-900/95 backdrop-blur-2xl text-white outline-none [&>button:last-child]:hidden">
          <DialogHeader className="items-center text-center space-y-4 pt-4">
            <RotateCcw className="w-14 h-14 text-primary animate-spin-slow" />
            <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">Liberar Misión</DialogTitle>
            <DialogDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Protocolo de Deserción</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-3">
            {RELEASE_REASONS.map(r => (
              <button key={r.id} onClick={() => setSelectedReason(r)} className={cn("w-full p-4 rounded-2xl text-left text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-between", selectedReason?.id === r.id ? "bg-primary text-white border-primary shadow-xl" : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10")}>
                {r.label}{r.isAlarm && <Badge className="bg-red-500 text-white border-none text-[7px] px-2 h-4 ml-2">ALARMA</Badge>}
              </button>
            ))}
          </div>
          <DialogFooter><Button onClick={() => onRelease(selectedReason?.label)} disabled={!selectedReason} className={cn("w-full h-16 rounded-[24px] font-black uppercase text-sm tracking-widest shadow-lg active:scale-95 transition-all", selectedReason?.isAlarm ? "bg-red-600 hover:bg-red-700" : "bg-primary")}>{selectedReason?.isAlarm ? "ALERTAR Y LIBERAR" : "CONFIRMAR LIBERACIÓN"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
