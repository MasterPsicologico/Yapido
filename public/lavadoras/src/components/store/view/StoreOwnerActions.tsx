
"use client";

import { Plus, Package, Loader2, ImageIcon, X, LayoutGrid, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { collection, serverTimestamp, doc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase';
import { toast } from '@/hooks/use-toast';

interface StoreOwnerActionsProps {
  catDialogOpen: boolean;
  setCatDialogOpen: (v: boolean) => void;
  prodDialogOpen: boolean;
  setProdDialogOpen: (v: boolean) => void;
  isAddingCategory: boolean;
  isAddingProduct: boolean;
  isCompressingProduct: boolean;
  productImage: string | null;
  setProductImage: (v: string | null) => void;
  categories: any[] | null;
  onAddCategory: (e: React.FormEvent<HTMLFormElement>) => void;
  onAddProduct: (e: React.FormEvent<HTMLFormElement>) => void;
  onProductImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function StoreOwnerActions({
  catDialogOpen, setCatDialogOpen,
  prodDialogOpen, setProdDialogOpen,
  isAddingCategory, isAddingProduct, isCompressingProduct,
  productImage, setProductImage,
  categories, onAddCategory, onAddProduct, onProductImageUpload
}: StoreOwnerActionsProps) {
  return (
    <div className="flex flex-col gap-4 pt-4">
        {/* Diálogo de Nueva Sección */}
        <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="w-full rounded-full gap-3 border-2 border-dashed border-primary/30 text-primary h-14 font-black text-sm uppercase tracking-widest hover:bg-primary/5 transition-all">
                    <Plus className="w-5 h-5" /> Nueva Sección
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[32px] sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black text-primary flex items-center gap-2 italic">
                    <LayoutGrid className="w-6 h-6" /> Crear Sección
                  </DialogTitle>
                  <DialogDescription>
                    Organiza tus productos por grupos (Ej: Bebidas, Postres, Especiales).
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={onAddCategory} className="space-y-6 pt-4">
                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Nombre de la Sección</Label>
                        <Input 
                          name="name" 
                          placeholder="Ej: Menú de Hoy" 
                          className="h-12 bg-slate-50 border-none focus:ring-2 focus:ring-primary/20"
                          required 
                        />
                    </div>
                    <Button type="submit" className="w-full h-14 font-black text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-95" disabled={isAddingCategory}>
                        {isAddingCategory ? <Loader2 className="animate-spin" /> : <><Sparkles className="mr-2 w-5 h-5" /> Lanzar Sección</>}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>

        {/* Diálogo de Nuevo Producto */}
        <Dialog open={prodDialogOpen} onOpenChange={(v) => { setProdDialogOpen(v); if(!v) setProductImage(null); }}>
            <DialogTrigger asChild>
                <Button className="w-full rounded-full gap-3 bg-slate-900 hover:bg-slate-800 text-white h-14 font-black text-sm uppercase tracking-widest shadow-2xl transition-all active:scale-95">
                    <Package className="w-5 h-5" /> Publicar Ítem
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[32px] sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black italic flex items-center gap-2">
                    <Package className="w-6 h-6 text-secondary" /> Nuevo Producto
                  </DialogTitle>
                  <DialogDescription>
                    Agrega un nuevo tesoro a tu vitrina digital.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={onAddProduct} className="space-y-6 pt-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Nombre del Producto</Label>
                      <Input name="name" className="h-12 bg-slate-50 border-none" placeholder="Ej: Hamburguesa Especial" required />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Imagen del Producto</Label>
                      <div className="relative aspect-video rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden group hover:border-primary/50 transition-colors">
                        {productImage ? (
                          <>
                            <Image src={productImage} alt="Preview" fill className="object-cover" />
                            <Button 
                              type="button" 
                              size="icon" 
                              variant="destructive" 
                              className="absolute top-3 right-3 h-10 w-10 rounded-full shadow-lg" 
                              onClick={() => setProductImage(null)}
                            >
                              <X className="w-5 h-5" />
                            </Button>
                          </>
                        ) : (
                          <label className="flex flex-col items-center justify-center h-full cursor-pointer transition-all hover:bg-slate-100">
                            <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
                              {isCompressingProduct ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : <ImageIcon className="w-6 h-6 text-slate-400" />}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subir Foto Real</span>
                            <input type="file" className="hidden" accept="image/*" onChange={onProductImageUpload} disabled={isCompressingProduct} />
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Precio (COP)</Label>
                        <Input name="price" type="number" className="h-12 bg-slate-50 border-none" placeholder="0" required />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Sección</Label>
                        <select 
                          name="categoryId" 
                          className="w-full h-12 rounded-lg border-none bg-slate-50 px-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 appearance-none" 
                          required
                        >
                            <option value="">Selecciona...</option>
                            {categories?.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Descripción Irresistible</Label>
                      <Textarea 
                        name="description" 
                        placeholder="Describe el sabor, tamaño o ingredientes..." 
                        className="bg-slate-50 border-none min-h-[100px] rounded-2xl" 
                        required 
                      />
                    </div>

                    <Button type="submit" className="w-full h-16 font-black text-xl bg-slate-900 hover:bg-slate-800 shadow-2xl transition-all active:scale-95" disabled={isAddingProduct || isCompressingProduct}>
                        {isAddingProduct ? <Loader2 className="animate-spin" /> : <><Sparkles className="mr-2 w-6 h-6 text-yellow-400" /> Publicar en Vitrina</>}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    </div>
  );
}
