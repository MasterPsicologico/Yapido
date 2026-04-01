
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
  Edit3,
  LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth, useUser, useFirestore, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { cn } from '@/lib/utils';
import { collection, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

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
  isImageRemoved, setIsImageRemoved,
  isRegistering, isCompressing, onImageUpload, onCategorySubmit, onStoreSubmit
}: HomeActionsProps) {
  
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [openWasher, setOpenWasher] = useState(false);
  const [openAddWasherStore, setOpenAddWasherStore] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
      {/* BANNER ESPECIAL: ALQUILER DE LAVADORAS (100% ANCHO) */}
      <div className="relative w-full group">
        <div 
          onClick={() => { playClickSound(); setOpenWasher(true); }}
          className={cn(
            "relative w-full h-32 sm:h-40 overflow-hidden cursor-pointer transition-all duration-500",
            "bg-gradient-to-br from-primary via-blue-600 to-indigo-900",
            "flex items-center justify-between px-8 sm:px-12",
            "shadow-[0_20px_60px_-10px_rgba(59,130,246,0.5)] active:scale-[0.99]"
          )}
        >
          <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/seed/tech/1920/1080')] bg-cover mix-blend-overlay" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-white/20 transition-all duration-700" />
          
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[24px] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl group-hover:rotate-[15deg] transition-transform duration-500">
              <Waves className="w-10 h-10 text-white animate-pulse" />
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter text-white leading-none drop-shadow-lg">
                Alquiler de <br className="sm:hidden" /> Lavadoras
              </h2>
              <div className="flex items-center gap-2">
                <Badge className="bg-secondary text-white border-none font-black text-[10px] px-3 uppercase tracking-widest">SERVICIO EXPRESS</Badge>
                <span className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] hidden sm:inline">Solicitud Instantánea</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 hidden sm:flex flex-col items-end gap-2">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-primary shadow-xl group-hover:scale-110 transition-transform">
              <ArrowRight className="w-6 h-6" />
            </div>
            <span className="text-white/40 text-[8px] font-black uppercase tracking-[0.3em]">CLIC PARA PEDIR</span>
          </div>

          {/* BOTÓN REFINADO: ACCESO A VITRINAS (LAVADORA PULSANTE) */}
          <button 
            onClick={(e) => { e.stopPropagation(); router.push('/categories/category-washer'); }}
            className="absolute bottom-4 right-4 z-20 w-10 h-10 rounded-full bg-slate-900/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-slate-900/60 transition-all shadow-2xl group/list"
          >
            <div className="relative">
              {/* Pulsación Verde Sutil */}
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
              
              {/* Icono de Lavadora Inline SVG */}
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="w-5 h-5 text-white/80 group-hover/list:text-white transition-colors"
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

        <button 
          onClick={(e) => { e.stopPropagation(); setOpenAddWasherStore(true); }}
          className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all shadow-xl group/add"
          title="Inscribir mi alquiler de lavadoras"
        >
          <div className="relative">
            <StoreIcon className="w-4 h-4" />
            <Plus className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full text-white" />
          </div>
        </button>
      </div>

      {/* DIALOG SOLICITUD CLIENTE (LAVADORAS) */}
      <Dialog open={openWasher} onOpenChange={setOpenWasher}>
        <DialogContent className="max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 rounded-none border-none shadow-none bg-white p-0 overflow-hidden flex flex-col z-[600] [&>button:last-child]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Solicitar Lavadora</DialogTitle>
            <DialogDescription>Formulario instantáneo para alquiler.</DialogDescription>
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
            <DialogTitle>Inscribir Alquiler</DialogTitle>
            <DialogDescription>Crea tu propia vitrina de lavadoras.</DialogDescription>
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
