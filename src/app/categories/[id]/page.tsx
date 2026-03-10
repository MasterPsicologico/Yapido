
"use client";

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { StoreCard } from '@/components/store/StoreCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Store as StoreIcon, LayoutGrid, Loader2, Plus, ImageIcon, X, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
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
import { toast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/image-compression';

export default function CategoryPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useUser();
  const firestore = useFirestore();

  const [openStore, setOpenStore] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [base64Image, setBase64Image] = useState<string | null>(null);

  const catRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'mainCategories', id);
  }, [firestore, id]);

  const { data: category, isLoading: loadingCat } = useDoc(catRef);

  const storesQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(collection(firestore, 'stores'), where('mainCategoryId', '==', id), where('status', '==', 'active'));
  }, [firestore, id]);

  const { data: stores, isLoading: loadingStores } = useCollection(storesQuery);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const compressed = await compressImage(file, 1200, 1200, 0.85);
        setBase64Image(compressed);
        toast({ title: "Imagen lista" });
      } catch (error) {
        toast({ title: "Error", variant: "destructive" });
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleRegisterStore = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const address = formData.get('address') as string;

    setIsRegistering(true);
    try {
      const storeRef = doc(collection(firestore, 'stores'));
      setDocumentNonBlocking(storeRef, {
        id: storeRef.id,
        ownerId: user.uid,
        mainCategoryId: id,
        name,
        address,
        status: 'active',
        imageUrl: base64Image || `https://picsum.photos/seed/${storeRef.id}/800/600`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      toast({ title: "¡Vitrina Lanzada!", description: "Negocio registrado." });
      setOpenStore(false);
      setBase64Image(null);
    } catch (e) {
      toast({ title: "Error al registrar", variant: "destructive" });
    } finally {
      setIsRegistering(false);
    }
  };

  if (loadingCat) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <Skeleton className="h-64 w-full" />
        <div className="w-full p-4 space-y-4">
          <Skeleton className="h-10 w-1/3" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </div>
    );
  }

  if (!category && !loadingCat) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50">
          <LayoutGrid className="w-16 h-16 text-slate-200 mb-4" />
          <h2 className="text-xl font-bold text-slate-400">Categoría no encontrada</h2>
          <link href="/" className="mt-4">
            <Button variant="default">Volver al Inicio</Button>
          </link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      
      <main className="flex-1 w-full">
        {/* Banner de Categoría Recto con Solución a Desbordamiento */}
        <div className="relative h-[40vh] w-full overflow-hidden">
          {category?.imageUrl && (
            <Image 
              src={category.imageUrl} 
              alt={category.name || "Categoría"} 
              fill 
              className="object-cover" 
              priority 
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
          
          <div className="absolute top-4 left-4 z-20">
            <Link href="/">
              <Button variant="secondary" size="sm" className="rounded-full bg-white/90 text-slate-800 font-bold border-none text-xs h-9 px-4 shadow-md">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Inicio
              </Button>
            </Link>
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
            <h1 className="text-3xl sm:text-6xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-[0.9] drop-shadow-lg break-words max-w-full">
              {category?.name}
            </h1>
            <p className="text-white/90 text-sm sm:text-lg font-medium max-w-xl mt-3 line-clamp-2 px-4 break-words">
              {category?.description}
            </p>
          </div>
        </div>

        {/* Header de Sección Recto */}
        <section className="w-full py-8 px-4 sm:px-8 border-b bg-slate-50/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 leading-none">Vitrinas locales</h2>
                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">{stores?.length || 0} Negocios activos</p>
              </div>
            </div>

            <Dialog open={openStore} onOpenChange={setOpenStore}>
              <DialogTrigger asChild>
                <Button className="rounded-full h-12 px-8 gap-2 bg-secondary hover:bg-secondary/90 text-white font-black shadow-lg shadow-secondary/20 w-full sm:w-auto">
                  <Plus className="w-4 h-4" /> Unirme a {category?.name}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">Tu vitrina en {category?.name}</DialogTitle>
                  <DialogDescription>Completa los datos para aparecer en esta sección.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleRegisterStore} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Nombre del Negocio</Label>
                    <Input name="name" placeholder="Ej: Panadería El Morrocoy" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Foto de Portada</Label>
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300">
                      {base64Image ? (
                        <>
                          <Image src={base64Image} alt="Preview" fill className="object-cover" />
                          <Button type="button" size="icon" variant="destructive" className="absolute top-2 right-2 rounded-full h-8 w-8" onClick={() => setBase64Image(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-slate-200 transition-colors">
                          <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                          <span className="text-xs font-bold text-slate-400 text-center px-4 uppercase tracking-widest">Subir Imagen Real</span>
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Dirección</Label>
                    <Input name="address" placeholder="Ej: Calle 5 con Carrera 20" required />
                  </div>
                  <Button type="submit" className="w-full h-14 font-black text-lg bg-primary hover:bg-primary/90 shadow-xl" disabled={isRegistering || isCompressing}>
                    {isRegistering ? <Loader2 className="animate-spin" /> : <Sparkles className="mr-2" />} Lanzar Mi Vitrina
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </section>

        {/* Grid de Tiendas */}
        <section className="w-full p-3 sm:p-8">
          {loadingStores ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 sm:h-80 rounded-none" />)}
            </div>
          ) : stores && stores.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
              {stores.map((store) => (
                <StoreCard key={store.id} store={store as any} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 px-6">
              <StoreIcon className="w-12 h-12 mx-auto text-slate-200 mb-4" />
              <h3 className="text-lg font-black text-slate-400 italic">No hay negocios registrados.</h3>
              <p className="text-slate-400 text-xs mt-2 max-w-xs mx-auto">Sé el primero en destacar tu negocio en esta categoría.</p>
              <Button onClick={() => setOpenStore(true)} variant="outline" className="mt-6 rounded-full h-10 border-primary/30 text-primary font-bold px-6">Registrar ahora</Button>
            </div>
          )}
        </section>
      </main>

      <footer className="w-full py-12 bg-slate-900 text-center text-white">
        <div className="flex items-center justify-center gap-2 mb-4">
           <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <LayoutGrid className="w-5 h-5 text-white" />
           </div>
           <span className="text-2xl font-black italic tracking-tighter">Vitriniando</span>
        </div>
        <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Aguachica • Cesar • 2024</p>
      </footer>
    </div>
  );
}
