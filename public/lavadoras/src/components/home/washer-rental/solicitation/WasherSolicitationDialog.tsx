
"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { doc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Sparkles, ShieldCheck, ChevronDown, ChevronUp, Settings2, Check, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const firestore = useFirestore();
  
  const [tempName, setTempName] = useState("");
  const [tempAddress, setTempAddress] = useState("");
  const [tempSector, setTempSector] = useState("");
  const [tempPhone, setTempPhone] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [requestHours, setRequestHours] = useState(5);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'digital'>('digital');
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
  const [isPersonalDataCollapsed, setIsPersonalDataCollapsed] = useState(false);
  const [isServiceDataCollapsed, setIsServiceDataCollapsed] = useState(false);
  const [saveStatuses, setSaveStatuses] = useState<Record<string, 'idle' | 'typing' | 'saved'>>({});
  const prevIsCompleteRef = useRef(false);

  // CEREBRO GEOGRÁFICO: Carga la configuración de la ciudad y zona seleccionada
  const { cityConfig, activeCities, activeCitiesLoading, activeZones, hasMultipleZones, resolvedPricing } = useCityConfig({
    overrideCityId: selectedCityId || undefined,
    overrideZoneId: selectedZoneId || undefined,
    profile,
  });

  const availableMachineTypes = useMemo(() => {
    if (!selectedCityId) return { automatic: true, semiautomatic: true };

    const storesInRegion = activeStores.filter((store: any) => {
      if (store.status !== 'active') return false;
      if (store.cityId !== selectedCityId) return false;
      if (hasMultipleZones && selectedZoneId) {
        if (store.zoneId !== selectedZoneId) return false;
      }
      return true;
    });

    if (storesInRegion.length === 0) return { automatic: true, semiautomatic: true };

    let hasAuto = false;
    let hasSemi = false;

    storesInRegion.forEach((store: any) => {
      if (store.hasAutomatic === true || store.hasAutomatic === 'true') hasAuto = true;
      if (store.hasSemiautomatic === true || store.hasSemiautomatic === 'true') hasSemi = true;
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

  const isPersonalDataComplete = useMemo(() => {
    return Boolean(
      tempName.trim() && 
      selectedCityId && 
      (!hasMultipleZones || selectedZoneId) && 
      tempAddress.trim() && 
      tempPhone.trim()
    );
  }, [tempName, selectedCityId, selectedZoneId, tempAddress, tempPhone, hasMultipleZones]);

  const handleFieldChange = (field: string, value: string, setter: (v: string) => void) => {
    setter(value);
    // No actualizar saveStatus en cada keystroke - solo en onBlur para evitar re-renders masivos
  };

  const handleFieldBlur = (field: string, value: string, dbKey: string) => {
    if (!user?.uid || !value.trim()) {
      setSaveStatuses(prev => ({ ...prev, [field]: 'idle' }));
      return;
    }
    const userDocRef = doc(firestore, 'users', user.uid);
    setDocumentNonBlocking(userDocRef, {
      [dbKey]: value,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    setSaveStatuses(prev => ({ ...prev, [field]: 'saved' }));
  };

  // Efecto que colapsa SOLO cuando todos los campos han sido guardados (onBlur)
  useEffect(() => {
    const allFieldsSaved = saveStatuses.name === 'saved' && 
                           saveStatuses.city === 'saved' && 
                           saveStatuses.zone === 'saved' &&
                           saveStatuses.address === 'saved' && 
                           saveStatuses.sector === 'saved' && 
                           saveStatuses.phone === 'saved';
    
    if (allFieldsSaved && isPersonalDataComplete && !prevIsCompleteRef.current && user?.uid) {
      // Guardar a Firestore que los datos están completos
      const userDocRef = doc(firestore, 'users', user.uid);
      setDocumentNonBlocking(userDocRef, {
        displayName: tempName,
        address: tempAddress,
        sector: tempSector,
        phoneNumber: tempPhone,
        cityId: selectedCityId,
        zoneId: hasMultipleZones ? selectedZoneId : null,
        personalDataComplete: true,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      // Contraer con delay visual
      const timer = setTimeout(() => setIsPersonalDataCollapsed(true), 600);
      prevIsCompleteRef.current = true;
      return () => clearTimeout(timer);
    }
  }, [saveStatuses, isPersonalDataComplete, user, tempName, tempAddress, tempSector, tempPhone, selectedCityId, selectedZoneId, hasMultipleZones, firestore]);

  useEffect(() => {
    if (profile && isOpen && orderStatus === 'idle') {
      setTempName(profile.displayName || "");
      setTempAddress(profile.address || "");
      setTempSector(profile.sector || "");
      setTempPhone(profile.phoneNumber || "");
      if (profile.cityId) setSelectedCityId(profile.cityId);
      if (profile.zoneId) setSelectedZoneId(profile.zoneId);

      // Detectar si los datos personales ya están completos desde el perfil
      const profileHasAllData = Boolean(
        profile.displayName?.trim() &&
        profile.cityId &&
        profile.address?.trim() &&
        profile.phoneNumber?.trim()
      );

      if (profileHasAllData) {
        // Datos ya completos: colapsar por defecto
        setIsPersonalDataCollapsed(true);
        prevIsCompleteRef.current = true;
        setSaveStatuses({
          name: 'saved', city: 'saved', zone: 'saved',
          address: 'saved', sector: 'saved', phone: 'saved'
        });
      } else {
        // Datos incompletos: expandir para que el usuario los complete
        setIsPersonalDataCollapsed(false);
        prevIsCompleteRef.current = false;
        setSaveStatuses({
          name: 'idle', city: 'idle', zone: 'idle',
          address: 'idle', sector: 'idle', phone: 'idle'
        });
      }

      if (profile.lastWasherType) {
        setWasherType(profile.lastWasherType);
        setFloor(profile.lastFloor || "1");
        setHasElevator(profile.lastHasElevator || false);
        setHasStairs(profile.lastHasStairs || false);
        setStairCount(profile.lastStairCount || 1);
        setIsServiceDataCollapsed(true);
      } else {
        setIsServiceDataCollapsed(false);
      }
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
      
      if (newErrors.name || newErrors.phone || newErrors.city || newErrors.zone || newErrors.address) {
        setIsPersonalDataCollapsed(false);
      }
      
      toast({ title: "Información Requerida", description: "Completa los campos marcados.", variant: "destructive" });
      return;
    }

    setOrderStatus('sending');
    
    // Guardar preferencias de servicio para futuras solicitudes
    if (user?.uid) {
      const userDocRef = doc(firestore, 'users', user.uid);
      setDocumentNonBlocking(userDocRef, {
        lastWasherType: washerType,
        lastFloor: floor,
        lastHasElevator: hasElevator,
        lastHasStairs: hasStairs,
        lastStairCount: stairCount,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

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
          <div className="max-w-md sm:max-w-lg lg:max-w-xl mx-auto py-6 sm:py-10 px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10 lg:space-y-12 pb-20 sm:pb-24 lg:pb-32">
            
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
                    SESIÓN<br/><span className="text-primary">AUTOMÁTICA</span>
                  </h3>
                  <p className="text-slate-400 font-bold text-xs sm:text-sm uppercase tracking-[0.2em] max-w-[280px] mx-auto leading-relaxed">
                    TU SESIÓN SE CREA AUTOMÁTICAMENTE AL ENTRAR. RECARGUE LA PÁGINA PARA CONTINUAR.
                  </p>
                </div>
                
                {/* Auto Auth Message */}
                <div className="w-full relative z-10 group mt-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-[32px] p-6 text-center">
                    <div className="flex items-center justify-center gap-3 text-emerald-400 mb-3">
                      <ShieldCheck className="w-6 h-6" />
                      <span className="text-sm sm:text-lg font-black uppercase tracking-wide">Autenticación Instantánea</span>
                    </div>
                    <p className="text-slate-300 text-xs sm:text-sm max-w-[300px] mx-auto">
                      Se ha creado una sesión anónima segura vinculada a tu dispositivo. 
                      Tus datos se guardan localmente y se sincronizan automáticamente.
                    </p>
                  </div>
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
                {/* STEP PROGRESS INDICATOR */}
                <div className="flex items-center justify-center gap-2 py-2">
                  {[{ label: 'Datos', done: isPersonalDataComplete }, { label: 'Servicio', done: isServiceDataCollapsed && isPersonalDataComplete }, { label: 'Hora & Pago', done: false }].map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-500",
                        step.done ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-100" : "bg-slate-100 text-slate-400"
                      )}>
                        {step.done ? <Check className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
                      </div>
                      <span className={cn("text-[9px] font-black uppercase tracking-widest transition-colors duration-300", step.done ? "text-emerald-600" : "text-slate-300")}>{step.label}</span>
                      {i < 2 && <div className={cn("w-6 h-0.5 rounded-full transition-all duration-700", step.done ? "bg-emerald-400" : "bg-slate-100")} />}
                    </div>
                  ))}
                </div>

                {/* SECCIÓN 1: DATOS PERSONALES */}
                <AnimatePresence mode="wait">
                  {!isPersonalDataCollapsed ? (
                    <motion.div
                      key="personal-expanded"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className={cn("space-y-6 relative", orderStatus !== 'idle' && "opacity-40 pointer-events-none grayscale")}>
                        {isPersonalDataComplete && (
                          <div className="flex justify-end mb-[-10px] relative z-10">
                            <button 
                              onClick={() => setIsPersonalDataCollapsed(true)}
                              className="text-[10px] font-black text-primary flex items-center gap-1 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full transition-colors"
                            >
                              OCULTAR DATOS <ChevronUp className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <NameField 
                          value={tempName} 
                          onChange={(v) => handleFieldChange('name', v, setTempName)} 
                          onBlur={() => handleFieldBlur('name', tempName, 'displayName')}
                          saveStatus={saveStatuses['name']}
                          hasError={fieldErrors.name} 
                        />
                        <CitySelector 
                          selectedCityId={selectedCityId} 
                          onCityChange={(v) => {
                            handleFieldChange('city', v, setSelectedCityId);
                            handleFieldBlur('city', v, 'cityId');
                          }} 
                          activeCities={activeCities}
                          saveStatus={saveStatuses['city']}
                          hasError={fieldErrors.city} 
                        />
                        {hasMultipleZones && (
                          <ZoneSelector
                            zones={activeZones}
                            cityConfig={cityConfig}
                            selectedZoneId={selectedZoneId}
                            onZoneChange={(v) => {
                              handleFieldChange('zone', v, setSelectedZoneId);
                              handleFieldBlur('zone', v, 'zoneId');
                            }}
                            saveStatus={saveStatuses['zone']}
                            error={fieldErrors.zone}
                          />
                        )}
                        <AddressField 
                          address={tempAddress} 
                          onAddressChange={(v) => handleFieldChange('address', v, setTempAddress)}
                          onAddressBlur={() => handleFieldBlur('address', tempAddress, 'address')}
                          addressSaveStatus={saveStatuses['address']}
                          sector={tempSector} 
                          onSectorChange={(v) => handleFieldChange('sector', v, setTempSector)}
                          onSectorBlur={() => handleFieldBlur('sector', tempSector, 'sector')}
                          sectorSaveStatus={saveStatuses['sector']}
                          errorSector={fieldErrors.sector} 
                          errorAddress={fieldErrors.address}
                        />
                        <PhoneField 
                          value={tempPhone} 
                          onChange={(v) => handleFieldChange('phone', v, setTempPhone)} 
                          onBlur={() => handleFieldBlur('phone', tempPhone, 'phoneNumber')}
                          saveStatus={saveStatuses['phone']}
                          hasError={fieldErrors.phone} 
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="personal-collapsed"
                      initial={{ opacity: 0, y: -10, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.97 }}
                      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <div 
                        onClick={() => setIsPersonalDataCollapsed(false)}
                        className="bg-emerald-50/60 border-2 border-emerald-200/60 rounded-[24px] p-4 flex items-center justify-between cursor-pointer hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-300 group shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                            <ShieldCheck className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Datos Personales</h4>
                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1"><Check className="w-3 h-3" /> {tempName.split(' ')[0]} • Completo</p>
                          </div>
                        </div>
                        <div className="text-[10px] font-black text-primary flex items-center gap-1 bg-white border border-slate-100 shadow-sm px-3 py-2 rounded-full group-hover:bg-primary/5 transition-colors">
                          EDITAR <ChevronDown className="w-3 h-3" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* SECCIÓN 2+: SERVICIO, HORAS, PAGO */}
                <AnimatePresence>
                  {isPersonalDataComplete && (
                    <motion.div
                      key="rest-of-form"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], delay: 0.15 }}
                      className="space-y-10"
                    >
                      {/* Detalles del Servicio */}
                      <AnimatePresence mode="wait">
                        {!isServiceDataCollapsed ? (
                          <motion.div
                            key="service-expanded"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                            className="overflow-hidden"
                          >
                            <div className={cn("relative", orderStatus !== 'idle' && "opacity-40 pointer-events-none grayscale")}>
                              <div className="flex justify-end mb-[-20px] relative z-20">
                                <button 
                                  onClick={() => setIsServiceDataCollapsed(true)}
                                  className="text-[10px] font-black text-yellow-600 flex items-center gap-1 bg-yellow-50 hover:bg-yellow-100 px-3 py-1.5 rounded-full transition-colors mr-4 mt-2"
                                >
                                  OCULTAR DETALLES <ChevronUp className="w-3 h-3" />
                                </button>
                              </div>
                              <ServiceConfiguration 
                                isAdmin={isAdmin} washerType={washerType} setWasherType={setWasherType}
                                floor={floor} setFloor={setFloor} hasElevator={hasElevator} setHasElevator={setHasElevator}
                                hasStairs={hasStairs} setHasStairs={setHasStairs} stairCount={stairCount} setStairCount={setStairCount}
                                availableMachineTypes={availableMachineTypes}
                              />
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="service-collapsed"
                            initial={{ opacity: 0, y: -10, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.97 }}
                            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                          >
                            <div 
                              onClick={() => setIsServiceDataCollapsed(false)}
                              className="bg-yellow-50/50 border-2 border-yellow-200/60 rounded-[24px] p-4 flex items-center justify-between cursor-pointer hover:bg-yellow-50 hover:border-yellow-300 transition-all duration-300 group shadow-sm hover:shadow-md"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                  <Settings2 className="w-6 h-6" />
                                </div>
                                <div>
                                  <h4 className="text-[11px] font-black text-yellow-800 uppercase tracking-widest">Detalles del Servicio</h4>
                                  <p className="text-[10px] font-bold text-yellow-600/70 uppercase tracking-wider flex items-center gap-1"><Check className="w-3 h-3" /> {washerType} • Piso {floor}</p>
                                </div>
                              </div>
                              <div className="text-[10px] font-black text-yellow-600 flex items-center gap-1 bg-white border border-yellow-100 shadow-sm px-3 py-2 rounded-full group-hover:bg-yellow-100/50 transition-colors">
                                EDITAR <ChevronDown className="w-3 h-3" />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Duración y Precio */}
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className={cn("transition-all duration-500", orderStatus !== 'idle' && "opacity-40 pointer-events-none grayscale")}
                      >
                        <DurationManager requestHours={requestHours} onAdjust={handleAdjustHours} minHours={resolvedPricing.minHours} formattedPrice={formattedPrice} flashEffect={flashEffect} />
                      </motion.div>

                      {/* Método de Pago */}
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className={cn("transition-all duration-500", orderStatus !== 'idle' && "opacity-40 pointer-events-none grayscale")}
                      >
                        <PaymentStrategySelector method={paymentMethod} onChange={setPaymentMethod} />
                      </motion.div>

                      {/* Submit / Success */}
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                      >
                        {orderStatus === 'success' ? (
                          <SuccessProtocol countdown={redirectCountdown} />
                        ) : (
                          <SubmitAction isSending={orderStatus === 'sending'} isAnyStoreOpen={isAnyStoreOpen} formattedPrice={formattedPrice} paymentMethod={paymentMethod} onSubmit={handleFormSubmit} />
                        )}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
            
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
