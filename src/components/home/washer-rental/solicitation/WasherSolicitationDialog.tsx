
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
import { CitySelector } from './components/identity/CitySelector';
import { ZoneSelector } from './components/identity/ZoneSelector';
import { AddressField } from './components/identity/AddressField';
import { PhoneField } from './components/identity/PhoneField';
import { DurationManager } from './components/pricing/DurationManager';
import { PaymentStrategySelector } from './components/payment/PaymentStrategySelector';
import { SubmitAction } from './components/actions/SubmitAction';
import { SuccessProtocol } from './components/actions/SuccessProtocol';
import { ServiceConfiguration } from './components/service/ServiceConfiguration';
import { useCityConfig } from '@/hooks/use-city-config';
import { checkIsBusinessOpen } from '../../HomeActions';

interface WasherSolicitationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
  profile: any;
  pricingConfig: any;
  isAnyStoreOpen: boolean;
  activeStores?: any[];
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
  activeStores = [],
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
  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState("");
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

  // CEREBRO GEOGRÁFICO: Carga la configuración de la ciudad y zona seleccionada
  const { cityConfig, activeCities, activeCitiesLoading, activeZones, hasMultipleZones, resolvedPricing } = useCityConfig({
    overrideCityId: selectedCityId || undefined,
    overrideZoneId: selectedZoneId || undefined,
    profile,
  });

  const availableMachineTypes = useMemo(() => {
    if (!selectedCityId) return { automatic: true, semiautomatic: true };

    const storesInRegion = activeStores.filter((store: any) => {
      if (store.status !== 'active' || !checkIsBusinessOpen(store.openTime, store.closeTime)) return false;
      if (store.cityId && store.cityId !== selectedCityId) return false;
      if (hasMultipleZones && selectedZoneId) {
        if (store.zoneId && store.zoneId !== selectedZoneId) return false;
      }
      return true;
    });

    if (storesInRegion.length === 0) return { automatic: true, semiautomatic: true };

    let hasAuto = false;
    let hasSemi = false;

    storesInRegion.forEach((store: any) => {
      if (store.hasAutomatic) hasAuto = true;
      if (store.hasSemiautomatic) hasSemi = true;
    });

    if (!hasAuto && !hasSemi) return { automatic: true, semiautomatic: true };

    return { automatic: hasAuto, semiautomatic: hasSemi };
  }, [activeStores, selectedCityId, selectedZoneId, hasMultipleZones]);

  useEffect(() => {
    if (washerType === 'automatica' && !availableMachineTypes.automatic && availableMachineTypes.semiautomatic) {
      setWasherType('semiautomatica');
    } else if (washerType === 'semiautomatica' && !availableMachineTypes.semiautomatic && availableMachineTypes.automatic) {
      setWasherType('automatica');
    }
  }, [availableMachineTypes, washerType]);

  useEffect(() => {
    if (profile && isOpen && orderStatus === 'idle') {
      setTempName(profile.displayName || "");
      setTempAddress(profile.address || "");
      setTempSector(profile.sector || "");
      setTempPhone(profile.phoneNumber || "");
      if (profile.cityId) setSelectedCityId(profile.cityId);
      if (profile.zoneId) setSelectedZoneId(profile.zoneId);
    }
  }, [profile, isOpen, orderStatus]);

  // Sync minHours cuando cambia la configuración de la ciudad o zona
  useEffect(() => {
    if (isOpen && orderStatus === 'idle' && resolvedPricing) {
      setRequestHours(resolvedPricing.minHours);
    }
  }, [resolvedPricing?.minHours, isOpen, orderStatus]);

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

  // PRICING DINÁMICO: Usa la configuración resuelta de la ZONA o CIUDAD
  const totalPrice = useMemo(() => {
    const rate = washerType === 'automatica' ? resolvedPricing.rateAuto : resolvedPricing.rateSemi;
    const stairsExtra = hasStairs ? (Number(stairCount || 0) * resolvedPricing.stairsFee) : 0;
    const floorNum = Number(floor) || 1;
    const floorExtra = (floorNum > 1 && !hasElevator) ? (floorNum - 1) * resolvedPricing.floorFee : 0;
    return (Number(requestHours) * rate) + stairsExtra + floorExtra;
  }, [requestHours, washerType, floor, hasElevator, hasStairs, stairCount, resolvedPricing]);

  const formattedPrice = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalPrice);

  const handleAdjustHours = (delta: number) => {
    if (orderStatus !== 'idle') return;
    const newHours = requestHours + delta;
    if (newHours < resolvedPricing.minHours) {
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
    if (!selectedCityId) newErrors.city = true;
    if (hasMultipleZones && !selectedZoneId) newErrors.zone = true;
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
        floor, hasElevator, hasStairs, stairCount,
        cityId: selectedCityId, cityName: cityConfig.name,
        zoneId: hasMultipleZones ? selectedZoneId : null,
        zoneName: hasMultipleZones ? activeZones.find(z => z.id === selectedZoneId)?.name || null : null,
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
      <DialogContent className="max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 rounded-none border-none shadow-none bg-slate-900/30 backdrop-blur-[50px] p-0 overflow-hidden flex flex-col z-[600] animate-in slide-in-from-bottom duration-500 [&>button:last-child]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Nueva Solicitud Alquiler</DialogTitle>
          <DialogDescription>Formulario de solicitud sincronizado.</DialogDescription>
        </DialogHeader>
        
        <SolicitationHeader isAdmin={isAdmin} onOpenAdminSettings={onOpenAdminSettings} onClose={() => onOpenChange(false)} />

        <div className="flex-1 overflow-y-auto no-scrollbar bg-white rounded-t-[40px] mt-2 border-t-4 border-slate-950">
          <div className="max-w-md mx-auto py-8 px-6 space-y-10 pb-32">
            
            {!user && orderStatus === 'idle' ? (
              <div className="relative py-14 px-6 flex flex-col items-center text-center space-y-10 animate-in fade-in zoom-in duration-700 bg-gradient-to-b from-slate-900 to-black rounded-[40px] border border-slate-800 shadow-2xl overflow-hidden -mx-2 mt-4">
                {/* Holographic background flares */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                  <div className="absolute -top-[30%] -left-[20%] w-[80%] h-[60%] bg-primary/20 blur-[100px] rounded-full mix-blend-screen animate-pulse" />
                  <div className="absolute top-[40%] -right-[20%] w-[60%] h-[60%] bg-rose-500/10 blur-[80px] rounded-full mix-blend-screen" />
                </div>

                {/* Central Identity Artifact */}
                <div className="relative z-10">
                  <div className="absolute inset-0 bg-primary/30 rounded-[32px] blur-2xl animate-ping [animation-duration:3s]" />
                  <div className="relative w-28 h-28 bg-slate-950/80 backdrop-blur-xl rounded-[32px] flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 group duration-500 hover:scale-105">
                    {/* Inner glowing ring */}
                    <div className="absolute inset-2 border border-white/5 rounded-[24px]" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-primary/20 to-transparent -skew-x-12 animate-shimmer rounded-[32px]" />
                    <ShieldCheck className="w-14 h-14 text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-500" />
                    <Sparkles className="absolute -top-4 -right-4 w-10 h-10 text-yellow-400 animate-pulse drop-shadow-[0_0_15px_rgba(250,204,21,1)]" />
                  </div>
                </div>
                
                <div className="space-y-4 relative z-10">
                  <h3 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter text-white leading-none drop-shadow-xl">
                    IDENTIDAD<br/><span className="text-primary">REQUERIDA</span>
                  </h3>
                  <p className="text-slate-400 font-bold text-xs sm:text-sm uppercase tracking-[0.2em] max-w-[280px] mx-auto leading-relaxed">
                    INICIA SESIÓN DE FORMA RÁPIDA Y SEGURA PARA CONTINUAR.
                  </p>
                </div>
                
                {/* Access Button */}
                <div className="w-full relative z-10 group mt-4">
                  <div className="absolute inset-0 bg-primary/40 blur-xl rounded-[32px] transition-all duration-500 group-hover:bg-primary/60 group-hover:blur-2xl" />
                  <Button 
                    onClick={() => {
                      localStorage.setItem('keep_solicitation_open', 'true');
                      initiateGoogleSignIn(auth);
                    }}
                    className="relative w-full h-20 rounded-[32px] bg-white text-slate-950 font-black text-sm sm:text-lg gap-4 shadow-2xl active:scale-95 transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-slate-300/50 to-transparent skew-x-[-30deg] group-hover:animate-[shimmer_1.5s_infinite]" />
                    <LogIn className="w-6 h-6 sm:w-7 sm:h-7 text-primary group-hover:scale-110 transition-transform duration-300" /> 
                    <span className="tracking-wide">CONTINUAR CON GOOGLE</span>
                  </Button>
                </div>

                <div className="flex flex-col items-center gap-4 relative z-10">
                  <div className="flex items-center gap-2 text-slate-300 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">Conexión Encriptada & Segura</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className={cn("space-y-6 transition-all duration-500", orderStatus !== 'idle' && "opacity-40 pointer-events-none grayscale")}>
                  <NameField value={tempName} onChange={setTempName} hasError={fieldErrors.name} />
                  <CitySelector 
                    selectedCityId={selectedCityId} 
                    onCityChange={setSelectedCityId} 
                    activeCities={activeCities}
                    hasError={fieldErrors.city} 
                  />
                  {hasMultipleZones && (
                    <ZoneSelector
                      zones={activeZones}
                      cityConfig={cityConfig}
                      selectedZoneId={selectedZoneId}
                      onZoneChange={setSelectedZoneId}
                      error={fieldErrors.zone}
                    />
                  )}
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
                    availableMachineTypes={availableMachineTypes}
                  />
                </div>

                <div className={cn("transition-all duration-500", orderStatus !== 'idle' && "opacity-40 pointer-events-none grayscale")}>
                  <DurationManager requestHours={requestHours} onAdjust={handleAdjustHours} minHours={resolvedPricing.minHours} formattedPrice={formattedPrice} flashEffect={flashEffect} />
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
