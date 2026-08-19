"use client";

import { useState, useEffect, useMemo, useRef, useCallback, useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { LogIn, Sparkles, ShieldCheck, ChevronDown, ChevronUp, Settings2, Check, Circle } from 'lucide-react';
// Import CSS-based animations instead of framer-motion for better performance
// import { motion, AnimatePresence } from 'framer-motion';

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

// CSS-based animation classes for better performance
const animationClasses = {
  fadeIn: 'animate-in fade-in duration-300',
  slideUp: 'animate-in slide-in-from-bottom-4 duration-500',
  slideDown: 'animate-in slide-in-from-top-4 duration-300',
  scaleIn: 'animate-in zoom-in-95 duration-200',
  shake: 'animate-shake',
  fadeOut: 'animate-out fade-out duration-200',
  slideUpOut: 'animate-out slide-out-to-top-4 duration-300',
};

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
  const firestore = useFirestore();
  
  // Consolidate state into a single object to reduce re-renders
  const [formData, setFormData] = useState({
    tempName: '',
    tempAddress: '',
    tempSector: '',
    tempPhone: '',
    selectedCityId: '',
    selectedZoneId: '',
    requestHours: 5,
    paymentMethod: 'digital' as 'cash' | 'digital',
    washerType: 'automatica' as 'automatica' | 'semiautomatica',
    floor: '1',
    hasElevator: false,
    hasStairs: false,
    stairCount: 1,
  });
  
  const [orderStatus, setOrderStatus] = useState<OrderSubmissionStatus>('idle');
  const [submittedOrderId, setSubmittedOrderId] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [flashEffect, setFlashEffect] = useState<'none' | 'red' | 'green'>('none');
  const [isPersonalDataCollapsed, setIsPersonalDataCollapsed] = useState(false);
  const [isServiceDataCollapsed, setIsServiceDataCollapsed] = useState(false);
  const [saveStatuses, setSaveStatuses] = useState<Record<string, 'idle' | 'typing' | 'saved'>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [flashEffect, setFlashEffect] = useState<'none' | 'red' | 'green'>('none');
  const [isPersonalDataCollapsed, setIsPersonalDataCollapsed] = useState(false);
  const [isServiceDataCollapsed, setIsServiceDataCollapsed] = useState(false);
  const [saveStatuses, setSaveStatuses] = useState<Record<string, 'idle' | 'typing' | 'saved'>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [flashEffect, setFlashEffect] = useState<'none' | 'red' | 'green'>('none');
  const [isPersonalDataCollapsed, setIsPersonalDataCollapsed] = useState(false);
  const [isServiceDataCollapsed, setIsServiceDataCollapsed] = useState(false);
  const [saveStatuses, setSaveStatuses] = useState<Record<string, 'idle' | 'typing' | 'saved'>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [flashEffect, setFlashEffect] = useState<'none' | 'red' | 'green'>('none');
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [submittedOrderId, setSubmittedOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderSubmissionStatus>('idle');
  const [isPersonalDataCollapsed, setIsPersonalDataCollapsed] = useState(false);
  const [isServiceDataCollapsed, setIsServiceDataCollapsed] = useState(false);
  const [saveStatuses, setSaveStatuses] = useState<Record<string, 'idle' | 'typing' | 'saved'>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const prevIsCompleteRef = useRef(false);

  // Refs for stable references
  const saveStatusesRef = useRef(saveStatuses);
  saveStatusesRef.current = saveStatuses;
  const prevIsCompleteRef = useRef(false);
  const confirmationResultRef = useRef<any>(null);
  const recaptchaVerifierRef = useRef<any>(null);

  // ==========================================
  // INITIALIZATION
  // ==========================================
  const initPromise = useRef<Promise<void> | null>(null);
  
  // Initialize auth only once
  useEffect(() => {
    if (!initPromise.current) {
      initPromise.current = initializeAuth();
    }
    return () => {
      initPromise.current = null;
    };
  }, []);

  const initializeAuth = async () => {
    try {
      // 1. Get device fingerprint (persistent across reinstalls)
      const deviceFp = await deviceFingerprint.getFingerprint();
      const deviceFingerprintStr = deviceFp.fingerprint;
      console.log('[AuthService] Device fingerprint:', deviceFingerprintStr);

      // Check for email link completion
      if (isSignInWithEmailLink(auth, window.location.href)) {
        const email = getStorageItem('auth_email_for_link') || 
          new URLSearchParams(window.location.search).get('email');
        if (email) {
          await completeEmailLinkSignIn(email, window.location.href);
          return;
        }
      }

      // Check if device is already linked to a phone number
      const linkedPhone = await phoneAuth.getPhoneByDeviceFingerprint(deviceFingerprintStr);
      
      if (linkedPhone) {
        setStorageItem('linked_phone_for_verification', linkedPhone);
      } else {
        await ensureAuthenticated();
        const existingRecoveryCode = getStorageItem(STORAGE_KEYS.RECOVERY_CODE);
        if (!existingRecoveryCode) {
          await generateAndStoreRecoveryCode();
        }
      }

      await loadLocalData();
      startAuthListener();

    } catch (error) {
      console.error('[AuthService] Initialization error:', error);
    }
  };

  const ensureAuthenticated = async () => {
    if (auth.currentUser) {
      currentUser = mapFirebaseUser(auth.currentUser);
      currentState = auth.currentUser.isAnonymous ? 'anonymous' : 'authenticated';
      return;
    }

    const result = await signInAnonymously(auth);
    currentUser = mapFirebaseUser(result.user);
    currentState = 'anonymous';
    await initializeLocalData(result.user.uid);
  };

  // Initialize local data for new user
  const initializeLocalData = async (uid: string): Promise<void> => {
    const recoveryCode = generateRecoveryCode();
    
    const localData = {
      uid,
      recoveryCode,
      profile: {},
      rentalHistory: [],
      favorites: [],
      cart: [],
      notifications: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: false,
    };

    setStorageItem(STORAGE_KEYS.RECOVERY_CODE, recoveryCode);
    setStorageItem(STORAGE_KEYS.GUEST_DATA, JSON.stringify(localData));
    setStorageItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify({}));
    
    callbacks?.onRecoveryCodeGenerated?.(recoveryCode);
  };

  // ==========================================
  // OPTIMIZED EVENT HANDLERS (using useCallback)
  // ==========================================
  
  const handleFieldChange = useCallback((field: string, value: string, setter: (v: string) => void) => {
    setter(value);
    setSaveStatuses(prev => ({ ...prev, [field]: 'typing' }));
  }, []);

  const handleFieldBlur = useCallback((field: string, value: string, dbKey: string) => {
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
  }, [user?.uid, firestore]);

  // Consolidated field handler
  const handleChange = useCallback((field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaveStatuses(prev => ({ ...prev, [field]: 'typing' }));
    setFieldErrors(prev => ({ ...prev, [field]: false }));
  }, []);

  const handleBlur = useCallback((field: keyof typeof formData, value: string, dbKey: string) => {
    if (!user?.uid || !value.trim()) {
      setSaveStatuses(prev => ({ ...prev, [field]: 'idle' }));
      return;
    }
    const userDocRef = doc(firestore, 'users', user.uid);
    setDocumentNonBlocking(userDocRef, {
      [field]: value,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    setSaveStatuses(prev => ({ ...prev, [field]: 'saved' }));
  }, [user?.uid, firestore]);

  // ==========================================
  // OPTIMIZED MEMOIZED COMPUTATIONS
  // ==========================================
  
  const isPersonalDataComplete = useMemo(() => {
    return Boolean(
      formData.tempName.trim() && 
      formData.selectedCityId && 
      (!hasMultipleZones || formData.selectedZoneId) && 
      formData.tempAddress.trim() && 
      formData.tempPhone.trim()
    );
  }, [formData.tempName, formData.selectedCityId, formData.selectedZoneId, 
      formData.tempAddress, formData.tempPhone, hasMultipleZones]);

  const availableMachineTypes = useMemo(() => {
    if (!formData.selectedCityId) return { automatic: true, semiautomatic: true };

    const storesInRegion = activeStores.filter((store: any) => {
      if (store.status !== 'active') return false;
      if (store.cityId !== formData.selectedCityId) return false;
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

  const totalPrice = useMemo(() => {
    const rate = formData.washerType === 'automatica' ? resolvedPricing.rateAuto : resolvedPricing.rateSemi;
    const stairsExtra = formData.hasStairs ? (Number(formData.stairCount || 0) * resolvedPricing.stairsFee) : 0;
    const floorNum = Number(formData.floor) || 1;
    const floorExtra = (Number(formData.floor) > 1 && !formData.hasElevator) ? (Number(formData.floor) - 1) * resolvedPricing.floorFee : 0;
    return (Number(formData.requestHours) * (formData.washerType === 'automatica' ? resolvedPricing.rateAuto : resolvedPricing.rateSemi)) + stairsExtra + floorExtra;
  }, [formData.requestHours, formData.washerType, formData.floor, formData.hasElevator, formData.hasStairs, formData.stairCount, resolvedPricing]);

  const formattedPrice = useMemo(() => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalPrice)
  , [totalPrice]);

  // CSS-based animation classes instead of framer-motion
  const animationClasses = {
    fadeIn: 'animate-in fade-in duration-300',
    slideUp: 'animate-in slide-in-from-bottom-4 duration-500',
    slideDown: 'animate-in slide-in-from-top-4 duration-300',
    scaleIn: 'animate-in zoom-in-95 duration-200',
    shake: 'animate-shake',
    fadeOut: 'animate-out fade-out duration-200',
    slideUpOut: 'animate-out slide-out-to-top-4 duration-300',
  };

  // Memoized handlers
  const handleChange = useCallback((field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaveStatuses(prev => ({ ...prev, [field]: 'typing' }));
    setFieldErrors(prev => ({ ...prev, [field]: false }));
  }, []);

  const handleBlur = useCallback((field: keyof typeof formData, value: string, dbKey: string) => {
    if (!user?.uid || !value.trim()) {
      setSaveStatuses(prev => ({ ...prev, [field]: 'idle' }));
      return;
    }
    const userDocRef = doc(firestore, 'users', user.uid);
    setDocumentNonBlocking(userDocRef, {
      [field]: value,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    setSaveStatuses(prev => ({ ...prev, [field]: 'saved' }));
  }, [user?.uid, firestore]);

  // Consolidated field handler
  const handleFieldChange = (field: string, value: string, setter: (v: string) => void) => {
    setter(value);
    setSaveStatuses(prev => ({ ...prev, [field]: 'typing' }));
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

  const handleEmailLink = useCallback(async (email: string) => {
    const actionCodeSettings = {
      url: `${window.location.origin}/auth/complete?email=${encodeURIComponent(email)}`,
      handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    localStorage.setItem('auth_email_for_link', email);
    callbacks?.onLinkSent('email');
  }, []);

  const handleWhatsAppCode = useCallback(async (phoneNumber: string) => {
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const recaptchaVerifier = new RecaptchaVerifier(getAuthInstance(), 'recaptcha-container', {
        size: 'invisible',
      });
      confirmationResult = await signInWithPhoneNumber(
        getAuthInstance(),
        formattedPhone,
        recaptchaVerifier
      );
      callbacks?.onLinkSent('whatsapp');
    } catch (error: any) {
      const msg = getErrorMessage(error);
      callbacks?.onError(msg, 'whatsapp');
      throw new Error(msg);
    }
  }, []);

  // ==========================================
  // EFFECTS (minimized and optimized)
  // ==========================================

  // Single effect for profile initialization
  useEffect(() => {
    if (profile && isOpen && orderStatus === 'idle') {
      setFormData(prev => ({
        ...prev,
        tempName: profile.displayName || "",
        tempAddress: profile.address || "",
        tempSector: profile.sector || "",
        tempPhone: profile.phoneNumber || "",
        selectedCityId: profile.cityId || "",
        selectedZoneId: profile.zoneId || "",
        washerType: profile.lastWasherType || 'automatica',
        floor: profile.lastFloor || "1",
        hasElevator: profile.lastHasElevator || false,
        hasStairs: profile.lastHasStairs || false,
        stairCount: profile.lastStairCount || 1,
      });

      const profileHasAllData = Boolean(
        profile.displayName?.trim() &&
        profile.cityId &&
        profile.address?.trim() &&
        profile.phoneNumber?.trim()
      );

      if (profileHasAllData) {
        setIsPersonalDataCollapsed(true);
        prevIsCompleteRef.current = true;
        setSaveStatuses({
          name: 'saved', city: 'saved', zone: 'saved',
          address: 'saved', sector: 'saved', phone: 'saved'
        });
      } else {
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

  // Auto-redirect after successful auth
  useEffect(() => {
    if (isAuthenticated && pathname === '/auth') {
      const timer = setTimeout(() => router.push('/'), 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, pathname, router]);

  // Email link completion check
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'signIn' && params.get('email')) {
      handleEmailLinkComplete(params.get('email')!);
    }
  }, []);

  // Sync minHours when pricing changes
  useEffect(() => {
    if (isOpen && orderStatus === 'idle' && resolvedPricing) {
      setRequestHours(resolvedPricing.minHours);
    }
  }, [resolvedPricing?.minHours, isOpen, orderStatus]);

  // Redirect countdown
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

  // Redirect countdown effect
  useEffect(() => {
    if (orderStatus === 'success' && submittedOrderId && redirectCountdown > 0) {
      const timer = setTimeout(() => setRedirectCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (orderStatus === 'success' && submittedOrderId && redirectCountdown === 0) {
      onOpenChange(false);
      router.push(`/washer/waiting-room/${submittedOrderId}`);
    }
  }, [orderStatus, submittedOrderId, redirectCountdown, router, onOpenChange]);

  // ==========================================
  // FORM SUBMISSION
  // ==========================================

  const handleFormSubmit = async () => {
    if (!user) {
      setOrderStatus('idle');
      return;
    }

    setFieldErrors({});
    const newErrors: Record<string, boolean> = {};
    if (!formData.tempName.trim()) newErrors.name = true;
    if (!formData.tempPhone.trim()) newErrors.phone = true;
    if (!formData.selectedCityId) newErrors.city = true;
    if (hasMultipleZones && !formData.selectedZoneId) newErrors.zone = true;
    if (!formData.tempAddress.trim()) newErrors.address = true;

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      if (newErrors.name || newErrors.phone || newErrors.city || newErrors.zone || newErrors.address) {
        setIsPersonalDataCollapsed(false);
      }
      toast({ title: "Información Requerida", description: "Completa los campos marcados.", variant: "destructive" });
      return;
    }

    setOrderStatus('sending');

    if (user?.uid) {
      const userDocRef = doc(firestore, 'users', user.uid);
      setDocumentNonBlocking(userDocRef, {
        lastWasherType: formData.washerType,
        lastFloor: formData.floor,
        lastHasElevator: formData.hasElevator,
        lastHasStairs: formData.hasStairs,
        lastStairCount: formData.stairCount,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    try {
      const orderId = await onSubmitRequest({
        customerName: formData.tempName, customerAddress: formData.tempAddress, customerSector: formData.tempSector,
        customerPhone: formData.tempPhone, requestHours: formData.requestHours, totalPrice, paymentMethod: formData.paymentMethod, washerType: formData.washerType,
        floor: formData.floor, hasElevator: formData.hasElevator, hasStairs: formData.hasStairs, stairCount: formData.stairCount,
        cityId: formData.selectedCityId, cityName: cityConfig.name,
        zoneId: hasMultipleZones ? formData.selectedZoneId : null,
        zoneName: hasMultipleZones ? activeZones.find(z => z.id === formData.selectedZoneId)?.name || null : null,
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

  // ==========================================
  // RENDER
  // ==========================================
  
  if (!isOpen) return null;

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
            
            {/* Welcome Screen - No User */}
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
                {/* Authenticated User Flow */}
                <div className="space-y-8">
                  {/* Auto-redirect effect for authenticated users */}
                  <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
                    {isAuthenticated && pathname === '/' && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl animate-in fade-in zoom-in duration-500">
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">¡Bienvenido de vuelta!</p>
                            <p className="text-gray-600 mb-6">Redirigiendo a la aplicación...</p>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-primary animate-pulse" style={{ width: '100%' }} />
                            </div>
                          </div>
                        </div>
                      )}
                    )}
                  </div>
                </div>
              </>
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
                <div className="space-y-8" style={{ willChange: 'transform, opacity' }}>
                  {/* AnimatePresence removed - using CSS animations instead */}
                  {!isPersonalDataCollapsed ? (
                    <div className="space-y-6" style={{ willChange: 'transform, opacity' }}>
                      {isPersonalDataComplete && (
                        <div className="flex justify-end mb-[-10px] relative z-10">
                          <button 
                            onClick={() => setIsPersonalDataCollapsed(true)}
                            className="text-[10px] font-black text-primary flex items-center gap-1 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full transition-colors"
                          >
                            OCULTAR DATOS <ChevronUp className="w-3 h-3" />
                          </button>
                        )}
                        <NameField 
                          value={formData.tempName} 
                          onChange={(v) => handleChange('tempName', v)} 
                          onBlur={() => handleBlur('tempName', formData.tempName, 'displayName')}
                          saveStatus={saveStatuses['name']}
                          hasError={fieldErrors.name} 
                        />
                        <CitySelector 
                          selectedCityId={formData.selectedCityId} 
                          onCityChange={(v) => handleChange('selectedCityId', v)} 
                          activeCities={activeCities}
                          saveStatus={saveStatuses['city']}
                          hasError={fieldErrors.city} 
                        />
                        {hasMultipleZones && (
                          <ZoneSelector
                            zones={activeZones}
                            cityConfig={cityConfig}
                            selectedZoneId={formData.selectedZoneId}
                            onZoneChange={(v) => handleChange('selectedZoneId', v)}
                            saveStatus={saveStatuses['zone']}
                            error={fieldErrors.zone}
                          />
                        )}
                        <AddressField 
                          address={formData.tempAddress} 
                          onAddressChange={(v) => handleChange('tempAddress', v)} 
                          onAddressBlur={() => handleBlur('tempAddress', formData.tempAddress, 'address')}
                          addressSaveStatus={saveStatuses['address']}
                          sector={formData.tempSector} 
                          onSectorChange={(v) => handleChange('tempSector', v)} 
                          onSectorBlur={() => handleBlur('tempSector', formData.tempSector, 'sector')}
                          sectorSaveStatus={saveStatuses['sector']}
                          errorSector={fieldErrors.sector} 
                          errorAddress={fieldErrors.address}
                        />
                        <PhoneField 
                          value={formData.tempPhone} 
                          onChange={(v) => handleChange('tempPhone', v)} 
                          onBlur={() => handleBlur('tempPhone', formData.tempPhone, 'phoneNumber')}
                          saveStatus={saveStatuses['phone']}
                          hasError={fieldErrors.phone} 
                        />
                      </div>
                    ) : (
                      <div 
                        onClick={() => setIsPersonalDataCollapsed(false)}
                        className="bg-emerald-50/60 border-2 border-emerald-200/60 rounded-[24px] p-4 flex items-center justify-between cursor-pointer hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-300 group shadow-sm hover:shadow-md animate-in fade-in slide-in-from-bottom-2 duration-300"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                            <ShieldCheck className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Datos Personales</h4>
                            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1"><Check className="w-3 h-3" /> {formData.tempName.split(' ')[0]} • Completo</p>
                          </div>
                        </div>
                        <div className="text-[10px] font-black text-primary flex items-center gap-1 bg-white border border-slate-100 shadow-sm px-3 py-2 rounded-full group-hover:bg-primary/5 transition-colors">
                          EDITAR <ChevronDown className="w-3 h-3" />
                        </div>
                    )}
                  )}
                </AnimatePresence>

                {/* SECCIÓN 2+: SERVICIO, HORAS, PAGO */}
                {isPersonalDataComplete && (
                  <div className="space-y-8" style={{ willChange: 'transform, opacity' }}>
                    {/* Upgrade Prompt for Anonymous Users */}
                    {isAnonymous && (
                      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-[24px] p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-black text-sm text-amber-800">¿Quieres guardar tu cuenta permanentemente?</h4>
                            <p className="text-sm text-amber-700 mt-1">Vincula tu WhatsApp o Email para no perder tus datos</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setShowUpgrade('whatsapp')}>
                              <Phone className="w-4 h-4 mr-2" />
                              WhatsApp
                            </Button>
                            <Button variant="ghost" onClick={() => setShowEmailLink(true)}>
                              <Mail className="w-4 h-4 mr-2" />
                              Email
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Service Configuration */}
                      <ServiceConfiguration 
                        isAdmin={isAdmin} 
                        washerType={formData.washerType} 
                        setWasherType={setWasherType}
                        floor={formData.floor} 
                        setFloor={setFloor} 
                        hasElevator={formData.hasElevator} 
                        setHasElevator={setHasElevator}
                        hasStairs={formData.hasStairs} 
                        setHasStairs={setHasStairs} 
                        stairCount={formData.stairCount} 
                        setStairCount={setStairCount}
                        availableMachineTypes={availableMachineTypes}
                      />

                      {/* Duration & Price */}
                      <DurationManager 
                        requestHours={formData.requestHours} 
                        onAdjust={handleAdjustHours} 
                        minHours={resolvedPricing.minHours} 
                        formattedPrice={formattedPrice} 
                        flashEffect={flashEffect} 
                      />

                      {/* Payment Method */}
                      <PaymentStrategySelector 
                        method={formData.paymentMethod} 
                        onChange={setPaymentMethod} 
                      />

                      {/* Submit / Success */}
                      {orderStatus === 'success' ? (
                        <SuccessProtocol countdown={redirectCountdown} />
                      ) : (
                        <SubmitAction 
                          isSending={orderStatus === 'sending'} 
                          isAnyStoreOpen={isAnyStoreOpen} 
                          formattedPrice={formattedPrice} 
                          paymentMethod={formData.paymentMethod} 
                          onSubmit={handleFormSubmit} 
                        />
                      )}
                    </div>
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

export default WasherSolicitationDialog;