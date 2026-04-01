
"use client";

import { useState, useRef, useEffect } from 'react';
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
  ArrowRight,
  ImageIcon,
  Sparkles,
  ChevronDown,
  Camera
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
  isImageRemoved?: boolean;
  setIsImageRemoved?: (v: boolean) => void;
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
  const [openWasher, setOpenWasher] = useState(false);
  const [openAddWasherStore, setOpenAddWasherStore] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // OBTENER CONFIGURACIÓN DE PORTADA DE LAVADORAS DESDE LA NUBE
  const bannerConfigRef = useMemoFirebase(() => doc(firestore, 'appConfig', 'washer_banner'), [firestore]);
  const { data: bannerConfig } = useDoc(bannerConfigRef);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    audioRef.current.volume = 0.4;
  }, []);

  const playClickSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isAdmin) return;

    setIsUploadingBanner(true);
    try {
      const compressed = await compressImage(file, 1920, 1080, 0.8);
      
      // Guardar en la nube instantáneamente
      if (bannerConfig) {
        updateDocumentNonBlocking(bannerConfigRef, {
          backgroundImage: compressed,
          updatedAt: serverTimestamp(),
          updatedBy: user?.uid
        });
      } else {
        setDocumentNonBlocking(bannerConfigRef, {
          backgroundImage: compressed,
          createdAt: serverTimestamp(),
          updatedBy: user?.uid
        }, { merge: true });
      }
      
      toast({ title: "Portada de Lavadoras actualizada" });
    } catch (error) {
      toast({ title: "Error al actualizar portada", variant: "destructive" });
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleWasherRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !firestore) return;
    setIsSendingRequest(true);
    
    const fd = new FormData(e.currentTarget);
    const requestData = {
      customerId: user.uid,
      customerName: profile?.displayName || user.displayName || 'Cliente',
      customerPhone: profile?.phoneNumber || '',
      customerAddress: fd.get('address') || profile?.address || '',
      type: 'WASHER_RENTAL_REQUEST',
      status: 'pending',
      details: fd.get('details'),
      createdAt: serverTimestamp(),
      participants: [user.uid, 'ADMIN_WASHER_POOL'],
      isLogisticsPublic: true,
      productName: 'Alquiler de Lavadora',
      totalPrice: 0 
    };

    try {
      const ordersRef = collection(firestore, 'orders');
      await addDocumentNonBlocking(ordersRef, requestData);
      toast({ title: "¡Solicitud Enviada!", description: "Un encargado de lavadoras te contactará pronto." });
      setOpenWasher(false);
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleCreateWasherStore = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !firestore) return;
    setIsSendingRequest(true);

    const fd = new FormData(e.currentTarget);
    const name = fd.get('name') as string;
    const phone = fd.get('phone') as string;
    const address = fd.get('address') as string;

    try {
      const storeRef = doc(collection(firestore, 'stores'));
      await setDoc(storeRef, {
        id: storeRef.id,
        ownerId: user.uid,
        name,
        phoneNumber: phone,
        address,
        mainCategoryId: 'category-washer',
        type: 'washer_rental',
        status: 'active',
        createdAt: serverTimestamp(),
        imageUrl: `https://picsum.photos/seed/${storeRef.id}/800/600`,
        driverCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        privateDrivers: []
      });

      if (profile?.role !== 'admin' && profile?.role !== 'moderador') {
        const userRef = doc(firestore, 'users', user.uid);
        updateDocumentNonBlocking(userRef, { role: 'dueño', updatedAt: serverTimestamp() });
      }

      toast({ title: "¡Vitrina de Lavadoras Creada!", description: "Ahora puedes gestionar tu flota." });
      setOpenAddWasherStore(false);
      
      router.push(`/admin/washer/${storeRef.id}`);
    } catch (e) {
      toast({ title: "Error al crear vitrina", variant: "destructive" });
    } finally {
      setIsSendingRequest(false);
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* BANNER FULL SCREEN: ALQUILER DE LAVADORAS */}
      <div className="relative w-full group">
        <div 
          onClick={() => { playClickSound(); setOpenWasher(true); }}
          className={cn(
            "relative w-full min-h-[calc(100dvh-64px)] overflow-hidden cursor-pointer transition-all duration-700",
            "bg-slate-900",
            "flex flex-col items-center justify-center px-6 text-center",
            "active:scale-[0.995]"
          )}
        >
          {/* Portada en la Nube con Máxima Vibrancia */}
          <div className="absolute inset-0 z-0">
            {bannerConfig?.backgroundImage ? (
              <Image 
                src={bannerConfig.backgroundImage} 
                alt="Portada Alquiler" 
                fill 
                className="object-cover opacity-100 animate-in fade-in duration-1000" 
                priority 
              />
            ) : (
              <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/seed/wash/1920/1080')] bg-cover" />
            )}
            {/* Overlay sutil para legibilidad sin matar el color */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
          </div>

          {/* Efectos de Iluminación Dinámica */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/30 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] animate-pulse delay-700" />
          
          {/* Contenedor de Textos y Badges */}
          <div className="relative z-10 space-y-10 max-w-4xl animate-in zoom-in duration-700">
            <div className="flex flex-col items-center gap-6">
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Badge className="bg-[#00c9db] text-white border-none shadow-2xl font-black text-sm sm:text-base px-8 py-3 uppercase tracking-[0.2em] italic">SERVICIO EXPRESS</Badge>
                <Badge variant="outline" className="text-white border-white/60 backdrop-blur-2xl font-black text-sm sm:text-base px-8 py-3 uppercase tracking-[0.2em] shadow-2xl">GARANTÍA TOTAL</Badge>
              </div>
              
              {/* BOTÓN DE ACCIÓN ROJO: SOLICITAR AHORA */}
              <div className="mt-4 flex flex-col items-center gap-4 group/cta">
                <div className="bg-red-600 hover:bg-red-500 text-white px-12 py-5 rounded-[28px] font-black text-2xl uppercase italic tracking-tighter shadow-[0_20px_60px_rgba(220,38,38,0.5)] border-4 border-white/20 flex items-center gap-4 transition-all hover:scale-105 active:scale-95 animate-pulse">
                  <CheckCircle2 className="w-8 h-8 text-white drop-shadow-md" />
                  SOLICITAR AHORA
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-1 w-8 bg-red-500 rounded-full" />
                  <span className="text-white/80 text-[10px] font-black uppercase tracking-[0.4em]">Toca en cualquier parte</span>
                  <div className="h-1 w-8 bg-red-500 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Indicador de Scroll Inferior */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 animate-bounce">
            <ChevronDown className="w-6 h-6 text-white/40" />
          </div>

          {/* BOTONES EN EXTREMOS: MÁXIMA PEGADA A LOS BORDES */}
          {isAdmin && (
            <div className="absolute top-4 left-4 z-30 flex flex-col items-center gap-2">
              <input 
                type="file" 
                ref={bannerInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleBannerUpload} 
              />
              <button 
                onClick={(e) => { e.stopPropagation(); bannerInputRef.current?.click(); }}
                disabled={isUploadingBanner}
                className="w-14 h-14 rounded-[22px] bg-white/10 backdrop-blur-2xl border border-white/30 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-2xl active:scale-90"
              >
                {isUploadingBanner ? <Loader2 className="w-7 h-7 animate-spin" /> : <Camera className="w-7 h-7 text-primary" />}
              </button>
              <span className="text-[7px] font-black text-white/40 uppercase tracking-[0.3em] bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">PORTADA</span>
            </div>
          )}

          {/* Botón: Inscribir Mi Tienda (Superior Derecho) */}
          <button 
            onClick={(e) => { e.stopPropagation(); setOpenAddWasherStore(true); }}
            className="absolute top-4 right-4 z-30 w-14 h-14 rounded-[22px] bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/30 transition-all shadow-2xl active:scale-90"
          >
            <div className="relative">
              <StoreIcon className="w-7 h-7" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center shadow-lg">
                <Plus className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
          </button>

          {/* Botón: Directorio de Vitrinas (Inferior Derecho) */}
          <button 
            onClick={(e) => { e.stopPropagation(); router.push('/categories/category-washer'); }}
            className="absolute bottom-4 right-4 z-30 w-16 h-16 rounded-full bg-slate-950/60 backdrop-blur-3xl border border-white/20 flex items-center justify-center text-white hover:bg-slate-950/80 transition-all shadow-2xl active:scale-90"
          >
            <div className="relative">
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.8)]" />
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinecap="round" 
                className="w-8 h-8 text-white/90"
              >
                <rect x="3" y="2" width="18" height="20" rx="2" ry="2"></rect>
                <circle cx="12" cy="13" r="5"></circle>
                <line x1="7" y1="5" x2="7.01" y2="5"></line>
                <line x1="11" y1="5" x2="11.01" y2="5"></line>
                <line x1="15" y1="5" x2="15.01" y2="5"></line>
              </svg>
            </div>
          </button>
        </div>
      </div>

      {/* DIALOG SOLICITUD CLIENTE (LAVADORAS) */}
      <Dialog open={openWasher} onOpenChange={setOpenWasher}>
        <DialogContent className="max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 rounded-none border-none shadow-none bg-white p-0 overflow-hidden flex flex-col z-[600] [&>button:last-child]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Nueva Solicitud de Alquiler</DialogTitle>
            <DialogDescription>Formulario para solicitar una lavadora.</DialogDescription>
          </DialogHeader>
          <div className="h-20 bg-slate-950 flex items-center justify-between px-6 shrink-0 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30"><Waves className="w-6 h-6 text-primary" /></div>
              <div><h3 className="text-white font-black uppercase italic tracking-tighter text-xl leading-none">Nueva Solicitud</h3><p className="text-primary/60 text-[9px] font-black uppercase tracking-[0.3em] mt-1">Alquiler de Lavadoras</p></div>
            </div>
            <button onClick={() => setOpenWasher(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"><X className="w-6 h-6" /></button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50/30 p-6">
            <div className="max-w-md mx-auto space-y-8 py-10">
              <div className="bg-blue-50 p-6 rounded-[32px] border border-blue-100 flex items-start gap-4">
                <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
                <p className="text-slate-600 text-sm font-bold italic leading-tight">"Hola {profile?.displayName || 'Usuario'}, tus datos están listos. Solo confirma dónde la llevamos."</p>
              </div>
              <form onSubmit={handleWasherRequest} className="space-y-6">
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Dirección de entrega</Label><div className="relative"><MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" /><Input name="address" defaultValue={profile?.address || ''} className="h-16 rounded-[24px] border-none shadow-sm pl-14 font-black" required /></div></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">WhatsApp</Label><div className="bg-green-50 p-5 rounded-[24px] border border-green-100 flex items-center gap-4"><Zap className="w-5 h-5 text-green-500" /><span className="font-black text-slate-700">{profile?.phoneNumber || 'No registrado'}</span></div></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Detalles</Label><Textarea name="details" className="min-h-[120px] rounded-[24px] font-bold p-5" placeholder="¿Alguna instrucción especial?" /></div>
                <Button type="submit" disabled={isSendingRequest || !profile?.phoneNumber} className="w-full h-20 rounded-[32px] bg-primary text-white font-black text-2xl uppercase italic tracking-tighter shadow-2xl active:scale-95 gap-4">
                  {isSendingRequest ? <Loader2 className="animate-spin" /> : <><CheckCircle2 className="w-8 h-8" /> SOLICITAR AHORA</>}
                </Button>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG INSCRIBIR TIENDA DE LAVADORAS */}
      <Dialog open={openAddWasherStore} onOpenChange={setOpenAddWasherStore}>
        <DialogContent className="max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 rounded-none border-none shadow-none bg-white p-0 overflow-hidden flex flex-col z-[650] [&>button:last-child]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Inscribir Alquiler de Lavadoras</DialogTitle>
            <DialogDescription>Configuración de nueva vitrina de lavadoras.</DialogDescription>
          </DialogHeader>
          <div className="h-20 bg-slate-900 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center border border-green-500/30"><StoreIcon className="w-6 h-6 text-green-500" /></div>
              <div><h3 className="text-white font-black uppercase italic tracking-tighter text-xl leading-none">Mi Alquiler</h3><p className="text-green-500/60 text-[9px] font-black uppercase tracking-[0.3em] mt-1">Registro de Negocio</p></div>
            </div>
            <button onClick={() => setOpenAddWasherStore(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"><X className="w-6 h-6" /></button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar p-6">
            <div className="max-w-md mx-auto py-10 space-y-10">
              <div className="text-center space-y-2">
                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Inscribir mi Alquiler</h2>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Configura tu flota y comienza a facturar</p>
              </div>
              <form onSubmit={handleCreateWasherStore} className="space-y-8">
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Nombre de la Tienda</Label><Input name="name" placeholder="Ej: Lavadoras El Sol" className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-lg" required /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">WhatsApp Comercial</Label><Input name="phone" defaultValue={profile?.phoneNumber || ''} placeholder="300 000 0000" className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-lg" required /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Dirección Base</Label><Input name="address" placeholder="Ubicación de tu flota" className="h-16 rounded-[24px] bg-slate-50 border-none font-black text-lg" required /></div>
                <div className="bg-slate-900 p-6 rounded-[32px] text-white space-y-3">
                  <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em]">REGLAS DE PLATAFORMA</p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-[11px] font-bold uppercase"><CheckCircle2 className="w-4 h-4 text-green-500" /> Comisión: 5% por transacción</li>
                    <li className="flex items-center gap-2 text-[11px] font-bold uppercase"><CheckCircle2 className="w-4 h-4 text-green-500" /> Repartidores: Podrás vincular tu propia flota</li>
                  </ul>
                </div>
                <Button type="submit" disabled={isSendingRequest} className="w-full h-20 rounded-[32px] bg-primary text-white font-black text-2xl uppercase italic tracking-tighter shadow-2xl gap-4">
                  {isSendingRequest ? <Loader2 className="animate-spin" /> : "GUARDAR Y LANZAR"}
                </Button>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG INSCRIBIR TIENDA ESTÁNDAR */}
      <Dialog open={openStore} onOpenChange={setOpenStore}>
        <DialogContent className="rounded-[40px] border-none shadow-2xl p-8 sm:max-w-[500px] overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Inscribir mi tienda</DialogTitle>
            <DialogDescription className="text-slate-400 font-medium">Datos de la tienda para comenzar a vender.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onStoreSubmit} className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nombre de la tienda</Label>
              <Input name="name" placeholder="Ej: Mi Negocio Local" className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-base" required />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Categoría</Label>
              <select 
                name="mainCategoryId" 
                defaultValue=""
                className="w-full h-14 rounded-2xl bg-slate-50 border-none px-5 font-bold text-base text-slate-900 focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                required
              >
                <option value="" disabled>Selecciona una categoría...</option>
                {mainCategories?.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Dirección</Label>
              <Input name="address" placeholder="Ubicación física" className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-base" required />
            </div>
            <Button type="submit" disabled={isRegistering} className="w-full h-16 rounded-[24px] bg-slate-900 text-white font-black uppercase tracking-widest gap-3 shadow-xl hover:scale-[1.02] transition-all">
              {isRegistering ? <Loader2 className="animate-spin" /> : "Guardar y crear tienda"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG EDITAR CATEGORÍA (ADMIN) */}
      <Dialog open={openCategory} onOpenChange={setOpenCategory}>
        <DialogContent className="rounded-[40px] border-none shadow-2xl p-8 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-primary">
              {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-medium italic">Define los detalles de la categoría global.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onCategorySubmit} className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nombre</Label>
              <Input name="name" defaultValue={editingCategory?.name} className="h-14 rounded-2xl bg-slate-50 border-none font-bold" required />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Foto Principal</Label>
              <div className="relative aspect-video rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden group hover:border-primary/50 transition-colors">
                {base64Image ? (
                  <>
                    <img src={base64Image} alt="Preview" className="w-full h-full object-cover" />
                    <Button type="button" size="icon" variant="destructive" className="absolute top-3 right-3 rounded-full h-10 w-10 shadow-lg" onClick={() => setBase64Image(null)}><X /></Button>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-slate-100 transition-all">
                    <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-2">{isCompressing ? <Loader2 className="animate-spin text-primary" /> : <ImageIcon className="text-slate-400" />}</div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subir Banner</span>
                    <input type="file" className="hidden" accept="image/*" onChange={onImageUpload} disabled={isCompressing} />
                  </label>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Descripción</Label>
              <Textarea name="description" defaultValue={editingCategory?.description} className="rounded-2xl bg-slate-50 border-none min-h-[100px] font-medium" required />
            </div>
            <Button type="submit" disabled={isRegistering || isCompressing} className="w-full h-16 rounded-[24px] bg-primary text-white font-black uppercase tracking-widest shadow-xl">
              {isRegistering ? <Loader2 className="animate-spin" /> : <><Sparkles className="w-5 h-5 mr-2" /> Guardar Categoría</>}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
