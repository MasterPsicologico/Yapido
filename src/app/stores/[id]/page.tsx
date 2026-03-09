
"use client";

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { ProductCard } from '@/components/product/ProductCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Info, Star, Plus, Package, Loader2, ArrowLeft, Image as ImageIcon, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
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
  const id = params.id as string;
  const { user } = useUser();
  const firestore = useFirestore();

  const storeRef = useMemoFirebase(() => doc(firestore, 'stores', id), [firestore, id]);
  const { data: store, isLoading: loadingStore } = useDoc(storeRef);

  const categoriesQuery = useMemoFirebase(() => {
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
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-12">
          <Skeleton className="h-64 w-full rounded-3xl mb-8" />
          <Skeleton className="h-12 w-1/3 mb-4" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </main>
      </div>
    );
  }

  if (!store && !loadingStore) notFound();

  const isOwner = user?.uid === store?.ownerId;

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressingProduct(true);
      try {
        const compressed = await compressImage(file, 1200, 1200, 0.85); // Alta calidad
        setProductImage(compressed);
        toast({
          title: "Imagen lista",
          description: "La foto del producto ha sido optimizada.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo procesar la imagen.",
          variant: "destructive",
        });
      } finally {
        setIsCompressingProduct(false);
      }
    }
  };

  async function handleAddCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isOwner || !user) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    setIsAddingCategory(true);
    try {
      const catRef = doc(collection(firestore, 'stores', id, 'categories'));
      const catData = {
        id: catRef.id,
        storeId: id,
        storeOwnerId: user.uid,
        name,
        description,
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
    if (!isOwner || !user) return;

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
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 bg-background">
        <div className="relative h-64 md:h-80 w-full overflow-hidden bg-primary/20">
          <Image 
            src={store?.imageUrl || 'https://picsum.photos/seed/store/1920/1080'} 
            alt={store?.name || 'Vitriniando'} 
            fill 
            className="object-cover" 
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
          <div className="absolute top-4 left-4 z-20">
            <Link href="/">
               <Button variant="secondary" className="rounded-full gap-2 shadow-lg h-10 px-4">
                 <ArrowLeft className="w-4 h-4" /> Volver al Inicio
               </Button>
            </Link>
          </div>
        </div>

        <div className="container mx-auto px-4 -mt-16 relative z-10 pb-20">
          <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl border border-border/50">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-3">
                <Badge className="bg-secondary text-white uppercase tracking-wider text-[10px] font-bold">
                  {store?.category || 'Tienda Local'}
                </Badge>
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl md:text-5xl font-black text-foreground">{store?.name}</h1>
                  <div className="flex items-center gap-1 text-yellow-500 bg-yellow-50 px-2 py-1 rounded-lg">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-bold text-sm">4.9</span>
                  </div>
                </div>
                <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">{store?.description}</p>
                
                <div className="flex flex-wrap gap-3 pt-4">
                   <Button className="rounded-full gap-2 font-bold px-6 h-12 bg-primary hover:bg-primary/90">
                    <Phone className="w-4 h-4" /> {store?.phoneNumber || 'Ver WhatsApp'}
                  </Button>
                  
                  {isOwner && (
                    <div className="flex flex-wrap gap-2">
                      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="rounded-full gap-2 border-primary text-primary h-12 font-bold hover:bg-primary/5">
                            <Plus className="w-4 h-4" /> Nueva Categoría
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-black">Crear Sección</DialogTitle>
                            <DialogDescription>Organiza tus productos (ej: Desayunos, Almuerzos).</DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleAddCategory} className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label>Nombre de la Sección</Label>
                              <Input name="name" placeholder="Ej: Especiales del Día" required />
                            </div>
                            <Button type="submit" className="w-full h-12 font-bold" disabled={isAddingCategory}>
                              {isAddingCategory ? <Loader2 className="animate-spin" /> : "Guardar Sección"}
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={prodDialogOpen} onOpenChange={(v) => { setProdDialogOpen(v); if(!v) setProductImage(null); }}>
                        <DialogTrigger asChild>
                          <Button className="rounded-full gap-2 bg-secondary hover:bg-secondary/90 h-12 font-bold">
                            <Package className="w-4 h-4" /> Agregar Producto
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-black">Nuevo Ítem</DialogTitle>
                            <DialogDescription>Publica un nuevo producto en tu vitrina.</DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleAddProduct} className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label>Nombre</Label>
                              <Input name="name" required />
                            </div>

                            <div className="space-y-2">
                              <Label>Foto del Producto (Real)</Label>
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
                                    <span className="text-xs font-medium text-muted-foreground">Toma una foto o sube una imagen</span>
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
                              <Label>Categoría</Label>
                              <select 
                                name="categoryId" 
                                className="w-full h-12 rounded-lg border border-input bg-background px-3" 
                                required
                              >
                                <option value="">Selecciona sección...</option>
                                {categories?.map(cat => (
                                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label>Descripción</Label>
                              <Textarea name="description" required />
                            </div>
                            <Button type="submit" className="w-full h-12 font-bold" disabled={isAddingProduct || isCompressingProduct}>
                              {isAddingProduct ? <Loader2 className="animate-spin" /> : "Publicar Ahora"}
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-12">
              <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-muted/50 p-1 rounded-full mb-8 h-12 flex overflow-x-auto min-w-full sm:min-w-0 no-scrollbar">
                  <TabsTrigger value="all" className="rounded-full px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold">
                    Todos los Productos
                  </TabsTrigger>
                  {categories?.map(cat => (
                    <TabsTrigger key={cat.id} value={cat.id} className="rounded-full px-8 data-[state=active]:bg-primary data-[state=active]:text-white font-bold">
                      {cat.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="all" className="mt-0">
                  <div className="text-center py-16 bg-muted/5 rounded-3xl border-2 border-dashed border-muted-foreground/10">
                    <Info className="w-10 h-10 mx-auto text-muted-foreground mb-4 opacity-30" />
                    <p className="text-muted-foreground">Selecciona una categoría arriba para explorar los productos.</p>
                  </div>
                </TabsContent>

                {categories?.map(cat => (
                  <TabsContent key={cat.id} value={cat.id} className="mt-0">
                     <ProductsGrid storeId={id} categoryId={cat.id} />
                  </TabsContent>
                ))}
              </Tabs>
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
    return query(
      collection(firestore, 'stores', storeId, 'categories', categoryId, 'products'),
      where('status', '==', 'available')
    );
  }, [firestore, storeId, categoryId]);

  const { data: products, isLoading } = useCollection(productsQuery);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-20 bg-muted/5 rounded-3xl border-2 border-dashed border-muted-foreground/10">
        <Package className="w-10 h-10 mx-auto text-muted-foreground mb-3 opacity-20" />
        <p className="text-muted-foreground">Esta sección aún no tiene productos disponibles.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map(p => (
        <ProductCard key={p.id} product={p as any} />
      ))}
    </div>
  );
}
