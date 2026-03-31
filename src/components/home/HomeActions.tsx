
"use client";

import { LayoutGrid, Store as StoreIcon, Plus, Loader2, ImageIcon, X, Sparkles, Camera, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from 'next/image';
import { UnauthenticatedLanding } from './UnauthenticatedLanding';
import { useAuth, useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { useRef, useEffect } from 'react';

interface HomeActionsProps {
  isAdmin: boolean;
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
  isAdmin, openCategory, setOpenCategory, openStore, setOpenStore,
  editingCategory, mainCategories, base64Image, setBase64Image,
  isImageRemoved, setIsImageRemoved,
  isRegistering, isCompressing, onImageUpload, onCategorySubmit, onStoreSubmit
}: HomeActionsProps) {
  
  const auth = useAuth();
  const { user } = useUser();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Sonido Premium de Clic Digital
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    audioRef.current.volume = 0.4;
  }, []);

  const playClickSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const currentPreviewImage = base64Image || (isImageRemoved ? null : editingCategory?.imageUrl);

  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full px-4 sm:px-0">
      {/* Botón de Gestión de Portada: Solo para ADMIN */}
      {isAdmin && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="rounded-full h-12 px-6 gap-2 border-primary/20 hover:bg-primary/5 text-primary font-bold w-full sm:w-auto transition-all active:scale-95 shrink-0">
              <Camera className="w-4 h-4" /> Portada App
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl p-0 overflow-hidden border-none bg-black">
            <DialogHeader className="sr-only">
              <DialogTitle>Gestión de Portada</DialogTitle>
              <DialogDescription>Editor de la imagen de bienvenida de la aplicación para el administrador.</DialogDescription>
            </DialogHeader>
            <div className="h-[70vh]">
              <UnauthenticatedLanding auth={auth} isAdmin={true} user={user} isEditor={true} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Botón de Categoría: Solo visible para el ADMIN */}
      {isAdmin && (
        <Dialog open={openCategory} onOpenChange={setOpenCategory}>
          <DialogTrigger asChild>
            <Button variant="outline" className="rounded-full h-12 px-6 gap-2 border-primary/20 hover:bg-primary/5 text-primary font-bold w-full sm:w-auto transition-all active:scale-95 shrink-0">
              <LayoutGrid className="w-4 h-4" /> Categoría Pro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic">{editingCategory ? "Editar" : "Crear"} Categoría</DialogTitle>
              <DialogDescription>Configura los detalles de la categoría global para el marketplace.</DialogDescription>
            </DialogHeader>
            <form onSubmit={onCategorySubmit} className="space-y-4 pt-4">
              <div className="space-y-2"><Label>Nombre de la Categoría Global</Label><Input name="name" defaultValue={editingCategory?.name} required /></div>
              <div className="space-y-2">
                <Label>Imagen Representativa</Label>
                <div className="relative aspect-video rounded-xl bg-slate-100 border-2 border-dashed overflow-hidden">
                  {currentPreviewImage ? (
                    <>
                      <Image src={currentPreviewImage} alt="Preview" fill className="object-cover" />
                      <Button 
                        type="button" 
                        size="icon" 
                        variant="destructive" 
                        className="absolute top-2 right-2 h-8 w-8 rounded-full" 
                        onClick={() => {
                          setBase64Image(null);
                          if(setIsImageRemoved) setIsImageRemoved(true);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-full cursor-pointer">
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                      <input type="file" className="hidden" accept="image/*" onChange={onImageUpload} />
                    </label>
                  )}
                </div>
              </div>
              <div className="space-y-2"><Label>Descripción Estratégica</Label><Textarea name="description" defaultValue={editingCategory?.description} required /></div>
              <Button type="submit" className="w-full h-12 font-bold" disabled={isRegistering || isCompressing}>{isRegistering ? <Loader2 className="animate-spin" /> : <Plus className="mr-2" />} Guardar Categoría</Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* CONTENEDOR REGISTRAR MI VITRINA: EXPERIENCIA FULL-SCREEN */}
      <Dialog open={openStore} onOpenChange={setOpenStore}>
        <DialogTrigger asChild>
          <div 
            onClick={playClickSound}
            className={cn(
              "relative overflow-hidden group cursor-pointer",
              "w-full h-24 sm:h-20 rounded-[32px] sm:rounded-full",
              "bg-gradient-to-r from-primary via-blue-500 to-primary bg-[length:200%_auto]",
              "shadow-[0_20px_50px_-10px_rgba(59,130,246,0.4)] hover:shadow-[0_30px_70px_-10px_rgba(59,130,246,0.6)]",
              "transition-all duration-500 active:scale-[0.98] animate-gradient",
              "border border-white/10 flex items-center px-8"
            )}
          >
            {/* Efecto de Brillo (Shimmer) */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-1/3 h-full bg-white/20 blur-xl animate-shimmer" />
            </div>

            <div className="relative z-10 flex items-center justify-between w-full">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-[20px] bg-white/20 flex items-center justify-center group-hover:rotate-[10deg] transition-transform">
                  <StoreIcon className="w-7 h-7 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-black text-xl sm:text-lg uppercase tracking-tighter italic leading-none">Registrar Mi Vitrina</span>
                  <span className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Lanza tu catálogo hoy</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-2 transition-transform">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </DialogTrigger>
        
        <DialogContent className="max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 rounded-none border-none shadow-none bg-white p-0 overflow-hidden flex flex-col z-[500] [&>button:last-child]:hidden">
          {/* Header Inmersivo */}
          <div className="h-20 bg-slate-950 flex items-center justify-between px-6 sm:px-10 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <StoreIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-white font-black italic uppercase tracking-tighter text-xl leading-none">Inscripción Élite</h2>
                <p className="text-primary/60 text-[9px] font-black uppercase tracking-[0.3em] mt-1">Vitriniando Business v1.0</p>
              </div>
            </div>
            <button 
              onClick={() => setOpenStore(false)}
              className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar bg-[#f8fafc]">
            <div className="max-w-xl mx-auto px-6 py-12 sm:py-20">
              <div className="space-y-2 mb-12">
                <h1 className="text-5xl font-black italic uppercase tracking-tighter text-slate-900 leading-[0.85]">
                  Lanza tu <br /> Negocio
                </h1>
                <div className="h-1.5 w-20 bg-primary rounded-full mt-4" />
              </div>

              <form onSubmit={onStoreSubmit} className="space-y-10">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4">Nombre Comercial</Label>
                  <Input 
                    name="name" 
                    className="h-20 rounded-[28px] bg-white border-none shadow-xl shadow-slate-200/50 px-8 font-black text-2xl text-slate-900 placeholder:text-slate-200 focus:ring-8 focus:ring-primary/5 transition-all" 
                    placeholder="Escribe tu marca..." 
                    required 
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4">Categoría Global</Label>
                  <Select name="mainCategoryId" required>
                    <SelectTrigger className="h-20 rounded-[28px] bg-white border-none shadow-xl shadow-slate-200/50 px-8 font-black text-xl text-slate-900 focus:ring-8 focus:ring-primary/5 transition-all">
                      <SelectValue placeholder="Selecciona una especialidad..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-[28px] border-none shadow-2xl p-2">
                      {mainCategories?.map(cat => (
                        <SelectItem key={cat.id} value={cat.id} className="rounded-2xl h-14 font-black uppercase italic tracking-tighter text-lg">
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4">Dirección de Despacho</Label>
                  <Input 
                    name="address" 
                    className="h-20 rounded-[28px] bg-white border-none shadow-xl shadow-slate-200/50 px-8 font-black text-lg text-slate-900 placeholder:text-slate-200 focus:ring-8 focus:ring-primary/5 transition-all" 
                    placeholder="Ej: Calle 5 con Carrera 20" 
                    required 
                  />
                </div>

                <div className="pt-6">
                  <Button 
                    type="submit" 
                    className="w-full h-24 rounded-[36px] font-black text-2xl bg-slate-950 hover:bg-black text-white shadow-2xl transition-all hover:scale-[1.02] active:scale-95 gap-4 group" 
                    disabled={isRegistering || isCompressing}
                  >
                    {isRegistering ? (
                      <Loader2 className="animate-spin w-8 h-8" />
                    ) : (
                      <>
                        <Sparkles className="w-8 h-8 text-yellow-400 group-hover:rotate-12 transition-transform" /> 
                        REGISTRAR AHORA
                      </>
                    )}
                  </Button>
                  <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] mt-6 italic">
                    Al registrarte aceptas los protocolos de servicio de Vitriniando
                  </p>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
