
"use client";

import { useState, use } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { ProductCard } from '@/components/product/ProductCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Info, Star, Plus, Package, ListPlus, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
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

export default function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
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
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [prodDialogOpen, setProdDialogOpen] = useState(false);

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

  if (!store) notFound();

  const isOwner = user?.uid === store.ownerId;

  async function handleAddCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isOwner) return;

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

      addDocumentNonBlocking(collection(firestore, 'stores', id, 'categories'), catData);
      
      toast({
        title: "Categoría creada",
        description: `Se ha añadido "${name}" a tu vitrina.`,
      });
      setCatDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la categoría.",
        variant: "destructive"
      });
    } finally {
      setIsAddingCategory(false);
    }
  }

  async function handleAddProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isOwner) return;

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
        imageUrls: [`https://picsum.photos/seed/${prodRef.id}/600/400`],
        status: 'available',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      addDocumentNonBlocking(collection(firestore, 'stores', id, 'categories', categoryId, 'products'), prodData);
      
      // Also add to global products for discovery
      addDocumentNonBlocking(collection(firestore, 'products'), {
        ...prodData,
        storeName: store.name
      });

      toast({
        title: "Producto añadido",
        description: `"${name}" ya está disponible en tu vitrina.`,
      });
      setProdDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo añadir el producto.",
        variant: "destructive"
      });
    } finally {
      setIsAddingProduct(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 bg-background">
        {/* Store Header */}
        <div className="relative h-64 md:h-80 w-full overflow-hidden">
          <Image 
            src={store.imageUrl || 'https://picsum.photos/seed/store/1920/1080'} 
            alt={store.name} 
            fill 
            className="object-cover" 
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>
        </div>

        <div className="container mx-auto px-4 -mt-20 relative z-10 pb-20">
          <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl border border-border/50">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-4">
                <Badge className="bg-secondary text-white">{store.category}</Badge>
                <div className="flex items-center gap-4">
                  <h1 className="text-3xl md:text-5xl font-black text-foreground">{store.name}</h1>
                  <div className="hidden sm:flex items-center gap-1 text-yellow-500 bg-yellow-50 px-2 py-1 rounded-lg">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-bold text-sm">4.9</span>
                  </div>
                </div>
                <p className="text-lg text-muted-foreground max-w-2xl">{store.description}</p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <Button className="rounded-full gap-2">
                    <Phone className="w-4 h-4" /> {store.phoneNumber || 'Contactar'}
                  </Button>
                  
                  {isOwner && (
                    <>
                      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="rounded-full gap-2 border-primary text-primary">
                            <ListPlus className="w-4 h-4" /> Nueva Categoría
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Añadir Categoría</DialogTitle>
                            <DialogDescription>Organiza tus productos en secciones.</DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleAddCategory} className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label htmlFor="catName">Nombre</Label>
                              <Input id="catName" name="name" placeholder="Ej: Bebidas Frías" required />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="catDesc">Descripción</Label>
                              <Textarea id="catDesc" name="description" placeholder="Opcional..." />
                            </div>
                            <Button type="submit" className="w-full" disabled={isAddingCategory}>
                              {isAddingCategory ? <Loader2 className="animate-spin" /> : "Crear Categoría"}
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={prodDialogOpen} onOpenChange={setProdDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="rounded-full gap-2 bg-secondary hover:bg-secondary/90">
                            <Package className="w-4 h-4" /> Nuevo Producto
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Añadir Producto</DialogTitle>
                            <DialogDescription>Publica un nuevo artículo en tu vitrina.</DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleAddProduct} className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label htmlFor="prodName">Nombre del Producto</Label>
                              <Input id="prodName" name="name" required />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="prodPrice">Precio (COP)</Label>
                              <Input id="prodPrice" name="price" type="number" required />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="prodCat">Seleccionar Categoría</Label>
                              <select name="categoryId" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                                <option value="">Elige una categoría...</option>
                                {categories?.map(cat => (
                                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="prodDesc">Descripción</Label>
                              <Textarea id="prodDesc" name="description" required />
                            </div>
                            <Button type="submit" className="w-full" disabled={isAddingProduct}>
                              {isAddingProduct ? <Loader2 className="animate-spin" /> : "Publicar Producto"}
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-12">
              <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-muted/50 p-1 rounded-full mb-8 h-12 flex overflow-x-auto min-w-full sm:min-w-0">
                  <TabsTrigger value="all" className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-white">
                    Todos los productos
                  </TabsTrigger>
                  {categories?.map(cat => (
                    <TabsTrigger key={cat.id} value={cat.id} className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-white">
                      {cat.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="all" className="mt-0">
                  <ProductsGrid storeId={id} categoryId={null} />
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

function ProductsGrid({ storeId, categoryId }: { storeId: string, categoryId: string | null }) {
  const firestore = useFirestore();
  
  // Use a query based on the active tab
  const productsQuery = useMemoFirebase(() => {
    if (categoryId) {
      return query(
        collection(firestore, 'stores', storeId, 'categories', categoryId, 'products'),
        where('status', '==', 'available')
      );
    }
    // For "all", we might need a more complex query or multiple fetches if flattened. 
    // Here we'll just show products if a category is selected for simplicity in this MVP.
    return null;
  }, [firestore, storeId, categoryId]);

  const { data: products, isLoading } = useCollection(productsQuery);

  if (!categoryId) {
    return (
      <div className="text-center py-12 bg-muted/10 rounded-3xl border-2 border-dashed">
        <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
        <p className="text-muted-foreground">Selecciona una categoría para ver los productos.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12 bg-muted/10 rounded-3xl border-2 border-dashed">
        <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
        <p className="text-muted-foreground">No hay productos en esta categoría todavía.</p>
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
