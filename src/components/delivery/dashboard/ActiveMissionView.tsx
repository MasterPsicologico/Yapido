
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { format, addHours, differenceInSeconds } from 'date-fns';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  const firestore = useFirestore();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isAtDestination = mission.status === 'at_destination';
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
      percentage: Math.min(100, (1 - (remainingSeconds / totalSeconds)) * 100)
    };
  }, [isInUse, mission.deliveredAt, mission.requestHours, currentTime]);

  const handleAddHours = (extra: number) => {
    if (!firestore || !mission.id) return;
    const orderRef = doc(firestore, 'orders', mission.id);
    
    // Lógica de cobro proporcional (ejemplo: 3500 por hora extra)
    const extraCharge = extra * 3500; 

    updateDocumentNonBlocking(orderRef, {
      requestHours: increment(extra),
      totalPrice: increment(extraCharge),
      updatedAt: serverTimestamp()
    });

    toast({ 
      title: `+${extra} Hora añadida`, 
      description: "El cronómetro y el precio se han actualizado.",
      className: "bg-primary text-white border-none" 
    });
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] animate-in slide-in-from-bottom duration-500 overflow-hidden relative z-[40]">
      <MissionHeader 
        onReleaseOpen={() => setIsReleaseDialogOpen(true)}
        status={mission.status}
        isWithDriver={true}
        isInUse={isInUse}
        isAtDestination={isAtDestination}
        currentTime={currentTime}
      />

      <main className="flex-1 overflow-y-auto no-scrollbar bg-[#f8fafc]">
        <div className="px-6 py-8 pb-24 space-y-8 max-w-2xl mx-auto">
          
          {isInUse && usageProgress && (
            <MissionUsageCountdown 
              progress={usageProgress} 
              onAddHours={handleAddHours} 
            />
          )}

          <MissionIdentity 
            missionId={mission.id} 
            requestHours={mission.requestHours} 
          />

          <MissionDeliveryCard 
            customerAddress={mission.customerAddress}
            customerName={mission.customerName}
            customerPhone={mission.customerPhone}
            customerPhoto={customerProfile?.photoURL}
            onOpenMaps={() => onOpenMaps(mission.customerAddress)}
            onOpenChat={() => setIsMissionChatOpen(true)}
          />

          <MissionActionOrchestrator 
            status={mission.status}
            isAtDestination={isAtDestination}
            isInUse={isInUse}
            isExpired={usageProgress?.isExpired}
            onUpdateStatus={onUpdateStatus}
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

      <Dialog open={isMissionChatOpen} onOpenChange={setIsMissionChatOpen}>
        <DialogContent className="p-0 border-none bg-white max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 flex flex-col z-[300] [&>button:last-child]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Chat de Misión Activa</DialogTitle>
            <DialogDescription>Canal de comunicación seguro para el servicio en curso.</DialogDescription>
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
