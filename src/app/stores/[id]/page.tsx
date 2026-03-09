
"use client";

import { useState, useRef } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { ProductCard } from '@/components/product/ProductCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  MapPin, 
  Plus, 
  Package, 
  Loader2, 
  ArrowLeft, 
  Image as ImageIcon, 
  X, 
  Store as StoreIcon, 
  ChevronRight,
  MessageCircle,
  Zap,
  Tag,
  Clock,
  Camera,
  Edit2
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/image-compression';
import { cn } from '@/lib/utils';

export default function StorePage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useUser();
  const firestore = useFirestore();

  const storeRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'stores', id);
  }, [firestore, id]);
  
  const { data: store, isLoading: loadingStore } = useDoc(storeRef);

  const categoriesQuery = useMemoFirebase(() => {
    if (!id) return null;
    return query(collection(firestore, 'stores', id, 'categories'));
  }, [firestore, id]);
  
  const { data: categories, isLoading: loadingCategories } = useCollection(categoriesQuery);

  const [activeTab, setActiveTab] = useState("all");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isCompressingProduct, setIsCompressingProduct] = useState(false);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [prodDialogOpen, setProdDialogOpen] = useState(false);
  const [productImage, setProductImage] = useState<string | null>(null);
  
  // Estados para edición de imágenes de la tienda
  const [updatingImage, setUpdatingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const highlightInputRef = useRef<HTMLInputElement>(null);
  const [activeHighlightIndex, setActiveHighlightIndex] = useState<number | null>(null);

  if (loadingStore) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <main className="flex-1">
          <Skeleton className="h-[40vh] w-full" />
          <div className="container mx-auto px-4 -mt-20">
            <Skeleton className="h-64 w-full rounded-[40px]" />
          </div>
        </main>
      </div>
    );
  }

  if (!store && !loadingStore) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center p-4">
        <Navbar />
        <div className="text-center space-y-4">
          <StoreIcon className="w-16 h-16 mx-auto text-muted-foreground opacity-20" />
          <h2 className="text-2xl font-bold italic text-slate-400">Vitrina no encontrada</h2>
          <Link href="/">
            <Button className="rounded-full bg-primary font-bold">Volver al Inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.uid === store?.ownerId;

  const handleUpdateStoreImage = async (e: React.ChangeEvent<HTMLInputElement>, field: string, index?: number) => {
    const file = e.target.files?.[0];
    if (!file || !storeRef) return;

    const loadingId = index !== undefined ? `highlight-${index}` : 'main';
    setUpdatingImage(loadingId);
    
    try {
      const compressed = await compressImage(file, 1200, 1200, 0.85);
      
      if (index !== undefined) {
        const currentHighlights = store?.highlights || [
          `https://picsum.photos/seed/highlight-0-${id}/300/300`,
          `https://picsum.photos/seed/highlight-1-${id}/300/300`,
          `https://picsum.photos/seed/highlight-2-${id}/300/300`
        ];
        const newHighlights = [...currentHighlights];
        newHighlights[index] = compressed;
        updateDocumentNonBlocking(storeRef, { highlights: newHighlights, updatedAt: serverTimestamp() });
      } else {
        updateDocumentNonBlocking(storeRef, { [field]: compressed, updatedAt: serverTimestamp() });
      }

      toast({ title: "¡Actualizado!", description: "La vitrina se ve genial ahora." });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo actualizar la imagen.", variant: "destructive" });
    } finally {
      setUpdatingImage(null);
    }
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressingProduct(true);
      try {
        const compressed = await compressImage(file, 1200, 1200, 0.85);
        setProductImage(compressed);
        toast({ title: "Imagen lista", description: "Foto del producto optimizada." });
      } catch (error) {
        toast({ title: "Error", description: "No se pudo procesar la imagen.", variant: "destructive" });
      } finally {
        setIsCompressingProduct(false);
      }
    }
  };

  async function handleAddCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isOwner || !user || !id) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;

    setIsAddingCategory(true);
    try {
      const catRef = doc(collection(firestore, 'stores', id, 'categories'));
      const catData = {
        id: catRef.id,
        storeId: id,
        storeOwnerId: user.uid,
        name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      setDocumentNonBlocking(catRef, catData, { merge: true });
      toast({ title: "Categoría creada" });
      setCatDialogOpen(false);
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsAddingCategory(false);
    }
  }

  async function handleAddProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isOwner || !user || !id) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const price = Number(formData.get('price'));
    const description = formData.get('description') as string;
    const categoryId = formData.get('categoryId') as string;

    setIsAddingProduct(true);
    try {
      const prodRef = doc(collection(firestore, 'stores', id, 'categories', categoryId, 'products'));
      const prodData = {
        id: prodRef.id,
        storeId: id,
        storeOwnerId: user.uid,
        productCategoryId: categoryId,
        name,
        price,
        description,
        imageUrl: productImage || `https://picsum.photos/seed/${prodRef.id}/600/400`,
        status: 'available',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      setDocumentNonBlocking(prodRef, prodData, { merge: true });
      
      const globalProdRef = doc(firestore, 'products', prodRef.id);
      setDocumentNonBlocking(globalProdRef, {
        ...prodData,
        storeName: store?.name || 'Tienda'
      }, { merge: true });

      toast({ title: "Producto publicado" });
      setProdDialogOpen(false);
      setProductImage(null);
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsAddingProduct(false);
    }
  }

  const highlightImages = store?.highlights || [
    `https://picsum.photos/seed/highlight-0-${id}/300/300`,
    `https://picsum.photos/seed/highlight-1-${id}/300/300`,
    `https://picsum.photos/seed/highlight-2-${id}/300/300`
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f3f4f6]">
      <Navbar />
      
      <main className="flex-1 pb-20">
        <div className="relative h-[48vh] w-full">
          <Image 
            src={store?.imageUrl || 'https://picsum.photos/seed/bakery/1920/1080'} 
            alt={store?.name || 'Vitriniando'} 
            fill 
            className="object-cover" 
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent"></div>
          
          {/* Botón edición imagen principal */}
          {isOwner && (
            <div className="absolute top-6 right-6 z-30">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => handleUpdateStoreImage(e, 'imageUrl')} 
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={updatingImage === 'main'}
                className="rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 text-white border border-white/30 h-11 px-4 gap-2 font-bold shadow-xl"
              >
                {updatingImage === 'main' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                Cambiar Portada
              </Button>
            </div>
          )}

          <div className="absolute top-6 left-6 z-30">
            <Link href="/">
              <Button size="icon" variant="secondary" className="rounded-full bg-white/95 shadow-lg border-none w-11 h-11">
                <ArrowLeft className="w-5 h-5 text-slate-700" />
              </Button>
            </Link>
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center pt-10">
             <div className="relative w-48 h-48 drop-shadow-2xl animate-in fade-in zoom-in duration-700">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-24 h-24 mx-auto bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 mb-2">
                            <StoreIcon className="w-12 h-12 text-white" />
                        </div>
                        <h2 className="text-white font-black text-2xl uppercase tracking-tighter drop-shadow-md">
                            {store?.name}
                        </h2>
                    </div>
                </div>
             </div>
          </div>
        </div>

        <div className="container mx-auto max-w-xl px-0 -mt-24 relative z-20">
          <div className="bg-white rounded-t-[45px] shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.2)] overflow-hidden">
            <div className="p-8 md:p-10 space-y-10">
              
              <div className="space-y-4">
                <Badge className="bg-[#00c9db] hover:bg-[#00b5c5] text-white rounded-full px-5 py-1.5 text-xs font-bold border-none">
                  {store?.category || 'Alimentos'}
                </Badge>
                <h1 className="text-[38px] font-black text-slate-900 leading-tight tracking-tight">
                    {store?.name}
                </h1>
                <p className="text-[#6b7280] text-[17px] leading-snug font-medium max-w-[90%]">
                  {store?.description}
                </p>
              </div>

              {/* Grid de Imágenes Destacadas */}
              <div className="grid grid-cols-3 gap-3 overflow-x-auto no-scrollbar">
                <input 
                  type="file" 
                  ref={highlightInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => activeHighlightIndex !== null && handleUpdateStoreImage(e, 'highlights', activeHighlightIndex)} 
                />
                {highlightImages.map((img: string, i: number) => (
                    <div key={i} className="relative aspect-square rounded-[22px] overflow-hidden shadow-sm group">
                        <Image 
                            src={img} 
                            alt={`Destacado ${i}`} 
                            fill 
                            className="object-cover"
                        />
                        {isOwner && (
                          <button 
                            onClick={() => { setActiveHighlightIndex(i); highlightInputRef.current?.click(); }}
                            disabled={updatingImage === `highlight-${i}`}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                          >
                            {updatingImage === `highlight-${i}` ? <Loader2 className="w-6 h-6 animate-spin" /> : <Edit2 className="w-6 h-6" />}
                          </button>
                        )}
                    </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 px-1">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-11 h-11 rounded-full bg-[#fef3c7] flex items-center justify-center shadow-sm">
                        <Tag className="w-5 h-5 text-[#d97706]" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 text-center leading-[1.1]">Promociones<br/>diarias</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-11 h-11 rounded-full bg-[#ffedd5] flex items-center justify-center shadow-sm">
                        <Zap className="w-5 h-5 text-[#ea580c]" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 text-center leading-[1.1]">Productos<br/>frescos</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-11 h-11 rounded-full bg-[#ecfdf5] flex items-center justify-center shadow-sm">
                        <Clock className="w-5 h-5 text-[#059669]" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 text-center leading-[1.1]">Domicilios<br/>rápidos</span>
                </div>
              </div>

              <div className="bg-[#f5f2eb] rounded-[32px] p-6 space-y-4 border border-[#e5e7eb]/40">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-[#1f2937]" />
                        <span className="text-[#1f2937] font-bold text-lg">{store?.phoneNumber || '+57 300 123 4567'}</span>
                    </div>
                    <Button size="sm" className="bg-[#f59e0b] hover:bg-[#d97706] text-white rounded-full font-bold h-10 px-6 gap-2 border-none">
                        Llamar ahora <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-[#1f2937] mt-1 shrink-0" />
                        <div className="flex flex-col">
                            <span className="text-[#4b5563] text-sm font-medium leading-tight">
                                {store?.address || 'Calle Central, Aguachica'}
                            </span>
                            <span className="text-[#9ca3af] text-[10px] uppercase font-bold mt-0.5 tracking-wider">Aguachica, Cesar</span>
                        </div>
                    </div>
                    <Button size="sm" variant="outline" className="rounded-full font-bold h-10 px-6 gap-2 border-none bg-white text-[#1f2937] shadow-sm">
                        <MessageCircle className="w-4 h-4 text-[#22c55e]" /> WhatsApp
                    </Button>
                </div>
              </div>

              {isOwner && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" className="rounded-full gap-2 border border-dashed border-primary/40 text-primary h-12 font-black text-xs uppercase tracking-widest hover:bg-primary/5">
                                <Plus className="w-4 h-4" /> Nueva Sección
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black text-primary">Crear Sección</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleAddCategory} className="space-y-4 pt-4">
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
                            <Button className="rounded-full gap-2 bg-slate-900 hover:bg-slate-800 text-white h-12 font-black text-xs uppercase tracking-widest shadow-xl">
                                <Package className="w-4 h-4" /> Publicar Ítem
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black italic">Nuevo Producto</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleAddProduct} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Nombre</Label>
                                    <Input name="name" placeholder="Ej: Pan de Queso" required />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label>Imagen del Producto</Label>
                                  <div className="flex flex-col gap-3">
                                    {isCompressingProduct ? (
                                      <div className="aspect-video rounded-xl bg-muted animate-pulse flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                      </div>
                                    ) : productImage ? (
                                      <div className="relative aspect-video rounded-xl overflow-hidden border">
                                        <Image src={productImage} alt="Preview" fill className="object-cover" />
                                        <Button 
                                          type="button" 
                                          variant="destructive" 
                                          size="icon" 
                                          className="absolute top-2 right-2 rounded-full w-8 h-8"
                                          onClick={() => setProductImage(null)}
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors">
                                        <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                                        <span className="text-sm font-medium text-muted-foreground text-center px-4">
                                          Sube la mejor foto de tu producto
                                        </span>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleProductImageUpload} />
                                      </label>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Precio (COP)</Label>
                                    <Input name="price" type="number" placeholder="Ej: 3000" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Sección</Label>
                                    <select name="categoryId" className="w-full h-12 rounded-lg border px-3" required>
                                        <option value="">Selecciona sección...</option>
                                        {categories?.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Descripción</Label>
                                    <Textarea name="description" placeholder="Describe los ingredientes o beneficios..." required />
                                </div>
                                <Button type="submit" className="w-full h-12 font-bold" disabled={isAddingProduct || isCompressingProduct}>
                                    {isAddingProduct ? <Loader2 className="animate-spin" /> : "Publicar en Vitrina"}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
              )}

              <div className="pt-4 overflow-hidden">
                <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
                  <div className="bg-[#f3f4f6]/50 rounded-full p-1 border border-slate-100 shadow-inner">
                    <TabsList className="bg-transparent h-auto p-0 flex gap-1 justify-between overflow-x-auto no-scrollbar">
                      <TabsTrigger 
                        value="all" 
                        className="rounded-full px-5 py-2.5 data-[state=active]:bg-[#fef3c7] data-[state=active]:text-[#d97706] data-[state=active]:shadow-sm font-bold text-[13px] border-none transition-all flex items-center gap-2"
                      >
                        <StoreIcon className="w-3.5 h-3.5" /> Todos
                      </TabsTrigger>
                      {categories?.map(cat => (
                        <TabsTrigger 
                          key={cat.id} 
                          value={cat.id} 
                          className="rounded-full px-5 py-2.5 data-[state=active]:bg-white data-[state=active]:text-[#1f2937] data-[state=active]:shadow-sm font-bold text-[13px] border-none transition-all"
                        >
                          {cat.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  <TabsContent value="all" className="mt-8">
                    <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                      <Package className="w-12 h-12 mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-400 font-bold italic">Selecciona una sección arriba</p>
                    </div>
                  </TabsContent>

                  {categories?.map(cat => (
                    <TabsContent key={cat.id} value={cat.id} className="mt-8">
                      <ProductsGrid storeId={id} categoryId={cat.id} />
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              <div className="pt-8 flex justify-center pb-6">
                <Button className="w-[85%] h-14 rounded-full bg-[#f59e0b] hover:bg-[#d97706] text-white text-xl font-bold shadow-xl shadow-orange-200 border-none gap-2 group">
                   Ver Catálogo <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ProductsGrid({ storeId, categoryId }: { storeId: string, categoryId: string }) {
  const firestore = useFirestore();
  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !storeId || !categoryId) return null;
    return query(
      collection(firestore, 'stores', storeId, 'categories', categoryId, 'products'),
      where('status', '==', 'available')
    );
  }, [firestore, storeId, categoryId]);

  const { data: products, isLoading } = useCollection(productsQuery);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2].map(i => <Skeleton key={i} className="h-64 rounded-3xl" />)}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
        <Package className="w-10 h-10 mx-auto text-slate-200 mb-2" />
        <p className="text-slate-400 font-bold text-sm italic">Sin productos aún</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      {products.map(p => (
        <ProductCard key={p.id} product={p as any} />
      ))}
    </div>
  );
}
