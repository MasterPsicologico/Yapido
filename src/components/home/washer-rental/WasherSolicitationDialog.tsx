
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

// Importación de Funciones Atómicas Subdivididas
import { WasherSolicitationHeader } from './WasherSolicitationHeader';
import { WasherNameInput } from './WasherNameInput';
import { WasherAddressInput } from './WasherAddressInput';
import { WasherPhoneInput } from './WasherPhoneInput';
import { WasherTimeSelector } from './WasherTimeSelector';
import { WasherPaymentSelector } from './WasherPaymentSelector';
import { WasherSolicitationFooter } from './WasherSolicitationFooter';
import { WasherServiceDetails } from './WasherServiceDetails';

interface WasherSolicitationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
  profile: any;
  pricingConfig: any;
  isAnyStoreOpen: boolean;
  onOpenAdminSettings: () => void;
  onSubmitRequest: (data: any) => Promise<string | undefined>;
}

export type OrderSubmissionStatus = 'idle' | 'sending' | 'success' | 'timeout';

export function WasherSolicitationDialog({
  isOpen,
  onOpenChange,
  isAdmin,
  profile,
  pricingConfig,
  isAnyStoreOpen,
  onOpenAdminSettings,
  onSubmitRequest
}: WasherSolicitationDialogProps) {
  const router = useRouter();
  
  // Estados de Formulario
  const [tempName, setTempName] = useState("");
  const [tempAddress, setTempAddress] = useState("");
  const [tempPhone, setTempPhone] = useState("");
  const [requestHours, setRequestHours] = useState(5);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'digital'>('cash');
  
  // Detalles Técnicos
  const [washerType, setWasherType] = useState<'automatica' | 'semiautomatica'>('automatica');
  const [floor, setFloor] = useState("1");
  const [hasElevator, setHasElevator] = useState(false);
  const [hasStairs, setHasStairs] = useState(false);
  const [stairCount, setStairCount] = useState(1);

  // Estados de Proceso y Navegación
  const [orderStatus, setOrderStatus] = useState<OrderSubmissionStatus>('idle');
  const [submittedOrderId, setSubmittedOrderId] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [flashEffect, setFlashEffect] = useState<'none' | 'red' | 'green'>('none');

  // Inicialización de Perfil
  useEffect(() => {
    if (profile && isOpen && orderStatus === 'idle') {
      setTempName(profile.displayName || "");
      setTempAddress(profile.address || "");
      setTempPhone(profile.phoneNumber || "");
    }
    if (pricingConfig?.minHours && isOpen && orderStatus === 'idle') {
      setRequestHours(Number(pricingConfig.minHours));
    }
  }, [profile, isOpen, pricingConfig, orderStatus]);

  // LÓGICA DE REDIRECCIÓN AUTOMÁTICA (MONITOR REACTIVO)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (orderStatus === 'success' && submittedOrderId && redirectCountdown > 0) {
      timer = setTimeout(() => setRedirectCountdown(prev => prev - 1), 1000);
    } else if (orderStatus === 'success' && submittedOrderId && redirectCountdown === 0) {
      // NAVEGACIÓN FORZADA AL LLEGAR A CERO
      router.push(`/washer/waiting-room/${submittedOrderId}`);
    }
    return () => clearTimeout(timer);
  }, [orderStatus, submittedOrderId, redirectCountdown, router]);

  // CÁLCULO ECONÓMICO MAESTRO
  const totalPrice = useMemo(() => {
    const config = pricingConfig || {};
    const rate = washerType === 'automatica' ? Number(config.rateAuto || 3500) : Number(config.rateSemi || 3000);
    const stairsExtra = hasStairs ? (Number(stairCount || 0) * Number(config.stairsFee || 5000)) : 0;
    const floorNum = Number(floor) || 1;
    const floorExtra = (floorNum > 1 && !hasElevator) ? (floorNum - 1) * Number(config.floorFee || 2000) : 0;
    return (Number(requestHours) * rate) + stairsExtra + floorExtra;
  }, [requestHours, washerType, floor, hasElevator, hasStairs, stairCount, pricingConfig]);

  const formattedPrice = new Intl.NumberFormat('es-CO', { 
    style: 'currency', currency: 'COP', maximumFractionDigits: 0 
  }).format(totalPrice);

  const handleAdjustHours = (delta: number) => {
    if (orderStatus !== 'idle') return;
    const minHours = Number(pricingConfig?.minHours || 5);
    const newHours = requestHours + delta;
    if (newHours < minHours) {
      setFlashEffect('red');
      setTimeout(() => setFlashEffect('none'), 600);
      return;
    }
    setFlashEffect('green');
    setRequestHours(newHours);
    setTimeout(() => setFlashEffect('none'), 600);
  };

  const handleFormSubmit = async () => {
    if (!tempAddress || !tempPhone || !tempName) {
      toast({ title: "Datos incompletos", variant: "destructive" });
      return;
    }

    setOrderStatus('sending');
    try {
      const orderId = await onSubmitRequest({
        customerName: tempName,
        customerAddress: tempAddress,
        customerPhone: tempPhone,
        requestHours,
        totalPrice,
        paymentMethod,
        washerType,
        floor,
        hasElevator,
        hasStairs,
        stairCount
      });
      
      if (orderId) {
        setSubmittedOrderId(orderId);
        setOrderStatus('success');
      } else {
        throw new Error("No order ID returned");
      }
    } catch (e) {
      setOrderStatus('idle');
      toast({ title: "Fallo en la sincronización", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if (orderStatus === 'idle') onOpenChange(v); }}>
      <DialogContent className="max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 rounded-none border-none shadow-none bg-[#0a0a0a] p-0 overflow-hidden flex flex-col z-[600] animate-in slide-in-from-bottom duration-500 [&>button:last-child]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Nueva Solicitud Alquiler</DialogTitle>
          <DialogDescription>Formulario modular sincronizado con el perfil.</DialogDescription>
        </DialogHeader>
        
        <WasherSolicitationHeader 
          isAdmin={isAdmin} 
          onOpenAdminSettings={onOpenAdminSettings} 
          onClose={() => onOpenChange(false)} 
        />

        <div className="flex-1 overflow-y-auto no-scrollbar bg-white rounded-t-[40px] mt-2 border-t-4 border-slate-950">
          <div className="max-w-md mx-auto py-8 px-6 space-y-10">
            
            <div className={cn("space-y-6 transition-all duration-500", orderStatus !== 'idle' && "opacity-40 pointer-events-none grayscale")}>
              <WasherNameInput value={tempName} onChange={setTempName} />
              <WasherAddressInput value={tempAddress} onChange={setTempAddress} />
              <WasherPhoneInput value={tempPhone} onChange={setTempPhone} />
            </div>

            <div className={cn("transition-all duration-500", orderStatus !== 'idle' && "opacity-40 pointer-events-none grayscale")}>
              <WasherServiceDetails 
                isAdmin={isAdmin}
                washerType={washerType} setWasherType={setWasherType}
                floor={floor} setFloor={setFloor}
                hasElevator={hasElevator} setHasElevator={setHasElevator}
                hasStairs={hasStairs} setHasStairs={setHasStairs}
                stairCount={stairCount} setStairCount={setStairCount}
              />
            </div>

            <div className={cn("transition-all duration-500", orderStatus !== 'idle' && "opacity-40 pointer-events-none grayscale")}>
              <WasherTimeSelector 
                requestHours={requestHours}
                onAdjustHours={handleAdjustHours}
                minHours={Number(pricingConfig?.minHours || 5)}
                formattedPrice={formattedPrice}
                flashEffect={flashEffect}
              />
            </div>

            <div className={cn("transition-all duration-500", orderStatus !== 'idle' && "opacity-40 pointer-events-none grayscale")}>
              <WasherPaymentSelector 
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
              />
            </div>

            <WasherSolicitationFooter 
              status={orderStatus}
              formattedPrice={formattedPrice}
              paymentMethod={paymentMethod}
              isAnyStoreOpen={isAnyStoreOpen}
              redirectCountdown={redirectCountdown}
              onSubmit={handleFormSubmit}
            />
            
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
