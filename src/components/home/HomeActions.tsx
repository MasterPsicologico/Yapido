"use client";

import { LayoutGrid, Store as StoreIcon, Plus, Loader2, ImageIcon, X, Sparkles, Camera } from 'lucide-react';
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
    <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto px-4 sm:px-0">
      {/* Botón de Gestión de Portada: Solo para ADMIN */}
      {isAdmin && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="rounded-full h-12 px-6 gap-2 border-primary/20 hover:bg-primary/5 text-primary font-bold w-full sm:w-auto transition-all active:scale-95">
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
            <Button variant="outline" className="rounded-full h-12 px-6 gap-2 border-primary/20 hover:bg-primary/5 text-primary font-bold w-full sm:w-auto transition-all active:scale-95">
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

      {/* BOTÓN REGISTRAR MI VITRINA: DISEÑO ULTRA PREMIUM */}
      <Dialog open={openStore} onOpenChange={setOpenStore}>
        <DialogTrigger asChild>
          <Button 
            onClick={playClickSound}
            className={cn(
              "relative overflow-hidden group",
              "w-full sm:w-[280px] h-16 sm:h-14 rounded-full",
              "bg-gradient-to-r from-primary via-blue-500 to-primary bg-[length:200%_auto]",
              "text-white font-black text-lg sm:text-base uppercase tracking-widest italic",
              "shadow-[0_10px_30px_-5px_rgba(59,130,246,0.4)] hover:shadow-[0_20px_50px_-5px_rgba(59,130,246,0.6)]",
              "transition-all duration-500 active:scale-95 animate-gradient",
              "border border-white/10"
            )}
          >
            {/* Efecto de Brillo (Shimmer) */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-1/3 h-full bg-white/20 blur-xl animate-shimmer" />
            </div>

            <div className="relative z-10 flex items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-[15deg] transition-transform">
                <StoreIcon className="w-4 h-4 text-white" />
              </div>
              <span>Registrar Mi Vitrina</span>
            </div>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px] rounded-[40px] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">Lanza tu Negocio</DialogTitle>
            <DialogDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-1">Sincronización con Marketplace Local</DialogDescription>
          </DialogHeader>
          <form onSubmit={onStoreSubmit} className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Nombre Comercial</Label>
              <Input name="name" className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-lg" placeholder="Ej: Café El Morrocoy" required />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Categoría Global</Label>
              <Select name="mainCategoryId" required>
                <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold"><SelectValue placeholder="Selecciona una especialidad..." /></SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-xl">{mainCategories?.map(cat => <SelectItem key={cat.id} value={cat.id} className="rounded-xl h-12 font-bold">{cat.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Dirección de Despacho</Label>
              <Input name="address" className="h-14 rounded-2xl bg-slate-50 border-none font-bold" placeholder="Ej: Calle 5 con Carrera 20" required />
            </div>
            <Button type="submit" className="w-full h-18 rounded-[28px] font-black text-xl bg-slate-900 hover:bg-black text-white shadow-2xl transition-all gap-3 mt-4" disabled={isRegistering || isCompressing}>
              {isRegistering ? <Loader2 className="animate-spin" /> : <><Sparkles className="w-6 h-6 text-yellow-400" /> REGISTRAR AHORA</>}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}