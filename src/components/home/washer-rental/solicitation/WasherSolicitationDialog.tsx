
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

// Importación de Componentes Atómicos
import { SolicitationHeader } from './components/header/SolicitationHeader';
import { NameField } from './components/identity/NameField';
import { AddressField } from './components/identity/AddressField';
import { PhoneField } from './components/identity/PhoneField';
import { DurationManager } from './components/pricing/DurationManager';
import { PaymentStrategySelector } from './components/payment/PaymentStrategySelector';
import { SubmitAction } from './components/actions/SubmitAction';
import { SuccessProtocol } from './components/actions/SuccessProtocol';
import { ServiceConfiguration } from './components/service/ServiceConfiguration';

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
  
  // Refs para Auto-Scroll Maestro
  const nameRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const sectorRef = useRef<HTMLDivElement>(null);
  const addressRef = useRef<HTMLDivElement>(null);

  // Estados de Formulario
  const [tempName, setTempName] = useState("");
  const [tempAddress, setTempAddress] = useState("");
  const [tempSector, setTempSector] = useState("");
  const [tempPhone, setTempPhone] = useState("");
  const [requestHours, setRequestHours] = useState(5);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'digital'>('cash');
  
  // Estado de Errores de Validación
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  // Detalles Técnicos
  const [washerType, setWasherType] = useState<'automatica' | 'semiautomatica'>('automatica');
  const [floor, setFloor] = useState("1");
  const [hasElevator, setHasElevator] = useState(false);
  const [hasStairs, setHasStairs] = useState(false);
  const [stairCount, setStairCount] = useState(1);

  // Estados de Proceso
  const [orderStatus, setOrderStatus] = useState<OrderSubmissionStatus>('idle');
  const [submittedOrderId, setSubmittedOrderId] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [flashEffect, setFlashEffect] = useState<'none' | 'red' | 'green'>('none');

  useEffect(() => {
    if (profile && isOpen && orderStatus === 'idle') {
      setTempName(profile.displayName || "");
      setTempAddress(profile.address || "");
      setTempSector(profile.sector || "");
      setTempPhone(profile.phoneNumber || "");
    }
    if (pricingConfig?.minHours && isOpen && orderStatus === 'idle') {
      setRequestHours(Number(pricingConfig.minHours));
    }
  }, [profile, isOpen, pricingConfig, orderStatus]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (orderStatus === 'success' && submittedOrderId && redirectCountdown > 0) {
      timer = setTimeout(() => setRedirectCountdown(prev => prev - 1), 1000);
    } else if (orderStatus === 'success' && submittedOrderId && redirectCountdown === 0) {
      router.push(`/washer/waiting-room/${submittedOrderId}`);
    }
    return () => clearTimeout(timer);
  }, [orderStatus, submittedOrderId, redirectCountdown, router]);

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
    // 1. Limpiar errores previos
    setFieldErrors({});
    const newErrors: Record<string, boolean> = {};

    // 2. Validación Quirúrgica
    if (!tempName.trim()) newErrors.name = true;
    if (!tempPhone.trim()) newErrors.phone = true;
    if (!tempSector.trim()) newErrors.sector = true;
    if (!tempAddress.trim()) newErrors.address = true;

    // 3. Ejecutar Redirección si hay errores
    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      
      let targetRef = null;
      if (newErrors.name) targetRef = nameRef;
      else if (newErrors.sector || newErrors.address) {
        const el = document.getElementById(newErrors.sector ? 'field-sector' : 'field-address');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      else if (newErrors.phone) targetRef = phoneRef;

      if (targetRef?.current) {
        targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      toast({ 
        title: "Campos Requeridos", 
        description: "Completa la información marcada para continuar.", 
        variant: "destructive" 
      });
      return;
    }

    setOrderStatus('sending');
    try {
      const orderId = await onSubmitRequest({
        customerName: tempName,
        customerAddress: tempAddress,
        customerSector: tempSector,
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
        setOrderStatus('idle');
      }
    } catch (e) {
      setOrderStatus('idle');
      toast({ title: "Error de red", description: "No se pudo conectar con el radar.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if (orderStatus === 'idle') onOpenChange(v); }}>
      <DialogContent className="max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 rounded-none border-none shadow-none bg-[#0a0a0a] p-0 overflow-hidden flex flex-col z-[600] animate-in slide-in-from-bottom duration-500 [&>button:last-child]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Nueva Solicitud Alquiler</DialogTitle>
          <DialogDescription>Formulario de solicitud sincronizado.</DialogDescription>
        </DialogHeader>
        
        <SolicitationHeader 
          isAdmin={isAdmin} 
          onOpenAdminSettings={onOpenAdminSettings} 
          onClose={() => onOpenChange(false)} 
        />

        <div className="flex-1 overflow-y-auto no-scrollbar bg-white rounded-t-[40px] mt-2 border-t-4 border-slate-950">
          <div className="max-w-md mx-auto py-8 px-6 space-y-10 pb-32">
            
            <div className={cn("space-y-6 transition-all duration-500", orderStatus !== 'idle' && "opacity-40 pointer-events-none grayscale")}>
              <NameField 
                ref={nameRef}
                value={tempName} 
                onChange={setTempName} 
                hasError={fieldErrors.name}
              />
              <AddressField 
                address={tempAddress} onAddressChange={setTempAddress}
                sector={tempSector} onSectorChange={setTempSector}
                errorSector={fieldErrors.sector}
                errorAddress={fieldErrors.address}
              />
              <PhoneField 
                ref={phoneRef}
                value={tempPhone} 
                onChange={setTempPhone} 
                hasError={fieldErrors.phone}
              />
            </div>

            <div className={cn("transition-all duration-500", orderStatus !== 'idle' && "opacity-40 pointer-events-none grayscale")}>
              <ServiceConfiguration 
                isAdmin={isAdmin}
                washerType={washerType} setWasherType={setWasherType}
                floor={floor} setFloor={setFloor}
                hasElevator={hasElevator} setHasElevator={setHasElevator}
                hasStairs={hasStairs} setHasStairs={setHasStairs}
                stairCount={stairCount} setStairCount={setStairCount}
              />
            </div>

            <div className={cn("transition-all duration-500", orderStatus !== 'idle' && "opacity-40 pointer-events-none grayscale")}>
              <DurationManager 
                requestHours={requestHours}
                onAdjust={handleAdjustHours}
                minHours={Number(pricingConfig?.minHours || 5)}
                formattedPrice={formattedPrice}
                flashEffect={flashEffect}
              />
            </div>

            <div className={cn("transition-all duration-500", orderStatus !== 'idle' && "opacity-40 pointer-events-none grayscale")}>
              <PaymentStrategySelector 
                method={paymentMethod}
                onChange={setPaymentMethod}
              />
            </div>

            {orderStatus === 'success' ? (
              <SuccessProtocol countdown={redirectCountdown} />
            ) : (
              <SubmitAction 
                isSending={orderStatus === 'sending'}
                isAnyStoreOpen={isAnyStoreOpen}
                formattedPrice={formattedPrice}
                paymentMethod={paymentMethod}
                onSubmit={handleFormSubmit}
              />
            )}
            
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
