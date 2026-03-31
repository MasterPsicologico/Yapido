
"use client";

import { LayoutGrid, Store as StoreIcon, Plus, Loader2, ImageIcon, X, Sparkles, Camera, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
              <DialogDescription>Editor de la imagen de bienvenida de la aplicación.</DialogDescription>
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
      )}

      {/* CONTENEDOR REGISTRAR MI TIENDA */}
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
            <div className="absolute inset-0 z-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-1/3 h-full bg-white/20 blur-xl animate-shimmer" />
            </div>

            <div className="relative z-10 flex items-center justify-between w-full">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-[20px] bg-white/20 flex items-center justify-center group-hover:rotate-[10deg] transition-transform">
                  <StoreIcon className="w-7 h-7 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-black text-xl sm:text-lg uppercase tracking-tighter italic leading-none">Inscribir mi tienda</span>
                  <span className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Crea tu catálogo digital</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:translate-x-2 transition-transform">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </DialogTrigger>
        
        <DialogContent className="max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 rounded-none border-none shadow-none bg-white p-0 overflow-hidden flex flex-col z-[500] [&>button:last-child]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Inscribir mi tienda</DialogTitle>
            <DialogDescription>Formulario para registrar una nueva tienda en la plataforma.</DialogDescription>
          </DialogHeader>

          {/* Header Limpio y Profesional */}
          <div className="h-16 border-b flex items-center justify-between px-6 shrink-0 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                <Plus className="w-5 h-5" />
              </div>
              <h2 className="text-slate-900 font-black uppercase italic tracking-tight text-lg">Inscribir mi tienda</h2>
            </div>
            <button 
              onClick={() => setOpenStore(false)}
              className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50/30">
            <div className="max-w-md mx-auto px-6 py-10">
              <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 leading-tight">
                  Completa los datos
                </h1>
                <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest">Información de tu negocio</p>
              </div>

              <form onSubmit={onStoreSubmit} className="space-y-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre de la tienda</Label>
                  <Input 
                    name="name" 
                    className="h-14 rounded-2xl bg-white border border-slate-200 px-5 font-bold text-lg text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-primary/5 transition-all" 
                    placeholder="Ej: Mi Negocio" 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Categoría del negocio</Label>
                  <div className="relative">
                    <select 
                      name="mainCategoryId" 
                      required
                      defaultValue=""
                      className="w-full h-14 rounded-2xl bg-white border border-slate-200 px-5 font-bold text-base text-slate-900 focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Selecciona una categoría...</option>
                      {mainCategories?.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ArrowRight className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Dirección de entrega</Label>
                  <Input 
                    name="address" 
                    className="h-14 rounded-2xl bg-white border border-slate-200 px-5 font-bold text-base text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-primary/5 transition-all" 
                    placeholder="Calle, carrera o barrio..." 
                    required 
                  />
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full h-16 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 transition-all active:scale-95 gap-3" 
                    disabled={isRegistering || isCompressing}
                  >
                    {isRegistering ? (
                      <Loader2 className="animate-spin w-6 h-6" />
                    ) : (
                      <>Guardar y crear tienda</>
                    )}
                  </Button>
                  <p className="text-center text-[10px] font-bold text-slate-400 uppercase mt-6 italic">
                    Toda la información es privada y segura
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
