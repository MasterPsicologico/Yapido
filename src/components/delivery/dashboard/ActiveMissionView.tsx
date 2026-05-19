
"use client";

import { useState, useEffect, useMemo } from 'react';
import { format, addHours, differenceInSeconds } from 'date-fns';
import { X, Loader2, DollarSign, CheckCircle2, Wallet, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { OrderChat } from '@/components/chat/OrderChat';
import { ReleaseMissionDialog } from './release-mission';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { nequiClient } from '@/lib/nequi/nequi-client';

// COMPONENTES ATÓMICOS
import { MissionHeader } from './active-mission/components/header/MissionHeader';
import { MissionDeliveryCard } from './active-mission/components/delivery/MissionDeliveryCard';
import { MissionUsageCountdown } from './active-mission/components/timer/MissionUsageCountdown';
import { MissionActionOrchestrator } from './active-mission/components/actions/MissionActionOrchestrator';
import { MissionStatusFooter } from './active-mission/components/footer/MissionStatusFooter';

interface ActiveMissionViewProps {
  mission: any;
  customerProfile: any;
  onUpdateStatus: (status: string, metadata?: any) => void;
  onRelease: (reason: string) => void;
  onOpenMaps: (address: string) => void;
  onOpenLiveMap?: () => void;
}

export function ActiveMissionView({ mission, customerProfile, onUpdateStatus, onRelease, onOpenMaps, onOpenLiveMap }: ActiveMissionViewProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMissionChatOpen, setIsMissionChatOpen] = useState(false);
  const [isReleaseDialogOpen, setIsReleaseDialogOpen] = useState(false);
  const [isConfirmPaymentOpen, setIsConfirmPaymentOpen] = useState(false);
  const [isProcessingNequi, setIsProcessingNequi] = useState(false);
  const [evidencePhoto, setEvidencePhoto] = useState<string | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCapturePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a local URL for the photo. In a real app, we would upload to Storage.
      const url = URL.createObjectURL(file);
      setEvidencePhoto(url);
    }
  };

  const handleNequiPayment = async () => {
    setIsProcessingNequi(true);
    try {
      const response = await nequiClient.requestPayment({
        phoneNumber: customerProfile?.phoneNumber || '0000000000',
        value: mission.totalPrice || 0,
        reference: mission.id
      });
      
      // En producción, aquí se implementaría WebSockets o un polling al backend.
      // Como estamos simulando la API, hacemos un polling falso para consultar el estado.
      
      const pollInterval = setInterval(async () => {
        const status = await nequiClient.checkPaymentStatus(response.transactionId);
        
        if (status === 'APPROVED') {
          clearInterval(pollInterval);
          setIsProcessingNequi(false);
          onUpdateStatus('completed', { paymentMethod: 'nequi', nequiTransactionId: response.transactionId });
          setIsConfirmPaymentOpen(false);
          toast({ title: "Pago Exitoso", description: "Nequi ha confirmado el pago.", className: "bg-green-600 text-white" });
        } else if (status === 'REJECTED' || status === 'FAILED') {
          clearInterval(pollInterval);
          setIsProcessingNequi(false);
          toast({ title: "Pago Rechazado", description: "El cliente rechazó el pago o hubo un error en Nequi.", variant: "destructive" });
        }
        // Si sigue 'PENDING', continúa el polling
      }, 3000);

      // Timeout de seguridad por si el cliente se queda dormido
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isProcessingNequi) { // Si todavía está procesando
          setIsProcessingNequi(false);
          toast({ title: "Tiempo Excedido", description: "El pago Nequi no fue confirmado a tiempo.", variant: "destructive" });
        }
      }, 45000); // 45 segundos

    } catch (error) {
      console.error(error);
      setIsProcessingNequi(false);
      toast({ title: "Error Nequi", description: "No se pudo conectar con Nequi.", variant: "destructive" });
    }
  };

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
    
    // LÓGICA DE TIEMPO INFINITO (PERMITE NEGATIVOS)
    const diffInSeconds = differenceInSeconds(expiryTime, new Date());
    const isExpired = diffInSeconds < 0;
    const absSeconds = Math.abs(diffInSeconds);
    
    return {
      hours: Math.floor(absSeconds / 3600),
      minutes: Math.floor((absSeconds % 3600) / 60),
      seconds: absSeconds % 60,
      isExpired,
      expiryLabel: format(expiryTime, 'HH:mm'),
      percentage: Math.min(100, (1 - (diffInSeconds / totalSeconds)) * 100),
      dropOffTime: format(deliveredAt, 'HH:mm'),
      originalExpiry: format(expiryTime, 'HH:mm')
    };
  }, [isInUse, mission.deliveredAt, mission.requestHours, currentTime]);

  const handleAdjustHours = (extra: number) => {
    if (!firestore || !mission.id) return;
    const orderRef = doc(firestore, 'orders', mission.id);
    const extraCharge = extra * 3500; 

    if (extra < 0 && (mission.requestHours || 5) <= 1) {
      toast({ title: "Acción Denegada", description: "Mínimo 1 hora de servicio.", variant: "destructive" });
      return;
    }

    updateDocumentNonBlocking(orderRef, {
      requestHours: increment(extra),
      totalPrice: increment(extraCharge),
      updatedAt: serverTimestamp()
    });

    toast({ title: `${extra > 0 ? '+' : ''}${extra} Hora ${extra > 0 ? 'añadida' : 'removida'}` });
  };

  const handleInitialInstallClick = () => {
    setIsConfirmPaymentOpen(true);
  };

  const handleFinalConfirmPayment = () => {
    onUpdateStatus('completed');
    setIsConfirmPaymentOpen(false);
    toast({ title: "Recogida Finalizada", description: "Misión completada exitosamente.", className: "bg-green-600 text-white" });
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] animate-in slide-in-from-bottom duration-500 overflow-hidden relative z-[40]">
      <MissionHeader 
        onReleaseOpen={() => setIsReleaseDialogOpen(true)}
        onOpenLiveMap={onOpenLiveMap}
        status={mission.status}
        isWithDriver={true}
        isInUse={isInUse}
        isAtDestination={mission.status === 'at_destination'}
        currentTime={currentTime}
      />

      <main className="flex-1 overflow-y-auto no-scrollbar bg-[#f8fafc]">
        <div className="px-6 py-8 pb-24 space-y-8 max-w-2xl mx-auto">
          
          {isInUse && usageProgress && (
            <MissionUsageCountdown 
              progress={usageProgress} 
              onAddHours={() => handleAdjustHours(1)} 
              onRemoveHour={() => handleAdjustHours(-1)}
            />
          )}

          <MissionDeliveryCard 
            customerAddress={mission.customerAddress}
            customerSector={mission.customerSector}
            customerName={mission.customerName}
            customerPhone={mission.customerPhone}
            customerPhoto={customerProfile?.photoURL}
            totalPrice={mission.totalPrice || 0}
            paymentMethod={mission.paymentMethod || 'cash'}
            onOpenMaps={() => onOpenMaps(mission.customerAddress)}
            onOpenChat={() => setIsMissionChatOpen(true)}
            missionId={mission.id}
            requestHours={mission.requestHours}
            floor={mission.floor}
            hasStairs={mission.hasStairs}
            stairCount={mission.stairCount}
            washerType={mission.washerType}
          />

          <MissionActionOrchestrator 
            status={mission.status}
            isAtDestination={mission.status === 'at_destination'}
            isInUse={isInUse}
            isExpired={usageProgress?.isExpired}
            washerId={mission.washerId}
            missionId={mission.id}
            storeId={mission.storeId}
            onUpdateStatus={onUpdateStatus}
            onStartCamera={() => document.getElementById('camera-capture')?.click()}
            evidencePhoto={evidencePhoto}
          />
          
          <input 
            type="file" 
            id="camera-capture" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            onChange={handleCapturePhoto} 
          />
        </div>
      </main>

      {/* DIÁLOGO DE CONFIRMACIÓN DE COBRO MAESTRO */}
      <Dialog open={isConfirmPaymentOpen} onOpenChange={setIsConfirmPaymentOpen}>
        <DialogContent className="w-[calc(100vw-32px)] sm:w-full max-w-[400px] rounded-[32px] border-none shadow-2xl p-6 md:p-8 bg-white z-[500] flex flex-col gap-0 mx-auto outline-none">
          <DialogHeader className="items-center text-center space-y-4 pt-2">
            <div className="w-16 h-16 bg-green-50 rounded-[24px] flex items-center justify-center text-green-600 shadow-inner">
              <DollarSign className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <DialogTitle className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                Confirmar Cobro
              </DialogTitle>
              <DialogDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                Auditoría de Liquidación Inmediata
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="py-8 text-center space-y-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest px-4 leading-relaxed mx-auto max-w-[280px]">
              ¿Has recibido el pago total del servicio?
            </p>
            <div className="bg-slate-900 p-6 md:p-8 rounded-[28px] shadow-2xl relative overflow-hidden w-full mx-auto">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 relative z-10">VALOR A RECAUDAR</p>
              <h4 className="text-4xl font-black italic tracking-tighter text-white relative z-10">
                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(mission.totalPrice || 0)}
              </h4>
              <div className="flex justify-center gap-2 mt-4 relative z-10">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                  {mission.paymentMethod === 'cash' ? <Wallet className="w-3.5 h-3.5 text-yellow-500" /> : <CreditCard className="w-3.5 h-3.5 text-blue-400" />}
                  <span className="text-[9px] font-black uppercase text-white/80 tracking-widest">
                    {mission.paymentMethod === 'cash' ? 'EFECTIVO' : 'DIGITAL'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-3 sm:flex-col pb-2 w-full relative">
            {isProcessingNequi ? (
              <div className="flex flex-col items-center justify-center py-6 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 animate-pulse text-center">
                  Esperando confirmación<br/>del cliente en Nequi...
                </p>
              </div>
            ) : (
              <>
                {mission.paymentMethod === 'nequi' ? (
                  <Button 
                    onClick={handleNequiPayment}
                    className="w-full h-14 rounded-[20px] bg-[#2E0F59] hover:bg-[#1f0a3d] text-white font-black text-base md:text-lg uppercase italic tracking-widest gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95"
                  >
                    <img src="https://firebasestorage.googleapis.com/v0/b/pideya-b5a8b.appspot.com/o/nequi-logo.png?alt=media" alt="Nequi" className="h-6 w-auto" onError={(e) => e.currentTarget.style.display = 'none'} />
                    ENVIAR COBRO NEQUI
                  </Button>
                ) : (
                  <Button 
                    onClick={handleFinalConfirmPayment}
                    className="w-full h-14 rounded-[20px] bg-green-500 hover:bg-green-600 text-white font-black text-base md:text-lg uppercase italic tracking-widest gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-5 h-5" /> EFECTIVO RECIBIDO
                  </Button>
                )}
                
                <Button 
                  onClick={() => {
                    setIsConfirmPaymentOpen(false);
                    onUpdateStatus('debt_pending');
                  }}
                  className="text-amber-600 font-bold text-[10px] uppercase tracking-widest h-10 rounded-full hover:bg-amber-50 transition-colors w-full border-2 border-amber-200 mt-2"
                >
                  ⚠️ NO HA PAGADO
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isMissionChatOpen && (
        <div className="fixed inset-0 z-[600] bg-white w-screen h-[100dvh]">
          <OrderChat orderId={mission.id} orderData={mission} onClose={() => setIsMissionChatOpen(false)} />
        </div>
      )}
      
      <ReleaseMissionDialog 
        isOpen={isReleaseDialogOpen}
        onOpenChange={setIsReleaseDialogOpen}
        onConfirmRelease={(reason) => {
          setIsReleaseDialogOpen(false);
          onRelease(reason);
        }}
      />

      <MissionStatusFooter />
    </div>
  );
}
