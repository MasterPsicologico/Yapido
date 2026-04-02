
"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Loader2, 
  X, 
  Waves,
  ShieldCheck,
  Zap,
  MapPin,
  CheckCircle2,
  Store as StoreIcon,
  ImageIcon,
  Sparkles,
  ChevronDown,
  Camera,
  Clock,
  Wallet,
  Settings2,
  Moon,
  Sun,
  Minus,
  Info,
  User as UserIcon,
  CreditCard,
  Globe,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, useDoc, useMemoFirebase, setDocumentNonBlocking, useCollection } from '@/firebase';
import { cn } from '@/lib/utils';
import { collection, serverTimestamp, doc, setDoc, query, where } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { compressImage } from '@/lib/image-compression';
import Image from 'next/image';

interface HomeActionsProps {
  isAdmin: boolean;
  profile: any;
  openCategory: boolean;
  setOpenCategory: (v: boolean) => void;
  openStore: boolean;
  setOpenStore: (v: boolean) => void;
  editingCategory: any | null;
  mainCategories: any[] | null;
  base64Image: string | null;
  setBase64Image: (v: string | null) => void;
  isRegistering: boolean;
  isCompressing: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCategorySubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onStoreSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

// UTILIDAD PARA VERIFICAR HORARIO (SOPORTE NOCTURNO Y VALIDACIÓN DE DATOS)
export const checkIsBusinessOpen = (openTime?: string, closeTime?: string) => {
  if (!openTime || !closeTime) return false; // Si falta configuración, está cerrado
  const now = new Date();
  const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
  
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);
  
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;
  
  if (closeMinutes < openMinutes) {
    // Horario nocturno (ej: 23:00 a 06:00)
    return currentTotalMinutes >= openMinutes || currentTotalMinutes < closeMinutes;
  }
  return currentTotalMinutes >= openMinutes && currentTotalMinutes < closeMinutes;
};

