
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

// COMPONENTES ATÓMICOS
import { MissionHeader } from './active-mission/components/header/MissionHeader';
import { MissionIdentity } from './active-mission/components/identity/MissionIdentity';
import { MissionDeliveryCard } from './active-mission/components/delivery/MissionDeliveryCard';
import { MissionUsageCountdown } from './active-mission/components/timer/MissionUsageCountdown';
import { MissionTechSpecs } from './active-mission/components/specs/MissionTechSpecs';
import { MissionActionOrchestrator } from './active-mission/components/actions/MissionActionOrchestrator';
import { MissionStatusFooter } from './active-mission/components/footer/MissionStatusFooter';

interface ActiveMissionViewProps {
  mission: any;
  customerProfile: any;
  onUpdateStatus: (status: string, metadata?: any) => void;
  onRelease: (reason: string) => void;
  onOpenMaps: (address: string) => void;
}

export function ActiveMissionView({ mission, customerProfile, onUpdateStatus, onRelease, onOpenMaps }: ActiveMissionViewProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMissionChatOpen, setIsMissionChatOpen] = useState(false);
  const [isReleaseDialogOpen, setIsReleaseDialogOpen] = useState(false);
  const [isConfirmPaymentOpen, setIsConfirmPaymentOpen] = useState(false);
  const firestore = useFirestore();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    
    return {
      hours: Math.floor(remainingSeconds / 3600),
      minutes: Math.floor((remainingSeconds % 3600) / 60),
      seconds: remainingSeconds % 60,
      isExpired: remainingSeconds <= 0,
      expiryLabel: format(expiryTime, 'HH:mm'),
      percentage: Math.min(100, (1 - (remainingSeconds / totalSeconds)) * 100),
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
    onUpdateStatus('delivered');
    setIsConfirmPaymentOpen(false);
    toast({ title: "Ciclo de cobro cerrado", className: "bg-green-600 text-white" });
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] animate-in slide-in-from-bottom duration-500 overflow-hidden relative z-[40]">
      <MissionHeader 
        onReleaseOpen={() => setIsReleaseDialogOpen(true)}
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

          <MissionIdentity 
            missionId={mission.id} 
            requestHours={mission.requestHours} 
          />

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
          />

          <MissionActionOrchestrator 
            status={mission.status}
            isAtDestination={mission.status === 'at_destination'}
            isInUse={isInUse}
            isExpired={usageProgress?.isExpired}
            onUpdateStatus={mission.status === 'at_destination' ? handleInitialInstallClick : onUpdateStatus}
            onStartCamera={() => {}}
            evidencePhoto={null}
          />

          <MissionTechSpecs 
            floor={mission.floor}
            hasStairs={mission.hasStairs}
            stairCount={mission.stairCount}
            washerType={mission.washerType}
            totalPrice={mission.totalPrice}
          />
        </div>
      </main>

      {/* DIÁLOGO DE CONFIRMACIÓN DE COBRO MAESTRO */}
      <Dialog open={isConfirmPaymentOpen} onOpenChange={setIsConfirmPaymentOpen}>
        <DialogContent className="rounded-[40px] border-none shadow-2xl p-8 sm:max-w-[450px] bg-white z-[500]">
          <DialogHeader className="items-center text-center space-y-4">
            <div className="w-20 h-20 bg-green-50 rounded-[28px] flex items-center justify-center text-green-600 shadow-inner">
              <DollarSign className="w-10 h-10 animate-pulse" />
            </div>
            <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
              Confirmar Cobro
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">
              Auditoría de Liquidación Inmediata
            </DialogDescription>
          </DialogHeader>

          <div className="py-10 text-center space-y-6">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-tight">¿Has recibido el pago total del servicio?</p>
            <div className="bg-slate-900 p-8 rounded-[32px] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-full blur-2xl" />
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mb-2">VALOR A RECAUDAR</p>
              <h4 className="text-5xl font-black italic tracking-tighter text-white">
                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(mission.totalPrice || 0)}
              </h4>
              <div className="flex justify-center gap-2 mt-4">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                  {mission.paymentMethod === 'cash' ? <Wallet className="w-3 h-3 text-yellow-500" /> : <CreditCard className="w-3 h-3 text-blue-400" />}
                  <span className="text-[8px] font-black uppercase text-white/60">
                    {mission.paymentMethod === 'cash' ? 'EFECTIVO' : 'DIGITAL'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-3 sm:flex-col">
            <Button 
              onClick={handleFinalConfirmPayment}
              className="w-full h-16 rounded-[24px] bg-green-500 hover:bg-green-600 text-white font-black text-lg uppercase italic tracking-widest gap-3 shadow-xl active:scale-95"
            >
              <CheckCircle2 className="w-6 h-6" /> SÍ, HE COBRADO
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setIsConfirmPaymentOpen(false)}
              className="text-slate-400 font-black text-[10px] uppercase tracking-widest h-10 rounded-full"
            >
              VOLVER Y REVISAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isMissionChatOpen} onOpenChange={setIsMissionChatOpen}>
        <DialogContent className="p-0 border-none bg-white max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 flex flex-col z-[300] [&>button:last-child]:hidden">
          <DialogHeader className="p-6 border-b shrink-0 flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-black italic uppercase tracking-tighter">Chat de Misión</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsMissionChatOpen(false)}><X className="w-6 h-6" /></Button>
          </DialogHeader>
          <OrderChat orderId={mission.id} orderData={mission} onClose={() => setIsMissionChatOpen(false)} />
        </DialogContent>
      </Dialog>
      
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
