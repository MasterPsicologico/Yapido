
"use client";

import { Plus, Package, Loader2, ImageIcon, X } from 'lucide-react';
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
} from "@/components/ui/dialog";

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
        <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="w-full rounded-full gap-3 border-2 border-dashed border-primary/30 text-primary h-14 font-black text-sm uppercase tracking-widest hover:bg-primary/5 transition-all">
                    <Plus className="w-5 h-5" /> Nueva Sección
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle className="text-2xl font-black text-primary">Crear Sección</DialogTitle></DialogHeader>
                <form onSubmit={onAddCategory} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Nombre de la Sección</Label>
                        <Input name="name" placeholder="Ej: Panes" required />
                    </div>
                    <Button type="submit" className="w-full h-12 font-bold" disabled={isAddingCategory}>
                        {isAddingCategory ? <Loader2 className="animate-spin" /> : "Guardar Sección"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>

        <Dialog open={prodDialogOpen} onOpenChange={(v) => { setProdDialogOpen(v); if(!v) setProductImage(null); }}>
            <DialogTrigger asChild>
                <Button className="w-full rounded-full gap-3 bg-slate-900 hover:bg-slate-800 text-white h-14 font-black text-sm uppercase tracking-widest shadow-2xl transition-all">
                    <Package className="w-5 h-5" /> Publicar Ítem
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="text-2xl font-black italic">Nuevo Producto</DialogTitle></DialogHeader>
                <form onSubmit={onAddProduct} className="space-y-4 pt-4">
                    <div className="space-y-2"><Label>Nombre</Label><Input name="name" required /></div>
                    <div className="space-y-2">
                      <Label>Imagen</Label>
                      <div className="relative aspect-video rounded-xl bg-slate-100 border-2 border-dashed overflow-hidden">
                        {productImage ? (
                          <>
                            <Image src={productImage} alt="Preview" fill className="object-cover" />
                            <Button type="button" size="icon" variant="destructive" className="absolute top-2 right-2 h-8 w-8" onClick={() => setProductImage(null)}><X className="w-4 h-4" /></Button>
                          </>
                        ) : (
                          <label className="flex flex-col items-center justify-center h-full cursor-pointer">
                            <ImageIcon className="w-8 h-8 text-slate-400" />
                            <input type="file" className="hidden" accept="image/*" onChange={onProductImageUpload} />
                          </label>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2"><Label>Precio</Label><Input name="price" type="number" required /></div>
                    <div className="space-y-2">
                        <Label>Sección</Label>
                        <select name="categoryId" className="w-full h-12 rounded-lg border px-3" required>
                            <option value="">Selecciona sección...</option>
                            {categories?.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2"><Label>Descripción</Label><Textarea name="description" required /></div>
                    <Button type="submit" className="w-full h-12 font-bold" disabled={isAddingProduct || isCompressingProduct}>
                        {isAddingProduct ? <Loader2 className="animate-spin" /> : "Publicar"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    </div>
  );
}
