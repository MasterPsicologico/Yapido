
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { format, addHours, differenceInSeconds } from 'date-fns';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { OrderChat } from '@/components/chat/OrderChat';
import { ReleaseMissionDialog } from './release-mission';

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
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [evidencePhoto, setEvidencePhoto] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isAtDestination = mission.status === 'at_destination';
  const isInUse = mission.status === 'delivered';
  const isWithDriver = mission.status === 'delivered_to_driver' || isAtDestination || isInUse;
  
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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
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
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      setEvidencePhoto(dataUrl);
      if (isAtDestination) {
        onUpdateStatus('at_destination', { deliveryEvidence: dataUrl });
      }
    } finally {
      setIsCompressing(false);
      stopCamera();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] animate-in slide-in-from-bottom duration-500 overflow-hidden relative z-[40]">
      <MissionHeader 
        onReleaseOpen={() => setIsReleaseDialogOpen(true)}
        status={mission.status}
        isWithDriver={isWithDriver}
        isInUse={isInUse}
        isAtDestination={isAtDestination}
        currentTime={currentTime}
      />

      <main className="flex-1 overflow-y-auto no-scrollbar bg-[#f8fafc]">
        <div className="px-6 py-8 pb-24 space-y-8 max-w-2xl mx-auto">
          
          {isInUse && usageProgress && <MissionUsageCountdown progress={usageProgress} />}

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
            evidencePhoto={evidencePhoto}
            isCompressing={isCompressing}
            onUpdateStatus={onUpdateStatus}
            onStartCamera={startCamera}
            onClearPhoto={() => setEvidencePhoto(null)}
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

      {isCameraOpen && (
        <div className="fixed inset-0 z-[500] bg-black flex flex-col p-6 animate-in fade-in">
          <div className="flex justify-between items-center mb-4 text-white">
            <h4 className="font-black uppercase text-[10px] tracking-[0.3em] italic">Capturar Evidencia</h4>
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

      <Dialog open={isMissionChatOpen} onOpenChange={setIsMissionChatOpen}>
        <DialogContent className="p-0 border-none bg-white max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 flex flex-col z-[300] [&>button:last-child]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Chat de Misión</DialogTitle>
            <DialogDescription>Canal de comunicación seguro.</DialogDescription>
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
