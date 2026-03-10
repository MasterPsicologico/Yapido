
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

  // Estados para el registro de tienda
  const [openStore, setOpenStore] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [base64Image, setBase64Image] = useState<string | null>(null);

  // 1. Obtener la categoría actual
  const catRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'mainCategories', id);
  }, [firestore, id]);

  const { data: category, isLoading: loadingCat } = useDoc(catRef);

  // 2. Obtener tiendas de esta categoría
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
        mainCategoryId: id, // ID de la categoría actual
        name,
        address,
        status: 'active',
        imageUrl: base64Image || `https://picsum.photos/seed/${storeRef.id}/800/600`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      toast({ title: "¡Vitrina Lanzada!", description: "Negocio registrado en esta categoría." });
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
        <div className="h-80 w-full animate-pulse bg-slate-200" />
        <div className="container mx-auto px-4 -mt-20">
          <Skeleton className="h-64 rounded-[50px] w-full" />
        </div>
      </div>
    );
  }

  if (!category && !loadingCat) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="text-center space-y-4 px-6">
            <LayoutGrid className="w-16 h-16 mx-auto text-slate-200 mb-4" />
            <h2 className="text-2xl font-black text-slate-400 italic">Categoría no encontrada</h2>
            <Link href="/">
              <Button className="rounded-full bg-primary font-bold">Volver al Inicio</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      
      <main className="flex-1">
        {/* Banner de Categoría */}
        <div className="relative h-[45vh] md:h-[500px] w-full overflow-hidden">
          {category?.imageUrl && (
            <Image 
              src={category.imageUrl} 
              alt={category.name || "Categoría"} 
              fill 
              className="object-cover animate-in fade-in zoom-in duration-1000" 
              priority 
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          
          <div className="absolute top-6 left-6 z-20">
            <Link href="/">
              <Button variant="secondary" className="rounded-full bg-white/95 shadow-xl h-11 px-5 gap-2 font-black text-slate-800 border-none text-xs">
                <ArrowLeft className="w-4 h-4" /> Volver al Inicio
              </Button>
            </Link>
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pt-10 z-10">
            <div className="bg-primary/20 backdrop-blur-md rounded-full px-5 py-1.5 border border-white/20 mb-4 animate-in fade-in slide-in-from-top-4 duration-700">
              <span className="text-white text-[10px] font-black uppercase tracking-[0.3em]">Marketplace Aguachica</span>
            </div>
            <h1 className="text-5xl sm:text-7xl md:text-9xl font-black text-white tracking-tighter uppercase drop-shadow-2xl italic leading-none">
              {category?.name}
            </h1>
            <p className="text-white/80 text-sm sm:text-xl font-medium max-w-2xl mt-6 line-clamp-2">
              {category?.description}
            </p>
          </div>
        </div>

        {/* Listado de Tiendas con Botón de Registro */}
        <section className="container mx-auto px-4 py-16 -mt-16 sm:-mt-24 relative z-20 overflow-visible">
          <div className="bg-white/90 backdrop-blur-2xl rounded-[50px] sm:rounded-[65px] p-8 sm:p-14 shadow-2xl shadow-slate-200/60 border border-white/50">
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-16">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-[25px] flex items-center justify-center text-primary shadow-inner">
                  <LayoutGrid className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">Vitrinas Disponibles</h2>
                  <p className="text-slate-400 font-bold text-xs sm:text-sm uppercase tracking-widest">{stores?.length || 0} Negocios en {category?.name}</p>
                </div>
              </div>

              {/* Botón para registrar tienda dentro de esta categoría específica */}
              <Dialog open={openStore} onOpenChange={setOpenStore}>
                <DialogTrigger asChild>
                  <Button className="rounded-full h-14 sm:h-16 px-8 sm:px-12 gap-3 bg-secondary hover:bg-secondary/90 text-white font-black shadow-xl shadow-secondary/30 w-full md:w-auto text-base sm:text-lg transition-all hover:scale-105 active:scale-95">
                    <Plus className="w-6 h-6" /> Registrar Mi Vitrina Aquí
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black">Lanza tu {category?.name}</DialogTitle>
                    <DialogDescription>Tu negocio se añadirá directamente a esta sección global.</DialogDescription>
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
                      {isRegistering ? <Loader2 className="animate-spin" /> : <Sparkles className="mr-2" />} Registrar Mi Vitrina
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {loadingStores ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-80 rounded-[45px]" />)}
              </div>
            ) : stores && stores.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
                {stores.map((store) => (
                  <StoreCard key={store.id} store={store as any} />
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-slate-50/50 rounded-[45px] border-2 border-dashed border-slate-200 px-6 animate-in fade-in duration-700">
                <StoreIcon className="w-20 h-20 mx-auto text-slate-200 mb-6" />
                <h3 className="text-2xl font-black text-slate-400 italic">No hay negocios registrados.</h3>
                <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">Sé el primero en destacar tu negocio en la categoría de {category?.name}.</p>
                <Button onClick={() => setOpenStore(true)} variant="outline" className="mt-8 rounded-full h-12 border-primary/30 text-primary font-bold px-8">Registrar mi vitrina ahora</Button>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 py-16 text-center text-white mt-12 overflow-hidden">
        <div className="container mx-auto px-6 space-y-4">
          <div className="flex items-center justify-center gap-2">
             <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <LayoutGrid className="w-6 h-6 text-white" />
             </div>
             <span className="text-3xl font-black italic tracking-tighter">Vitriniando</span>
          </div>
          <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
            Impulsando el crecimiento digital de los negocios de Aguachica, Cesar.
          </p>
        </div>
      </footer>
    </div>
  );
}
