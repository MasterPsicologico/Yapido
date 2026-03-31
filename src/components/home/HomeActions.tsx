"use client";

import { useState, useRef, useEffect } from 'react';
import { 
  LayoutGrid, 
  Store as StoreIcon, 
  Plus, 
  Loader2, 
  ImageIcon, 
  X, 
  Sparkles, 
  Camera, 
  ArrowRight,
  Waves,
  ShieldCheck,
  Zap,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { UnauthenticatedLanding } from './UnauthenticatedLanding';
import { useAuth, useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { cn } from '@/lib/utils';
import { doc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

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
  
  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();
  const [openWasher, setOpenWasher] = useState(false);
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
      totalPrice: 0 // Se define en la negociación o panel
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

  return (
    <div className="flex flex-col w-full">
      {/* BANNER ESPECIAL: ALQUILER DE LAVADORAS (100% ANCHO) */}
      <Dialog open={openWasher} onOpenChange={setOpenWasher}>
        <DialogTrigger asChild>
          <div 
            onClick={() => { playClickSound(); setOpenWasher(true); }}
            className={cn(
              "relative w-full h-32 sm:h-40 overflow-hidden cursor-pointer group select-none transition-all duration-500",
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
          </div>
        </DialogTrigger>

        <DialogContent className="max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 rounded-none border-none shadow-none bg-white p-0 overflow-hidden flex flex-col z-[600] [&>button:last-child]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Solicitar Lavadora</DialogTitle>
            <DialogDescription>Formulario instantáneo para alquiler.</DialogDescription>
          </DialogHeader>

          <div className="h-20 bg-slate-950 flex items-center justify-between px-6 shrink-0 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                <Waves className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-white font-black uppercase italic tracking-tighter text-xl leading-none">Nueva Solicitud</h3>
                <p className="text-primary/60 text-[9px] font-black uppercase tracking-[0.3em] mt-1">Alquiler de Lavadoras</p>
              </div>
            </div>
            <button 
              onClick={() => setOpenWasher(false)}
              className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50/30">
            <div className="max-w-md mx-auto px-6 py-12 space-y-10">
              <div className="bg-blue-50 border border-blue-100 p-6 rounded-[32px] space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-3 text-primary font-black uppercase text-[10px] tracking-widest">
                  <ShieldCheck className="w-4 h-4" /> Perfil Verificado
                </div>
                <p className="text-slate-600 text-sm font-bold italic leading-snug">
                  "Hola {profile?.displayName || 'Usuario'}, hemos pre-llenado tus datos para que el alquiler sea inmediato."
                </p>
              </div>

              <form onSubmit={handleWasherRequest} className="space-y-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Ubicación de entrega</Label>
                  <div className="relative">
                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    <Input 
                      name="address"
                      defaultValue={profile?.address || ''}
                      className="h-16 rounded-[24px] bg-white border border-slate-200 pl-14 font-black text-lg shadow-sm focus:ring-4 focus:ring-primary/5 transition-all"
                      placeholder="¿A qué dirección la llevamos?"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">WhatsApp de contacto</Label>
                  <div className="bg-green-50 p-5 rounded-[24px] border border-green-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <Zap className="w-5 h-5 text-green-500" />
                      </div>
                      <span className="font-black text-slate-700 text-lg">{profile?.phoneNumber || 'No registrado'}</span>
                    </div>
                    {!profile?.phoneNumber && (
                      <span className="text-[10px] font-black text-red-500 animate-pulse">REGÍSTRALO EN TU PERFIL</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Detalles adicionales</Label>
                  <Textarea 
                    name="details"
                    className="min-h-[120px] rounded-[24px] border border-slate-200 font-bold p-5 focus:ring-4 focus:ring-primary/5 transition-all"
                    placeholder="Ej: Necesito que llegue después de las 2pm..."
                  />
                </div>

                <div className="pt-6">
                  <Button 
                    type="submit" 
                    disabled={isSendingRequest || !profile?.phoneNumber}
                    className="w-full h-20 rounded-[32px] bg-primary hover:bg-primary/90 text-white font-black text-2xl uppercase italic tracking-tighter shadow-2xl shadow-primary/30 transition-all active:scale-95 gap-4"
                  >
                    {isSendingRequest ? <Loader2 className="w-8 h-8 animate-spin" /> : <><CheckCircle2 className="w-8 h-8" /> SOLICITAR AHORA</>}
                  </Button>
                  <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mt-8">
                    Vitriniando Seguro • Tecnología Morrocoyera
                  </p>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* OTROS CONTROLES ADMIN */}
      <div className="px-4 sm:px-8 mt-6 flex flex-col sm:flex-row gap-4">
        {isAdmin && (
          <>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-full h-12 px-6 gap-2 border-primary/20 hover:bg-primary/5 text-primary font-bold w-full sm:w-auto shrink-0">
                  <Camera className="w-4 h-4" /> Portada App
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl p-0 overflow-hidden border-none bg-black">
                <DialogHeader className="sr-only">
                  <DialogTitle>Gestión de Portada</DialogTitle>
                  <DialogDescription>Editor de la imagen de bienvenida.</DialogDescription>
                </DialogHeader>
                <div className="h-[70vh]">
                  <UnauthenticatedLanding auth={auth} isAdmin={true} user={user} isEditor={true} />
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={openCategory} onOpenChange={setOpenCategory}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-full h-12 px-6 gap-2 border-primary/20 hover:bg-primary/5 text-primary font-bold w-full sm:w-auto shrink-0">
                  <LayoutGrid className="w-4 h-4" /> Nueva Categoría
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black italic">{editingCategory ? "Editar" : "Crear"} Categoría</DialogTitle>
                  <DialogDescription>Configura los detalles de la categoría global.</DialogDescription>
                </DialogHeader>
                <form onSubmit={onCategorySubmit} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Nombre de la Categoría</Label>
                    <Input name="name" defaultValue={editingCategory?.name} placeholder="Ej: Restaurantes" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Imagen</Label>
                    <div className="relative aspect-video rounded-xl bg-slate-100 border-2 border-dashed overflow-hidden">
                      {base64Image || (!isImageRemoved && editingCategory?.imageUrl) ? (
                        <>
                          <Image src={base64Image || editingCategory?.imageUrl} alt="Preview" fill className="object-cover" />
                          <Button type="button" size="icon" variant="destructive" className="absolute top-2 right-2 h-8 w-8 rounded-full" onClick={() => { setBase64Image(null); if(setIsImageRemoved) setIsImageRemoved(true); }}><X className="w-4 h-4" /></Button>
                        </>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-full cursor-pointer">
                          <ImageIcon className="w-8 h-8 text-slate-400" />
                          <input type="file" className="hidden" accept="image/*" onChange={onImageUpload} />
                        </label>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea name="description" defaultValue={editingCategory?.description} placeholder="Breve descripción..." required />
                  </div>
                  <Button type="submit" className="w-full h-12 font-bold" disabled={isRegistering || isCompressing}>
                    {isRegistering ? <Loader2 className="animate-spin" /> : <Plus className="mr-2" />} Guardar
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}