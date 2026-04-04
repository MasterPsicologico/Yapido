
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { format, addHours, differenceInMinutes, differenceInSeconds } from 'date-fns';
import { 
  X, Clock, Store as StoreIcon, MapPinned, MessageCircle, Phone, 
  Wallet, ShieldCheck, AlertTriangle, RotateCcw, CheckCircle2, Navigation,
  Settings2, ArrowUpCircle, Timer, Camera, Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { OrderChat } from '@/components/chat/OrderChat';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { compressImage } from '@/lib/image-compression';

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

  const useProgress = useMemo(() => {
    if (!isInUse || !mission.deliveredAt) return null;
    const deliveredAt = parseTimestamp(mission.deliveredAt);
    if (!deliveredAt) return null;
    
    const expiryTime = addHours(deliveredAt, Number(mission.requestHours || 5));
    const totalSeconds = Number(mission.requestHours || 5) * 3600;
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
    onUpdateStatus('delivered', { deliveryEvidence: evidencePhoto });
  };

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
          <div className={cn("w-2 h-2 rounded-full animate-pulse", isInUse ? "bg-amber-500" : isWithDriver ? "bg-purple-500" : "bg-green-500")} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            {isInUse ? "LAVADORA EN USO" : isWithDriver ? "EN RUTA" : "BUSCANDO PAQUETE"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-black italic">{format(currentTime, 'HH:mm')}</span>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Clock className="w-4 h-4 text-primary" /></div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto no-scrollbar">
        <div className="px-6 py-10 pb-20 space-y-8 max-w-2xl mx-auto">
          
          {isInUse && useProgress && (
            <section className="animate-in zoom-in duration-500">
              <Card className="border-none rounded-[48px] bg-slate-900 text-white p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                  <Badge className="bg-amber-500 text-white border-none font-black text-[8px] uppercase px-4 h-6 tracking-widest italic animate-pulse">
                    TIEMPO RESTANTE
                  </Badge>
                  <div className="flex items-baseline gap-2">
                    <span className="text-7xl font-black italic tracking-tighter tabular-nums">
                      {useProgress.hours}:{useProgress.minutes < 10 ? `0${useProgress.minutes}` : useProgress.minutes}
                    </span>
                    <span className="text-xs font-black text-amber-500 uppercase tracking-widest">{useProgress.seconds < 10 ? `0${useProgress.seconds}` : useProgress.seconds}s</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${useProgress.percentage}%` }} />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    Recoger a las <span className="text-white">{useProgress.expiryLabel}</span>
                  </p>
                </div>
              </Card>
            </section>
          )}

          <section className="text-center space-y-4">
            <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em]">MISIÓN ACTIVA #{mission.id.slice(-6).toUpperCase()}</p>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none text-slate-900">{mission.productName}</h1>
            <div className="flex flex-col items-center gap-2">
              <div className="bg-slate-900 text-white px-5 py-2 rounded-full"><StoreIcon className="w-4 h-4 text-primary inline mr-2" /><span className="text-xs font-black uppercase italic">{mission.storeName}</span></div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">{mission.storeAddress}</p>
            </div>
          </section>

          {!isWithDriver ? (
            <Button onClick={() => onUpdateStatus('delivered_to_driver')} className="w-full h-24 rounded-[32px] bg-primary text-white font-black text-2xl uppercase italic gap-4 shadow-2xl active:scale-95 transition-all">
              <CheckCircle2 className="w-8 h-8" /> RECOGÍ EL PEDIDO
            </Button>
          ) : !isInUse ? (
            <div className="space-y-4">
              {evidencePhoto ? (
                <div className="relative aspect-video rounded-[32px] overflow-hidden border-4 border-white shadow-2xl group">
                  <Image src={evidencePhoto} alt="Evidencia" fill className="object-cover" />
                  <button onClick={() => setEvidencePhoto(null)} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg"><X className="w-4 h-4" /></button>
                </div>
              ) : null}
              <Button onClick={handleFinalDelivery} className="w-full h-24 rounded-[32px] bg-green-500 text-white font-black text-2xl uppercase italic gap-4 shadow-2xl active:scale-95 transition-all">
                {evidencePhoto ? <><CheckCircle2 className="w-8 h-8" /> FINALIZAR ENTREGA</> : <><Navigation className="w-8 h-8" /> LLEGUÉ AL DESTINO</>}
              </Button>
            </div>
          ) : (
            <Button className="w-full h-20 rounded-[32px] bg-slate-900 text-white font-black text-lg uppercase italic gap-4 shadow-xl border-2 border-white/5 opacity-50 cursor-not-allowed">
              <Timer className="w-6 h-6" /> AGUARDANDO RECOGIDA
            </Button>
          )}

          <Button variant="outline" onClick={() => onOpenMaps(isInUse || isWithDriver ? mission.customerAddress : mission.storeAddress)} className="w-full h-16 rounded-[24px] border-slate-200 text-slate-600 font-black uppercase text-xs tracking-widest gap-3 shadow-inner">
            <MapPinned className="w-5 h-5 text-primary" /> {isInUse ? "VER UBICACIÓN ACTUAL" : "VER EN EL MAPA"}
          </Button>

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
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Equipo</p>
                <span className="text-sm font-black italic uppercase text-slate-300">{mission.washerType || 'LAVADORA'}</span>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Dificultad</p>
                <span className={cn("text-sm font-black italic uppercase", mission.hasStairs ? "text-amber-400" : "text-slate-400")}>{mission.hasStairs ? `${mission.stairCount || 1} ESCALAS` : 'SIN ESCALAS'}</span>
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Contrato</p>
                <span className="text-sm font-black italic uppercase text-primary">{mission.requestHours} HORAS</span>
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

      {/* OVERLAY DE CAMARA */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[500] bg-black flex flex-col p-6 animate-in fade-in">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-white font-black uppercase text-xs tracking-widest italic">Capturar Evidencia de Instalación</h4>
            <Button variant="ghost" size="icon" onClick={stopCamera} className="text-white"><X className="w-6 h-6" /></Button>
          </div>
          <div className="flex-1 relative rounded-[32px] overflow-hidden bg-slate-900 border-2 border-white/10 shadow-2xl">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          </div>
          <div className="py-10 flex justify-center">
            <Button onClick={capturePhoto} className="w-24 h-24 rounded-full bg-white text-black border-8 border-slate-300 active:scale-90 shadow-2xl flex items-center justify-center">
              {isCompressing ? <Loader2 className="w-10 h-10 animate-spin" /> : <Camera className="w-10 h-10" />}
            </Button>
          </div>
        </div>
      )}

      <div className="shrink-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-green-500" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Protocolo Operativo Activo</span></div>
          <div className="h-1 w-20 bg-slate-100 rounded-full overflow-hidden relative"><div className="absolute inset-0 bg-green-500 animate-progress-loading" /></div>
        </div>
      </div>

      <Dialog open={isMissionChatOpen} onOpenChange={setIsMissionChatOpen}>
        <DialogContent className="p-0 border-none bg-white max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 flex flex-col z-[300] [&>button:last-child]:hidden">
          <OrderChat orderId={mission.id} orderData={mission} onClose={() => setIsMissionChatOpen(false)} />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isReleaseDialogOpen} onOpenChange={setIsReleaseDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto no-scrollbar rounded-[40px] border-none shadow-2xl p-8 sm:max-w-[450px] z-[400] bg-slate-900/95 backdrop-blur-2xl text-white outline-none [&>button:last-child]:hidden">
          <div className="absolute top-6 right-6 z-50">
            <button onClick={() => setIsReleaseDialogOpen(false)} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"><X className="w-6 h-6" /></button>
          </div>
          <DialogHeader className="items-center text-center space-y-4 pt-4">
            <div className="relative"><RotateCcw className="w-14 h-14 text-primary animate-spin-slow" />{selectedReason?.isAlarm && <AlertTriangle className="absolute -top-2 -right-2 w-6 h-6 text-red-500 animate-bounce" />}</div>
            <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">Liberar Pedido</DialogTitle>
            <DialogDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">Protocolo de Deserción</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-3">
            {RELEASE_REASONS.map(r => (
              <button key={r.id} onClick={() => setSelectedReason(r)} className={cn("w-full p-4 rounded-2xl text-left text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-between", selectedReason?.id === r.id ? "bg-primary text-white border-primary shadow-xl" : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10")}>
                {r.label}{r.isAlarm && <Badge className="bg-red-500 text-white border-none text-[7px] px-2 h-4">ALARMA</Badge>}
              </button>
            ))}
          </div>
          <DialogFooter><Button onClick={() => onRelease(selectedReason?.label)} disabled={!selectedReason} className={cn("w-full h-16 rounded-[24px] font-black uppercase text-sm tracking-widest shadow-lg active:scale-95 transition-all", selectedReason?.isAlarm ? "bg-red-600 hover:bg-red-700" : "bg-primary")}>{selectedReason?.isAlarm ? "ALERTAR Y LIBERAR" : "CONFIRMAR LIBERACIÓN"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
