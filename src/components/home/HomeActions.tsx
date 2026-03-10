
"use client";

import { LayoutGrid, Store as StoreIcon, Plus, Loader2, ImageIcon, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from 'next/image';

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
  
  const currentPreviewImage = base64Image || (isImageRemoved ? null : editingCategory?.imageUrl);

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
      {/* Botón de Categoría: Solo visible para el ADMIN */}
      {isAdmin && (
        <Dialog open={openCategory} onOpenChange={setOpenCategory}>
          <DialogTrigger asChild>
            <Button variant="outline" className="rounded-full h-12 px-6 gap-2 border-primary/20 hover:bg-primary/5 text-primary font-bold w-full sm:w-auto">
              <LayoutGrid className="w-4 h-4" /> Categoría Pro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic">{editingCategory ? "Editar" : "Crear"} Categoría</DialogTitle>
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

      <Dialog open={openStore} onOpenChange={setOpenStore}>
        <DialogTrigger asChild>
          <Button className="rounded-full h-12 px-8 gap-2 bg-primary hover:bg-primary/90 text-white font-black shadow-lg w-full sm:w-auto">
            <StoreIcon className="w-4 h-4" /> Registrar Mi Vitrina
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader><DialogTitle className="text-2xl font-black">Lanza tu Negocio</DialogTitle></DialogHeader>
          <form onSubmit={onStoreSubmit} className="space-y-4 pt-4">
            <div className="space-y-2"><Label>Nombre del Negocio</Label><Input name="name" required /></div>
            <div className="space-y-2">
              <Label>Categoría Global</Label>
              <Select name="mainCategoryId" required>
                <SelectTrigger className="h-12"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                <SelectContent>{mainCategories?.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Dirección</Label><Input name="address" required /></div>
            <Button type="submit" className="w-full h-14 font-black text-lg bg-secondary shadow-lg" disabled={isRegistering || isCompressing}>
              {isRegistering ? <Loader2 className="animate-spin" /> : <Sparkles className="mr-2" />} Registrar Mi Vitrina
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
