
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
  Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUser, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { cn } from '@/lib/utils';
import { collection, serverTimestamp, doc, setDoc } from 'firebase/firestore';
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

export function HomeActions({
  isAdmin, profile, openCategory, setOpenCategory, openStore, setOpenStore,
  editingCategory, mainCategories, base64Image, setBase64Image,
  isRegistering, isCompressing, onImageUpload, onCategorySubmit, onStoreSubmit
}: HomeActionsProps) {
  
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  
  // ESTADOS DE DIÁLOGOS
  const [openWasher, setOpenWasher] = useState(false);
  const [openAddWasherStore, setOpenAddWasherStore] = useState(false);
  const [showAdminPricing, setShowAdminPricing] = useState(false);

  // ESTADOS DE FORMULARIO LAVADORA
  const [requestHours, setRequestHours] = useState(5);
  const [tempAddress, setTempAddress] = useState("");
  const [tempPhone, setTempPhone] = useState("");
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // CARGAR CONFIGURACIÓN DE PRECIOS Y PORTADA
  const pricingRef = useMemoFirebase(() => doc(firestore, 'appConfig', 'washer_pricing'), [firestore]);
  const { data: pricingConfig } = useDoc(pricingRef);

  const bannerConfigRef = useMemoFirebase(() => doc(firestore, 'appConfig', 'washer_banner'), [firestore]);
  const { data: bannerConfig } = useDoc(bannerConfigRef);

  // VALORES POR DEFECTO DE NEGOCIO
  const minHours = pricingConfig?.minHours || 5;
  const basePrice = pricingConfig?.basePrice || 15000;
  const additionalHourPrice = pricingConfig?.additionalHourPrice || 3000;

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2568-preview.mp3');
    audioRef.current.volume = 0.3;
  }, []);

  useEffect(() => {
    if (openWasher && profile) {
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
    if (requestHours <= minHours) return basePrice;
    return basePrice + ((requestHours - minHours) * additionalHourPrice);
  }, [requestHours, minHours, basePrice, additionalHourPrice]);

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
      toast({ title: "Precios de comisión actualizados" });
      setShowAdminPricing(false);
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleWasherRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !firestore) return;
    setIsSendingRequest(true);
    
    try {
      // 1. SINCRONIZACIÓN INSTANTÁNEA DE PERFIL
      const userRef = doc(firestore, 'users', user.uid);
      const profileUpdates: any = {};
      if (tempAddress !== profile?.address) profileUpdates.address = tempAddress;
      if (tempPhone !== profile?.phoneNumber) profileUpdates.phoneNumber = tempPhone;
      
      if (Object.keys(profileUpdates).length > 0) {
        updateDocumentNonBlocking(userRef, { ...profileUpdates, updatedAt: serverTimestamp() });
      }

      // 2. CREACIÓN DE LA SOLICITUD
      const requestData = {
        customerId: user.uid,
        customerName: profile?.displayName || user.displayName || 'Cliente',
        customerPhone: tempPhone,
        customerAddress: tempAddress,
        type: 'WASHER_RENTAL_REQUEST',
        status: 'pending',
        requestHours,
        totalPrice,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        participants: [user.uid, 'ADMIN_WASHER_POOL'],
        isLogisticsPublic: true,
        productName: `Alquiler de Lavadora (${requestHours}h)`,
      };

      await addDocumentNonBlocking(collection(firestore, 'orders'), requestData);
      toast({ 
        title: "¡Solicitud Lanzada!", 
        description: "Un proveedor te contactará en breve.",
        className: "bg-green-600 text-white border-none"
      });
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
        id: storeRef.id, ownerId: user.uid, name: fd.get('name'), phoneNumber: fd.get('phone'), address: fd.get('address'),
        mainCategoryId: 'category-washer', type: 'washer_rental', status: 'active', createdAt: serverTimestamp(),
        imageUrl: `https://picsum.photos/seed/${storeRef.id}/800/600`, driverCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        privateDrivers: []
      });
      if (profile?.role !== 'admin') updateDocumentNonBlocking(doc(firestore, 'users', user.uid), { role: 'dueño', updatedAt: serverTimestamp() });
      toast({ title: "¡Vitrina de Lavadoras Lista!" });
      setOpenAddWasherStore(false);
      router.push(`/admin/washer/${storeRef.id}`);
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsSendingRequest(false);
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* BANNER FULL SCREEN REFINADO */}
      <div className="relative w-full group">
        <div 
          onClick={() => { playClickSound(); setOpenWasher(true); }}
          className="relative w-full min-h-[calc(100dvh-64px)] overflow-hidden cursor-pointer flex flex-col items-center justify-center px-6 text-center bg-[#0a0a0a] active:scale-[0.99] transition-all duration-500"
        >
          {/* Portada Universal */}
          <div className="absolute inset-0 z-0">
            {bannerConfig?.backgroundImage ? (
              <Image src={bannerConfig.backgroundImage} alt="Portada" fill className="object-cover" priority />
            ) : (
              <div className="absolute inset-0 opacity-40 bg-[url('https://picsum.photos/seed/wash/1920/1080')] bg-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-12 animate-in fade-in zoom-in duration-700">
            {/* BOTÓN SOLICITAR: MÁS PEQUEÑO Y BAJO */}
            <div className="mt-20 group/cta">
              <div className="bg-red-600/80 hover:bg-red-600 backdrop-blur-md text-white px-8 py-4 rounded-full font-black text-lg uppercase italic tracking-tighter shadow-[0_10px_30px_rgba(220,38,38,0.4)] border border-white/10 flex items-center gap-3 transition-all hover:scale-105 active:scale-95">
                <CheckCircle2 className="w-6 h-6 text-white drop-shadow-sm" />
                SOLICITAR AHORA
              </div>
              <div className="flex flex-col items-center gap-2 mt-4 opacity-60">
                <span className="text-white text-[8px] font-black uppercase tracking-[0.4em]">Toca para iniciar solicitud</span>
                <div className="h-0.5 w-10 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 animate-progress-loading" />
                </div>
              </div>
            </div>
          </div>

          {/* BOTONES EXTREMOS */}
          {isAdmin && (
            <div className="absolute top-4 left-4 z-30">
              <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={handleBannerUpload} />
              <button onClick={(e) => { e.stopPropagation(); bannerInputRef.current?.click(); }} disabled={isUploadingBanner} className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:text-primary transition-all">
                {isUploadingBanner ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              </button>
            </div>
          )}

          <button onClick={(e) => { e.stopPropagation(); setOpenAddWasherStore(true); }} className="absolute top-4 right-4 z-30 w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:text-green-400 transition-all">
            <StoreIcon className="w-5 h-5" />
          </button>

          <button onClick={(e) => { e.stopPropagation(); router.push('/categories/category-washer'); }} className="absolute bottom-4 right-4 z-30 w-12 h-12 rounded-full bg-slate-950/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:bg-slate-950/60 transition-all shadow-2xl">
            <div className="relative"><div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" /><Waves className="w-6 h-6 text-white/90" /></div>
          </button>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-30 animate-bounce"><ChevronDown className="w-5 h-5 text-white" /></div>
        </div>
      </div>

      {/* DIALOG NUEVA SOLICITUD (DISEÑO REFERENCIA) */}
      <Dialog open={openWasher} onOpenChange={setOpenWasher}>
        <DialogContent className="max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 rounded-none border-none shadow-none bg-[#0a0a0a] p-0 overflow-hidden flex flex-col z-[600] animate-in slide-in-from-bottom duration-500 [&>button:last-child]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Nueva Solicitud Alquiler</DialogTitle>
            <DialogDescription>Formulario de solicitud express.</DialogDescription>
          </DialogHeader>
          
          <div className="h-20 bg-slate-950 flex items-center justify-between px-6 shrink-0 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 text-primary"><Waves className="w-6 h-6" /></div>
              <div><h3 className="text-white font-black uppercase italic tracking-tighter text-2xl leading-none">NUEVA SOLICITUD</h3><p className="text-primary/60 text-[9px] font-black uppercase tracking-[0.3em] mt-1">ALQUILER DE LAVADORAS</p></div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && <button onClick={() => setShowAdminPricing(!showAdminPricing)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-primary transition-all"><Settings2 className="w-5 h-5" /></button>}
              <button onClick={() => setOpenWasher(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"><X className="w-6 h-6" /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar bg-white rounded-t-[40px] mt-2">
            <div className="max-w-md mx-auto space-y-10 py-12 px-6">
              {/* ADMIN PRICING PANEL */}
              {showAdminPricing && isAdmin && (
                <form onSubmit={handleUpdatePricing} className="bg-slate-900 p-6 rounded-[32px] text-white space-y-4 animate-in slide-in-from-top-4 duration-300">
                  <h4 className="text-xs font-black uppercase tracking-widest text-primary italic">Ajustes Maestro de Precios</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><Label className="text-[8px] uppercase">Mínimo Horas</Label><Input name="minHours" type="number" defaultValue={minHours} className="bg-white/5 border-none h-10 font-bold" /></div>
                    <div className="space-y-1"><Label className="text-[8px] uppercase">Precio Base ($)</Label><Input name="basePrice" type="number" defaultValue={basePrice} className="bg-white/5 border-none h-10 font-bold" /></div>
                  </div>
                  <div className="space-y-1"><Label className="text-[8px] uppercase">Precio Hora Adicional ($)</Label><Input name="additionalHourPrice" type="number" defaultValue={additionalHourPrice} className="bg-white/5 border-none h-10 font-bold" /></div>
                  <Button type="submit" className="w-full bg-primary font-black uppercase text-[10px]">GUARDAR CAMBIOS</Button>
                </form>
              )}

              <div className="bg-blue-50/50 p-8 rounded-[40px] border border-blue-100 flex items-start gap-5">
                <ShieldCheck className="w-8 h-8 text-primary shrink-0" />
                <p className="text-slate-600 text-sm font-bold italic leading-snug">"Confirmemos la dirección para enviarte la lavadora más cercana."</p>
              </div>

              <form onSubmit={handleWasherRequest} className="space-y-10">
                {/* ITEMS EDITABLES CON DISEÑO REFERENCIA */}
                <div className="space-y-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">DIRECCIÓN DE ENTREGA</lebel>
                    <div className="relative group">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-primary shadow-sm"><MapPin className="w-5 h-5" /></div>
                      <Input value={tempAddress} onChange={(e) => setTempAddress(e.target.value)} className="h-20 rounded-[32px] border-none shadow-[0_10px_40px_rgba(0,0,0,0.03)] pl-20 font-black text-slate-800 text-lg bg-slate-50/30 focus:bg-white transition-all" required />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-[0.2em]">WHATSAPP</lebel>
                    <div className="relative group">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500 shadow-sm"><Zap className="w-5 h-5" /></div>
                      <Input value={tempPhone} onChange={(e) => setTempPhone(e.target.value)} className="h-20 rounded-[32px] border-none shadow-[0_10px_40px_rgba(0,0,0,0.03)] pl-20 font-black text-slate-800 text-lg bg-slate-50/30 focus:bg-white transition-all" required />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-50">
                    <div className="flex items-center justify-between px-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">TIEMPO DE ALQUILER</lebel>
                      <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black px-3 py-1">MIN. {minHours} HORAS</Badge>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-[32px]">
                      <Button type="button" onClick={() => setRequestHours(Math.max(minHours, requestHours - 1))} variant="ghost" className="w-14 h-14 rounded-2xl bg-white shadow-sm font-black text-xl">-</Button>
                      <div className="flex-1 text-center">
                        <span className="text-4xl font-black italic text-slate-900 tracking-tighter">{requestHours}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 italic">Horas</span>
                      </div>
                      <Button type="button" onClick={() => setRequestHours(requestHours + 1)} variant="ghost" className="w-14 h-14 rounded-2xl bg-white shadow-sm font-black text-xl">+</Button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-6 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cotización Estimada</span>
                    <div className="flex items-center gap-2 text-primary">
                      <Wallet className="w-4 h-4" />
                      <span className="text-xs font-black uppercase italic">Pagas al recibir</span>
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total a pagar</p>
                      <h4 className="text-4xl font-black italic tracking-tighter leading-none">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalPrice)}</h4>
                    </div>
                    <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1 italic">Logística Pro Activa</p>
                  </div>
                </div>

                <Button type="submit" disabled={isSendingRequest} className="w-full h-24 rounded-[40px] bg-primary text-white font-black text-2xl uppercase italic tracking-tighter shadow-[0_20px_50px_rgba(59,130,246,0.3)] active:scale-95 transition-all gap-4">
                  {isSendingRequest ? <Loader2 className="animate-spin" /> : <>LANZAR SOLICITUD <CheckCircle2 className="w-8 h-8" /></>}
                </Button>
                
                <p className="text-[8px] text-center text-slate-300 font-black uppercase tracking-[0.4em] pt-4">SISTEMA PROTEGIDO • VITRINIANDO AI KERNEL</p>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG INSCRIBIR TIENDA ESTÁNDAR */}
      <Dialog open={openStore} onOpenChange={setOpenStore}>
        <DialogContent className="rounded-[40px] border-none shadow-2xl p-8 sm:max-w-[500px] overflow-y-auto max-h-[90vh]">
          <DialogHeader><DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Inscribir mi tienda</DialogTitle></DialogHeader>
          <form onSubmit={onStoreSubmit} className="space-y-6 pt-6">
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nombre de la tienda</Label><Input name="name" placeholder="Ej: Mi Negocio Local" className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-base" required /></div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Categoría</Label>
              <select name="mainCategoryId" className="w-full h-14 rounded-2xl bg-slate-50 border-none px-5 font-bold text-base text-slate-900 appearance-none cursor-pointer" required>
                <option value="" disabled>Selecciona una categoría...</option>
                {mainCategories?.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Dirección</Label><Input name="address" placeholder="Ubicación física" className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-base" required /></div>
            <Button type="submit" disabled={isRegistering} className="w-full h-16 rounded-[24px] bg-slate-900 text-white font-black uppercase tracking-widest gap-3 shadow-xl">
              {isRegistering ? <Loader2 className="animate-spin" /> : "Guardar y crear tienda"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG INSCRIBIR TIENDA DE LAVADORAS */}
      <Dialog open={openAddWasherStore} onOpenChange={setOpenAddWasherStore}>
        <DialogContent className="max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 rounded-none border-none shadow-none bg-white p-0 overflow-hidden flex flex-col z-[650] [&>button:last-child]:hidden">
          <DialogHeader className="sr-only"><DialogTitle>Inscribir Alquiler</DialogTitle></DialogHeader>
          <div className="h-20 bg-slate-900 flex items-center justify-between px-6 shrink-0"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30"><StoreIcon className="w-6 h-6 text-green-500" /></div><div><h3 className="text-white font-black uppercase italic tracking-tighter text-xl leading-none">Mi Alquiler</h3><p className="text-green-500/60 text-[9px] font-black uppercase tracking-[0.3em] mt-1">Registro de Negocio</p></div></div><button onClick={() => setOpenAddWasherStore(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"><X className="w-6 h-6" /></button></div>
          <div className="flex-1 overflow-y-auto no-scrollbar p-6"><div className="max-w-md mx-auto py-10 space-y-10"><div className="text-center space-y-2"><h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Inscribir mi Alquiler</h2><p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Configura tu flota y comienza a facturar</p></div><form onSubmit={handleCreateWasherStore} className="space-y-8"><div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Nombre de la Tienda</Label><Input name="name" placeholder="Ej: Lavadoras El Sol" className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-lg" required /></div><div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">WhatsApp Comercial</Label><Input name="phone" defaultValue={profile?.phoneNumber || ''} placeholder="300 000 0000" className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-lg" required /></div><div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Dirección Base</Label><Input name="address" placeholder="Ubicación de tu flota" className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-lg" required /></div><Button type="submit" disabled={isSendingRequest} className="w-full h-20 rounded-[32px] bg-primary text-white font-black text-2xl uppercase italic tracking-tighter shadow-2xl gap-4">{isSendingRequest ? <Loader2 className="animate-spin" /> : "GUARDAR Y LANZAR"}</Button></form></div></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