export function HomeActions({
  isAdmin, profile, openCategory, setOpenCategory, openStore, setOpenStore,
  editingCategory, mainCategories, base64Image, setBase64Image,
  isRegistering, isCompressing, onImageUpload, onCategorySubmit, onStoreSubmit
}: HomeActionsProps) {
  
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  
  const [openWasher, setOpenWasher] = useState(false);
  const [openAddWasherStore, setOpenAddWasherStore] = useState(false);
  const [showAdminPricing, setShowAdminPricing] = useState(false);

  const [requestHours, setRequestHours] = useState(5);
  const [tempName, setTempName] = useState("");
  const [tempAddress, setTempAddress] = useState("");
  const [tempPhone, setTempPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'digital'>('cash');
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [flashEffect, setFlashEffect] = useState<'none' | 'red' | 'green'>('none');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // CONFIGURACIÓN GLOBAL (PARA EL BANNER)
  const pricingRef = useMemoFirebase(() => doc(firestore, 'appConfig', 'washer_pricing'), [firestore]);
  const { data: pricingConfig } = useDoc(pricingRef);

  const bannerConfigRef = useMemoFirebase(() => doc(firestore, 'appConfig', 'washer_banner'), [firestore]);
  const { data: bannerConfig } = useDoc(bannerConfigRef);

  // CONSULTAR TODAS LAS TIENDAS DE LAVADORAS PARA DETERMINAR ESTADO GLOBAL
  const washerStoresQuery = useMemoFirebase(() => query(
    collection(firestore, 'stores'), 
    where('type', '==', 'washer_rental'),
    where('status', '==', 'active')
  ), [firestore]);
  const { data: washerStores } = useCollection(washerStoresQuery);

  const isAnyStoreOpen = useMemo(() => {
    if (!washerStores || washerStores.length === 0) return false;
    return washerStores.some(s => checkIsBusinessOpen(s.openTime, s.closeTime));
  }, [washerStores]);

  const minHours = Number(pricingConfig?.minHours || 5);
  const valHoraBase = Number(pricingConfig?.basePrice || 3000);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2568-preview.mp3');
    audioRef.current.volume = 0.3;
  }, []);

  useEffect(() => {
    if (openWasher && profile) {
      setTempName(profile.displayName || "");
      setTempAddress(profile.address || "");
      setTempPhone(profile.phoneNumber || "");
      setRequestHours(minHours);
    }
  }, [openWasher, profile, minHours]);

  const playClickSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const totalPrice = useMemo(() => {
    // MULTIPLICACIÓN REAL SOLICITADA: horas * valor_base
    return requestHours * valHoraBase;
  }, [requestHours, valHoraBase]);

  const formattedPrice = new Intl.NumberFormat('es-CO', { 
    style: 'currency', 
    currency: 'COP', 
    maximumFractionDigits: 0 
  }).format(totalPrice);

  const triggerFlash = (color: 'red' | 'green') => {
    setFlashEffect(color);
    setTimeout(() => setFlashEffect('none'), 600);
  };

  const handleAdjustHours = (delta: number) => {
    const newHours = requestHours + delta;
    if (newHours < minHours) {
      triggerFlash('red');
      return;
    }
    triggerFlash('green');
    setRequestHours(newHours);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isAdmin) return;
    setIsUploadingBanner(true);
    try {
      const compressed = await compressImage(file, 1920, 1080, 0.8);
      setDocumentNonBlocking(bannerConfigRef, { backgroundImage: compressed, updatedAt: serverTimestamp() }, { merge: true });
      toast({ title: "Portada actualizada" });
    } catch (error) {
      toast({ title: "Error al actualizar", variant: "destructive" });
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleUpdatePricing = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin) return;
    const fd = new FormData(e.currentTarget);
    const data = {
      minHours: Number(fd.get('minHours')),
      basePrice: Number(fd.get('basePrice')),
      additionalHourPrice: Number(fd.get('additionalHourPrice')),
      updatedAt: serverTimestamp()
    };
    try {
      setDocumentNonBlocking(pricingRef, data, { merge: true });
      toast({ title: "Configuración global actualizada" });
      setShowAdminPricing(false);
    } catch (e) {
      toast({ title: "Error al guardar configuración", variant: "destructive" });
    }
  };

  const handleWasherRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !firestore) return;
    
    if (!isAnyStoreOpen) {
      toast({ title: "No hay tiendas abiertas", variant: "destructive" });
      return;
    }

    setIsSendingRequest(true);
    try {
      const userRef = doc(firestore, 'users', user.uid);
      updateDocumentNonBlocking(userRef, { 
        displayName: tempName, 
        address: tempAddress, 
        phoneNumber: tempPhone, 
        updatedAt: serverTimestamp() 
      });

      const requestData = {
        customerId: user.uid,
        customerName: tempName,
        customerPhone: tempPhone,
        customerAddress: tempAddress,
        type: 'WASHER_RENTAL_REQUEST',
        status: 'pending',
        requestHours,
        totalPrice,
        paymentMethod,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        participants: [user.uid, 'ADMIN_WASHER_POOL'],
        isLogisticsPublic: true,
        productName: `Alquiler de Lavadora (${requestHours}h)`,
      };

      await addDocumentNonBlocking(collection(firestore, 'orders'), requestData);
      toast({ title: "¡Solicitud Enviada!", className: "bg-green-600 text-white border-none" });
      setOpenWasher(false);
    } catch (e) {
      toast({ title: "Error al procesar", variant: "destructive" });
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleCreateWasherStore = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !firestore) return;
    setIsSendingRequest(true);
    const fd = new FormData(e.currentTarget);
    try {
      const storeRef = doc(collection(firestore, 'stores'));
      await setDoc(storeRef, {
        id: storeRef.id, 
        ownerId: user.uid, 
        name: fd.get('name'), 
        phoneNumber: fd.get('phone'), 
        address: fd.get('address'),
        openTime: fd.get('openTime'),
        closeTime: fd.get('closeTime'),
        mainCategoryId: 'category-washer', 
        type: 'washer_rental', 
        status: 'active', 
        createdAt: serverTimestamp(),
        imageUrl: `https://picsum.photos/seed/${storeRef.id}/800/600`, 
        driverCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        privateDrivers: []
      });
      if (profile?.role === 'cliente') updateDocumentNonBlocking(doc(firestore, 'users', user.uid), { role: 'dueño', updatedAt: serverTimestamp() });
      toast({ title: "¡Vitrina de Lavadoras Creada!" });
      setOpenAddWasherStore(false);
      router.push(`/admin/washer/${storeRef.id}`);
    } catch (e) {
      toast({ title: "Error al registrar", variant: "destructive" });
    } finally {
      setIsSendingRequest(false);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="relative w-full group">
        <div 
          onClick={() => { playClickSound(); setOpenWasher(true); }}
          className="relative w-full min-h-[calc(100dvh-64px)] overflow-hidden cursor-pointer flex flex-col items-center justify-start pt-32 px-6 text-center bg-[#0a0a0a] active:scale-[0.99] transition-all duration-500"
        >
          <div className="absolute inset-0 z-0">
            {bannerConfig?.backgroundImage ? (
              <Image src={bannerConfig.backgroundImage} alt="Portada" fill className="object-cover object-top" priority />
            ) : (
              <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/wash/1920/1080')] bg-cover bg-top" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-8 mt-64 animate-in fade-in zoom-in duration-700">
            <div className="relative group/cta">
              {isAnyStoreOpen && (
                <div className="absolute inset-0 rounded-full bg-red-500/40 [animation-duration:2000ms] animate-ping scale-125" />
              )}
              
              <div className={cn(
                "relative z-10 backdrop-blur-md text-white px-6 py-3 rounded-full font-black text-xs uppercase italic tracking-tighter shadow-2xl border border-white/20 flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95",
                isAnyStoreOpen ? "bg-red-600/90 hover:bg-red-600" : "bg-slate-800/80 grayscale"
              )}>
                {isAnyStoreOpen ? (
                  <><CheckCircle2 className="w-4 h-4 text-white" /> SOLICITAR AHORA</>
                ) : (
                  <><Moon className="w-4 h-4 text-slate-400" /> TIENDAS CERRADAS</>
                )}
              </div>
              
              <div className="flex flex-col items-center gap-2 mt-4 opacity-60">
                <span className="text-white text-[7px] font-black uppercase tracking-[0.4em]">
                  {isAnyStoreOpen ? "Toca para iniciar" : "Vuelve en horario comercial"}
                </span>
                <div className="h-0.5 w-8 bg-white/20 rounded-full overflow-hidden">
                  <div className={cn("h-full [animation-duration:2000ms] animate-progress-loading", isAnyStoreOpen ? "bg-red-500" : "bg-slate-500")} />
                </div>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="absolute top-4 left-4 z-30">
              <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={handleBannerUpload} />
              <button onClick={(e) => { e.stopPropagation(); bannerInputRef.current?.click(); }} disabled={isUploadingBanner} className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/60 hover:text-primary transition-all shadow-2xl">
                {isUploadingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </button>
            </div>
          )}

          <button onClick={(e) => { e.stopPropagation(); setOpenAddWasherStore(true); }} className="absolute top-4 right-4 z-30 w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/60 hover:text-green-400 transition-all shadow-2xl">
            <StoreIcon className="w-4 h-4" />
          </button>

          <button onClick={(e) => { e.stopPropagation(); router.push('/categories/category-washer'); }} className="absolute bottom-4 right-4 z-30 w-11 h-11 rounded-full bg-slate-950/40 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white/80 hover:bg-slate-950/60 transition-all shadow-2xl">
            <div className="relative"><div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" /><Waves className="w-5 h-5 text-white/90" /></div>
          </button>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-30 animate-bounce"><ChevronDown className="w-5 h-5 text-white" /></div>
        </div>
      </div>

      <Dialog open={openWasher} onOpenChange={setOpenWasher}>
        <DialogContent className="max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 rounded-none border-none shadow-none bg-[#0a0a0a] p-0 overflow-hidden flex flex-col z-[600] animate-in slide-in-from-bottom duration-500 [&>button:last-child]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Nueva Solicitud Alquiler</DialogTitle>
            <DialogDescription>Formulario de solicitud express para alquiler de lavadoras.</DialogDescription>
          </DialogHeader>
          
          <div className="h-20 bg-slate-950 flex items-center justify-between px-6 shrink-0 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 text-primary"><Waves className="w-6 h-6" /></div>
              <div><h3 className="text-white font-black uppercase italic tracking-tighter text-2xl leading-none">NUEVA SOLICITUD</h3><p className="text-primary/60 text-[9px] font-black uppercase tracking-[0.3em] mt-1">SISTEMA INTELIGENTE</p></div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && <button onClick={() => setShowAdminPricing(!showAdminPricing)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-primary transition-all"><Settings2 className="w-5 h-5" /></button>}
              <button onClick={() => setOpenWasher(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"><X className="w-6 h-6" /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar bg-white rounded-t-[40px] mt-2 border-t-4 border-slate-950">
            <div className="max-w-md mx-auto py-8 px-6 space-y-6">
              
              {showAdminPricing && isAdmin && (
                <form onSubmit={handleUpdatePricing} className="bg-slate-900 p-8 rounded-[32px] text-white space-y-6 animate-in slide-in-from-top-4 duration-300 shadow-2xl">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                    <Settings2 className="w-5 h-5 text-primary" />
                    <h4 className="text-sm font-black uppercase tracking-widest italic">Ajustes Maestro</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-[9px] uppercase tracking-widest text-slate-400">Min. Horas</Label><Input name="minHours" type="number" defaultValue={minHours} className="bg-white/5 border-none h-12 font-bold" /></div>
                    <div className="space-y-1.5"><Label className="text-[9px] uppercase tracking-widest text-slate-400">VALOR HORA BASE</Label><Input name="basePrice" type="number" defaultValue={valHoraBase} className="bg-white/5 border-none h-12 font-bold" /></div>
                  </div>
                  <div className="space-y-1.5"><Label className="text-[9px] uppercase tracking-widest text-slate-400">VALOR HORA EXTRA</Label><Input name="additionalHourPrice" type="number" defaultValue={valHoraBase} className="bg-white/5 border-none h-12 font-bold" /></div>
                  <Button type="submit" className="w-full h-14 bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl">ACTUALIZAR SISTEMA</Button>
                </form>
              )}

              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">NOMBRE COMPLETO</Label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-focus-within:text-primary transition-colors"><UserIcon className="w-4 h-4" /></div>
                    <Input value={tempName} onChange={(e) => setTempName(e.target.value)} className="h-14 rounded-2xl border-none shadow-sm pl-16 font-black text-slate-800 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all" required />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">DIRECCIÓN DE ENTREGA</Label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-focus-within:text-primary transition-colors"><MapPin className="w-4 h-4" /></div>
                    <Input value={tempAddress} onChange={(e) => setTempAddress(e.target.value)} className="h-14 rounded-2xl border-none shadow-sm pl-16 font-black text-slate-800 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all" required />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">WHATSAPP</Label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-focus-within:text-green-500 transition-colors"><Zap className="w-4 h-4" /></div>
                    <Input value={tempPhone} onChange={(e) => setTempPhone(e.target.value)} className="h-14 rounded-2xl border-none shadow-sm pl-16 font-black text-slate-800 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all" required />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-50">
                <div className="flex items-center justify-between px-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">TIEMPO DE ALQUILER</Label>
                  <Badge className="bg-slate-900 text-white border-none text-[9px] font-black px-3 py-1">MIN. {minHours} HORAS</Badge>
                </div>
                
                <div className={cn(
                  "flex flex-col items-center gap-2 bg-slate-50 p-6 rounded-[40px] shadow-inner relative overflow-hidden border-2 transition-all duration-300",
                  flashEffect === 'red' ? "border-red-500 animate-vibrate shadow-[0_0_20px_rgba(239,68,68,0.3)]" : 
                  flashEffect === 'green' ? "border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]" : "border-transparent"
                )}>
                  <div className="flex items-center gap-8 w-full justify-between px-4">
                    <button type="button" onClick={() => handleAdjustHours(-1)} className="w-14 h-14 rounded-2xl bg-white shadow-md text-slate-400 hover:text-red-500 transition-all active:scale-90 flex items-center justify-center"><Minus className="w-6 h-6" /></button>
                    <div className="text-center flex flex-col">
                      <div className="flex items-baseline gap-2 justify-center">
                        <span className={cn("text-6xl font-black italic tracking-tighter transition-colors", flashEffect === 'red' ? "text-red-600" : flashEffect === 'green' ? "text-green-600" : "text-slate-950")}>{requestHours}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Horas</span>
                      </div>
                      <div className="mt-1 text-xl font-black text-primary italic tracking-tighter animate-in fade-in duration-300">
                        {formattedPrice}
                      </div>
                    </div>
                    <button type="button" onClick={() => handleAdjustHours(1)} className="w-14 h-14 rounded-2xl bg-white shadow-md text-slate-400 hover:text-green-500 transition-all active:scale-90 flex items-center justify-center"><Plus className="w-6 h-6" /></button>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">MÉTODO DE PAGO</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setPaymentMethod('cash')}
                    className={cn(
                      "flex flex-col items-center gap-3 p-5 rounded-[32px] border-2 transition-all duration-300",
                      paymentMethod === 'cash' ? "border-slate-900 bg-slate-900 text-white shadow-xl scale-[1.02]" : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    <Wallet className={cn("w-6 h-6", paymentMethod === 'cash' ? "text-primary" : "text-slate-300")} />
                    <span className="text-[9px] font-black uppercase tracking-widest italic">CONTRA ENTREGA</span>
                  </button>

                  <button 
                    onClick={() => setPaymentMethod('digital')}
                    className={cn(
                      "flex flex-col items-center gap-3 p-5 rounded-[32px] border-2 transition-all duration-300",
                      paymentMethod === 'digital' ? "border-primary bg-primary/10 text-primary shadow-xl scale-[1.02]" : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    <Globe className={cn("w-6 h-6", paymentMethod === 'digital' ? "text-primary" : "text-slate-300")} />
                    <span className="text-[9px] font-black uppercase tracking-widest italic">PAGO ONLINE</span>
                  </button>
                </div>

                {paymentMethod === 'digital' && (
                  <Button 
                    variant="outline"
                    className="w-full h-14 rounded-[24px] border-primary/20 bg-primary/5 text-primary font-black uppercase text-[10px] tracking-[0.2em] gap-3 animate-in slide-in-from-top-2"
                  >
                    <CreditCard className="w-4 h-4" /> INICIAR TRANSFERENCIA <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
                
                <div className="space-y-4 relative z-10">
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Estimado</p>
                    <h4 className="text-5xl font-black italic tracking-tighter leading-none text-white transition-all duration-300">
                      {formattedPrice}
                    </h4>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
                      <Wallet className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[9px] font-black uppercase italic">
                        {paymentMethod === 'cash' ? 'Pagas al recibir' : 'Liquidación Digital'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/20 border border-primary/30 rounded-full animate-pulse">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="text-[9px] font-black text-primary uppercase italic">Logística Pro Activa</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-4 relative z-10">
                  <div className="flex items-center gap-2 text-white/40">
                    <Info className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Detalles del Servicio</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><p className="text-[8px] font-black text-slate-500 uppercase">Valor Hora</p><p className="text-xs font-bold text-slate-200">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valHoraBase)}</p></div>
                    <div className="space-y-1"><p className="text-[8px] font-black text-slate-500 uppercase">Transporte</p><p className="text-xs font-bold text-green-400 uppercase">Incluido</p></div>
                    <div className="space-y-1"><p className="text-[8px] font-black text-slate-500 uppercase">Respuesta</p><p className="text-xs font-bold text-slate-200 uppercase">&lt; 15 Minutos</p></div>
                    <div className="space-y-1"><p className="text-[8px] font-black text-slate-500 uppercase">Garantía</p><p className="text-xs font-bold text-slate-200 uppercase">Total Pro</p></div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleWasherRequest} className="space-y-6">
                <Button 
                  type="submit" 
                  disabled={isSendingRequest || !isAnyStoreOpen} 
                  className={cn(
                    "w-full h-20 rounded-[32px] text-white font-black text-2xl uppercase italic tracking-tighter shadow-2xl transition-all gap-4",
                    isAnyStoreOpen ? "bg-primary active:scale-95 shadow-primary/20" : "bg-slate-300 cursor-not-allowed"
                  )}
                >
                  {isSendingRequest ? (
                    <Loader2 className="animate-spin" />
                  ) : isAnyStoreOpen ? (
                    <>CONFIRMAR SOLICITUD <CheckCircle2 className="w-8 h-8" /></>
                  ) : (
                    "NEGOCIO CERRADO"
                  )}
                </Button>
                {!isAnyStoreOpen && (
                  <div className="flex items-center justify-center gap-2 text-red-500 animate-pulse">
                    <Moon className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Sin vitrinas disponibles</span>
                  </div>
                )}
              </form>
              
              <p className="text-[8px] text-center text-slate-300 font-black uppercase tracking-[0.4em] pt-4">SISTEMA PROTEGIDO • VITRINIANDO AI KERNEL</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openStore} onOpenChange={setOpenStore}>
        <DialogContent className="rounded-[40px] border-none shadow-2xl p-8 sm:max-w-[500px] overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Inscribir mi tienda</DialogTitle>
            <DialogDescription>Ingresa los datos para registrar tu negocio en la plataforma.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onStoreSubmit} className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nombre de la tienda</Label>
              <Input name="name" placeholder="Ej: Mi Negocio Local" className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-base" required />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Categoría</Label>
              <select name="mainCategoryId" className="w-full h-14 rounded-2xl bg-slate-50 border-none px-5 font-bold text-base text-slate-900 appearance-none cursor-pointer" required>
                <option value="" disabled>Selecciona una categoría...</option>
                {mainCategories?.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Dirección Física</Label>
              <Input name="address" placeholder="Ubicación física" className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-base" required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Apertura</Label>
                <Input name="openTime" type="time" defaultValue="08:00" className="h-14 rounded-2xl bg-slate-50 border-none font-bold" required />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Cierre</Label>
                <Input name="closeTime" type="time" defaultValue="20:00" className="h-14 rounded-2xl bg-slate-50 border-none font-bold" required />
              </div>
            </div>

            <Button type="submit" disabled={isRegistering} className="w-full h-16 rounded-[24px] bg-slate-900 text-white font-black uppercase tracking-widest gap-3 shadow-xl">
              {isRegistering ? <Loader2 className="animate-spin" /> : "Guardar y crear tienda"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openAddWasherStore} onOpenChange={setOpenAddWasherStore}>
        <DialogContent className="max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 rounded-none border-none shadow-none bg-white p-0 overflow-hidden flex flex-col z-[650] [&>button:last-child]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Inscribir Alquiler</DialogTitle>
            <DialogDescription>Formulario de registro para flota de lavadoras en la plataforma.</DialogDescription>
          </DialogHeader>
          <div className="h-20 bg-slate-900 flex items-center justify-between px-6 shrink-0"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30"><StoreIcon className="w-6 h-6 text-green-500" /></div><div><h3 className="text-white font-black uppercase italic tracking-tighter text-xl leading-none">Mi Alquiler</h3><p className="text-green-500/60 text-[9px] font-black uppercase tracking-[0.3em] mt-1">Registro de Negocio</p></div></div><button onClick={() => setOpenAddWasherStore(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"><X className="w-6 h-6" /></button></div>
          <div className="flex-1 overflow-y-auto no-scrollbar p-6">
            <div className="max-w-md mx-auto py-10 space-y-10">
              <div className="text-center space-y-2"><h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Inscribir mi Alquiler</h2><p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Configura tu flota y comienza a facturar</p></div>
              <form onSubmit={handleCreateWasherStore} className="space-y-8">
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Nombre de la Tienda</Label><Input name="name" placeholder="Ej: Lavadoras El Sol" className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-lg" required /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">WhatsApp Comercial</Label><Input name="phone" defaultValue={profile?.phoneNumber || ''} placeholder="300 000 0000" className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-lg" required /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Dirección Base</Label><Input name="address" placeholder="Ubicación de tu flota" className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-lg" required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Apertura</Label><Input name="openTime" type="time" defaultValue="08:00" className="h-14 rounded-2xl bg-slate-50 border-none font-bold" required /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Cierre</Label><Input name="closeTime" type="time" defaultValue="20:00" className="h-14 rounded-2xl bg-slate-50 border-none font-bold" required /></div>
                </div>
                <Button type="submit" disabled={isSendingRequest} className="w-full h-20 rounded-[32px] bg-primary text-white font-black text-2xl uppercase italic tracking-tighter shadow-2xl gap-4">{isSendingRequest ? <Loader2 className="animate-spin" /> : "GUARDAR Y LANZAR"}</Button>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
