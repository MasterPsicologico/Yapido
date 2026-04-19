
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { useUser, useAuth } from '@/firebase';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { Button } from '@/components/ui/button';
import { LogIn, Sparkles, ShieldCheck } from 'lucide-react';

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
  const { user } = useUser();
  const auth = useAuth();
  
  const [tempName, setTempName] = useState("");
  const [tempAddress, setTempAddress] = useState("");
  const [tempSector, setTempSector] = useState("");
  const [tempPhone, setTempPhone] = useState("");
  const [requestHours, setRequestHours] = useState(5);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'digital'>('cash');
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [washerType, setWasherType] = useState<'automatica' | 'semiautomatica'>('automatica');
  const [floor, setFloor] = useState("1");
  const [hasElevator, setHasElevator] = useState(false);
  const [hasStairs, setHasStairs] = useState(false);
  const [stairCount, setStairCount] = useState(1);
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
      onOpenChange(false);
      router.push(`/washer/waiting-room/${submittedOrderId}`);
    }
    return () => clearTimeout(timer);
  }, [orderStatus, submittedOrderId, redirectCountdown, router, onOpenChange]);

  const totalPrice = useMemo(() => {
    const config = pricingConfig || {};
    const rate = washerType === 'automatica' ? Number(config.rateAuto || 3500) : Number(config.rateSemi || 3000);
    const stairsExtra = hasStairs ? (Number(stairCount || 0) * Number(config.stairsFee || 5000)) : 0;
    const floorNum = Number(floor) || 1;
    const floorExtra = (floorNum > 1 && !hasElevator) ? (floorNum - 1) * Number(config.floorFee || 2000) : 0;
    return (Number(requestHours) * rate) + stairsExtra + floorExtra;
  }, [requestHours, washerType, floor, hasElevator, hasStairs, stairCount, pricingConfig]);

  const formattedPrice = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalPrice);

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
    if (!user) {
      setOrderStatus('idle');
      return;
    }

    setFieldErrors({});
    const newErrors: Record<string, boolean> = {};
    if (!tempName.trim()) newErrors.name = true;
    if (!tempPhone.trim()) newErrors.phone = true;
    if (!tempSector.trim()) newErrors.sector = true;
    if (!tempAddress.trim()) newErrors.address = true;

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      toast({ title: "Información Requerida", description: "Completa los campos marcados.", variant: "destructive" });
      return;
    }

    setOrderStatus('sending');
    try {
      const orderId = await onSubmitRequest({
        customerName: tempName, customerAddress: tempAddress, customerSector: tempSector,
        customerPhone: tempPhone, requestHours, totalPrice, paymentMethod, washerType,
        floor, hasElevator, hasStairs, stairCount
      });
      if (orderId) {
        setSubmittedOrderId(orderId);
        setOrderStatus('success');
      } else setOrderStatus('idle');
    } catch (e) {
      setOrderStatus('idle');
      toast({ title: "Error en la nube", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if (orderStatus === 'idle') onOpenChange(v); }}>
      <DialogContent className="max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 rounded-none border-none shadow-none bg-[#0a0a0a] p-0 overflow-hidden flex flex-col z-[600] animate-in slide-in-from-bottom duration-500 [&>button:last-child]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Nueva Solicitud Alquiler</DialogTitle>
          <DialogDescription>Formulario de solicitud sincronizado.</DialogDescription>
        </DialogHeader>
        
        <SolicitationHeader isAdmin={isAdmin} onOpenAdminSettings={onOpenAdminSettings} onClose={() => onOpenChange(false)} />

        <div className="flex-1 overflow-y-auto no-scrollbar bg-white rounded-t-[40px] mt-2 border-t-4 border-slate-950">
          <div className="max-w-md mx-auto py-8 px-6 space-y-10 pb-32">
            
            {!user && orderStatus === 'idle' ? (
              <div className="py-12 flex flex-col items-center text-center space-y-10 animate-in fade-in zoom-in duration-700">
                <div className="relative">
                  {/* Artefacto de Seguridad Soberana (Dorado) - Tamaño Reducido a la Mitad */}
                  <div className="absolute inset-0 bg-yellow-500/20 rounded-[22px] animate-ping [animation-duration:3s]" />
                  
                  {/* Anillos Orbitales de Datos */}
                  <div className="absolute -inset-2 border border-yellow-500/20 rounded-full animate-[spin_12s_linear_infinite] opacity-30" />
                  <div className="absolute -inset-2 border-t-2 border-yellow-600/60 rounded-full animate-[spin_4s_linear_infinite]" />
                  
                  {/* Chasis de Oro Obsidiana (Miniaturizado) */}
                  <div className="relative w-14 h-14 bg-slate-950 rounded-[19px] flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.25)] border border-yellow-600/30 overflow-hidden group">
                    {/* Brillo de Metal Líquido */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-yellow-400/10 to-transparent -skew-x-12 animate-shimmer" />
                    
                    {/* Icono de Seguridad Suprema */}
                    <div className="relative z-10 transition-transform duration-500 group-hover:scale-110">
                      <ShieldCheck className="w-7 h-7 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,1)]" />
                      <Sparkles className="absolute -top-1.5 -right-1.5 w-4 h-4 text-yellow-300 animate-pulse" />
                    </div>

                    {/* Micro-sensores de Proceso */}
                    <div className="absolute top-1 right-4 w-0.5 h-0.5 bg-yellow-400 rounded-full animate-pulse" />
                    <div className="absolute bottom-3 left-2.5 w-0.5 h-0.5 bg-yellow-600 rounded-full animate-pulse" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Identidad Requerida</h3>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest px-8 leading-relaxed">Inicia sesión de forma rápida y segura para formalizar tu solicitud.</p>
                </div>
                <Button 
                  onClick={() => initiateGoogleSignIn(auth)}
                  className="w-full h-20 rounded-[32px] bg-slate-900 text-white font-black text-lg gap-4 shadow-2xl active:scale-95 transition-all border-b-8 border-black"
                >
                  <LogIn className="w-6 h-6 text-primary" /> ACCESO INSTANTÁNEO
                </Button>
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 text-slate-300">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span className="text-[8px] font-black uppercase tracking-[0.4em]">Protección de Datos Activa</span>
                  </div>
                  <div className="h-0.5 w-10 bg-slate-100 rounded-full" />
                </div>
              </div>
            ) : (
              <>
                <div className={cn("space-y-6 transition-all duration-500", orderStatus !== 'idle' && "opacity-40 pointer-events-none grayscale")}>
                  <NameField value={tempName} onChange={setTempName} hasError={fieldErrors.name} />
                  <AddressField 
                    address={tempAddress} onAddressChange={setTempAddress}
                    sector={tempSector} onSectorChange={setTempSector}
                    errorSector={fieldErrors.sector} errorAddress={fieldErrors.address}
                  />
                  <PhoneField value={tempPhone} onChange={setTempPhone} hasError={fieldErrors.phone} />
                </div>

                <div className={cn("transition-all duration-500", orderStatus !== 'idle' && "opacity-40 pointer-events-none grayscale")}>
                  <ServiceConfiguration 
                    isAdmin={isAdmin} washerType={washerType} setWasherType={setWasherType}
                    floor={floor} setFloor={setFloor} hasElevator={hasElevator} setHasElevator={setHasElevator}
                    hasStairs={hasStairs} setHasStairs={setHasStairs} stairCount={stairCount} setStairCount={setStairCount}
                  />
                </div>

                <div className={cn("transition-all duration-500", orderStatus !== 'idle' && "opacity-40 pointer-events-none grayscale")}>
                  <DurationManager requestHours={requestHours} onAdjust={handleAdjustHours} minHours={Number(pricingConfig?.minHours || 5)} formattedPrice={formattedPrice} flashEffect={flashEffect} />
                </div>

                <div className={cn("transition-all duration-500", orderStatus !== 'idle' && "opacity-40 pointer-events-none grayscale")}>
                  <PaymentStrategySelector method={paymentMethod} onChange={setPaymentMethod} />
                </div>

                {orderStatus === 'success' ? (
                  <SuccessProtocol countdown={redirectCountdown} />
                ) : (
                  <SubmitAction isSending={orderStatus === 'sending'} isAnyStoreOpen={isAnyStoreOpen} formattedPrice={formattedPrice} paymentMethod={paymentMethod} onSubmit={handleFormSubmit} />
                )}
              </>
            )}
            
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
