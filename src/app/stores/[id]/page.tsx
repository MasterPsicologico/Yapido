"use client";

import { useState, use } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { ProductCard } from '@/components/product/ProductCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  MapPin, 
  Globe, 
  Star, 
  Plus, 
  Package, 
  Loader2, 
  ArrowLeft, 
  Image as ImageIcon, 
  X, 
  Store as StoreIcon, 
  ChevronRight,
  MessageCircle,
  Clock,
  Zap,
  Tag
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
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
          <h2 className="text-2xl font-bold italic">Vitrina no encontrada</h2>
          <Link href="/">
            <Button className="rounded-full bg-primary font-bold">Volver al Inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.uid === store?.ownerId;

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

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="flex-1 pb-20">
        {/* Hero Background */}
        <div className="relative h-[45vh] w-full overflow-hidden">
          <Image 
            src={store?.imageUrl || 'https://picsum.photos/seed/bakery/1920/1080'} 
            alt={store?.name || 'Vitriniando'} 
            fill 
            className="object-cover" 
            priority
          />
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>
          
          {/* Back Button */}
          <div className="absolute top-6 left-6 z-30">
            <Link href="/">
              <Button size="icon" variant="secondary" className="rounded-full bg-white/90 shadow-md">
                <ArrowLeft className="w-5 h-5 text-slate-800" />
              </Button>
            </Link>
          </div>

          {/* Centered Logo Placeholder (Like Panaderia El Sol) */}
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="bg-white/20 p-4 rounded-full backdrop-blur-md border border-white/30">
                <StoreIcon className="w-16 h-16 text-white" />
             </div>
          </div>
        </div>

        {/* Floating Content Card */}
        <div className="container mx-auto max-w-2xl px-4 -mt-24 relative z-20">
          <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-white/50">
            <div className="p-8 md:p-10 space-y-8">
              {/* Header Info */}
              <div className="space-y-4">
                <Badge className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-full px-4 py-1 text-xs font-bold border-none">
                  {store?.category || 'Tienda'}
                </Badge>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">{store?.name}</h1>
                <p className="text-slate-500 text-lg leading-relaxed font-medium">
                  {store?.description}
                </p>
              </div>

              {/* Features Icons */}
              <div className="flex flex-wrap items-center justify-between gap-4 py-2">
                <div className="flex flex-col items-center gap-2 group cursor-default">
                  <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 shadow-sm">
                    <Tag className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">Promociones<br/>diarias</span>
                </div>
                <div className="flex flex-col items-center gap-2 group cursor-default">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">Productos<br/>frescos</span>
                </div>
                <div className="flex flex-col items-center gap-2 group cursor-default">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 shadow-sm">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">Domicilios<br/>rápidos</span>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/60 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                    <Phone className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-800 font-bold">{store?.phoneNumber || '+57 3XX XXX XXXX'}</span>
                      <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-full font-bold h-9 px-4 gap-2">
                        <Phone className="w-3.5 h-3.5" /> Llamar ahora <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                    <MapPin className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-slate-600 text-xs font-medium">{store?.address || 'Dirección no especificada'}</span>
                        <span className="text-slate-400 text-[10px] uppercase font-bold mt-1">Aguachica, Cesar</span>
                      </div>
                      <Button size="sm" variant="outline" className="rounded-full font-bold h-9 px-4 gap-2 border-slate-200 text-slate-700 bg-white">
                        <MessageCircle className="w-3.5 h-3.5 text-green-500" /> WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-400 text-[11px] font-bold pt-2 border-t border-slate-200">
                  <Globe className="w-3 h-3" /> 
                  <span>www.{store?.name?.toLowerCase()?.replace(/\s/g, '') || 'tienda'}.com</span>
                </div>
              </div>

              {/* Owner Actions */}
              {isOwner && (
                <div className="grid grid-cols-2 gap-3">
                  <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="rounded-full gap-2 border-dashed border-primary/40 text-primary h-12 font-black text-xs uppercase tracking-widest hover:bg-primary/5">
                        <Plus className="w-4 h-4" /> Nueva Sección
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-primary italic">Crear Sección</DialogTitle>
                        <DialogDescription>Organiza tus productos (ej: Desayunos, Almuerzos).</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddCategory} className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Nombre de la Sección</Label>
                          <Input name="name" placeholder="Ej: Especiales del Mes" required />
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
                        <DialogDescription>Sube fotos reales para mejores ventas.</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddProduct} className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Nombre</Label>
                          <Input name="name" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Foto del Producto</Label>
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
                                <span className="text-xs font-medium text-muted-foreground">Toca para subir foto real</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleProductImageUpload} />
                              </label>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Precio (COP)</Label>
                          <Input name="price" type="number" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Sección</Label>
                          <select 
                            name="categoryId" 
                            className="w-full h-12 rounded-lg border border-input bg-background px-3" 
                            required
                          >
                            <option value="">Selecciona una sección...</option>
                            {categories?.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Descripción</Label>
                          <Textarea name="description" placeholder="Atrae a tus clientes..." required />
                        </div>
                        <Button type="submit" className="w-full h-12 font-bold" disabled={isAddingProduct || isCompressingProduct}>
                          {isAddingProduct ? <Loader2 className="animate-spin" /> : "Publicar Ahora"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {/* Pill Style Tabs */}
              <div className="mt-8">
                <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
                  <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
                    <TabsList className="bg-transparent h-auto p-0 flex gap-3">
                      <TabsTrigger value="all" className="rounded-full px-6 py-2.5 bg-yellow-100 text-yellow-800 data-[state=active]:bg-yellow-500 data-[state=active]:text-white font-bold text-sm shadow-sm transition-all flex items-center gap-2 border-none">
                        <StoreIcon className="w-4 h-4" /> Todos
                      </TabsTrigger>
                      {categories?.map(cat => (
                        <TabsTrigger key={cat.id} value={cat.id} className="rounded-full px-6 py-2.5 bg-slate-100 text-slate-600 data-[state=active]:bg-slate-900 data-[state=active]:text-white font-bold text-sm shadow-sm transition-all border-none">
                          {cat.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  <TabsContent value="all" className="mt-8">
                    <div className="text-center py-20 bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-200">
                      <Package className="w-12 h-12 mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-400 font-bold italic">Explora nuestras secciones arriba</p>
                    </div>
                  </TabsContent>

                  {categories?.map(cat => (
                    <TabsContent key={cat.id} value={cat.id} className="mt-8">
                      <ProductsGrid storeId={id} categoryId={cat.id} />
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              {/* Final CTA Button */}
              <div className="pt-8 text-center">
                <Button className="w-full max-w-xs h-16 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white text-xl font-black shadow-xl shadow-orange-500/20 gap-3 group">
                   Ver Menú Completo <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
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
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 rounded-3xl" />)}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
        <Package className="w-10 h-10 mx-auto text-slate-200 mb-2" />
        <p className="text-slate-400 font-bold text-sm italic">Sin productos en esta sección</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
      {products.map(p => (
        <ProductCard key={p.id} product={p as any} />
      ))}
    </div>
  );
}
