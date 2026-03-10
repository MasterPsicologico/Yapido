
"use client";

import { Navbar } from '@/components/layout/Navbar';
import { StoreCard } from '@/components/store/StoreCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Store as StoreIcon, LayoutGrid, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

export default function CategoryPage() {
  const params = useParams();
  const id = params?.id as string;
  const firestore = useFirestore();

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
        <div className="relative h-[40vh] md:h-96 w-full">
          {category?.imageUrl && (
            <Image 
              src={category.imageUrl} 
              alt={category.name || "Categoría"} 
              fill 
              className="object-cover" 
              priority 
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          
          <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-20">
            <Link href="/">
              <Button variant="secondary" className="rounded-full bg-white/95 shadow-xl h-11 sm:h-12 px-5 sm:px-6 gap-2 font-black text-slate-800 border-none text-xs sm:text-sm">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Volver al Inicio
              </Button>
            </Link>
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pt-10">
            <div className="bg-primary/20 backdrop-blur-md rounded-full px-5 py-1.5 border border-white/20 mb-4 animate-in fade-in zoom-in">
              <span className="text-white text-[10px] sm:text-xs font-black uppercase tracking-[0.3em]">Marketplace Aguachica</span>
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-white tracking-tighter uppercase drop-shadow-2xl">
              {category?.name}
            </h1>
            <p className="text-white/80 text-sm sm:text-lg md:text-2xl font-medium max-w-2xl mt-4 line-clamp-2">
              {category?.description}
            </p>
          </div>
        </div>

        {/* Listado de Tiendas */}
        <section className="container mx-auto px-4 py-16 -mt-12 sm:-mt-16 relative z-10">
          <div className="bg-white/80 backdrop-blur-xl rounded-[40px] sm:rounded-[60px] p-6 sm:p-10 md:p-14 shadow-2xl shadow-slate-200/50 border border-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary">
                  <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Vitrinas Disponibles</h2>
              </div>
              <span className="bg-slate-100 text-slate-500 font-bold px-4 py-1.5 rounded-full text-xs sm:text-sm whitespace-nowrap">
                {stores?.length || 0} Negocios
              </span>
            </div>

            {loadingStores ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-80 rounded-[40px]" />)}
              </div>
            ) : stores && stores.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
                {stores.map((store) => (
                  <StoreCard key={store.id} store={store as any} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 px-6">
                <StoreIcon className="w-16 h-16 mx-auto text-slate-200 mb-4" />
                <h3 className="text-xl font-bold text-slate-400 italic">No hay tiendas en esta sección.</h3>
                <p className="text-slate-400 text-sm mt-2">Sé el primero en registrar tu vitrina aquí.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 py-16 text-center text-white mt-12">
        <div className="container mx-auto px-6 space-y-4">
          <div className="flex items-center justify-center gap-2">
             <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <LayoutGrid className="w-5 h-5 text-white" />
             </div>
             <span className="text-2xl font-black italic">Vitriniando</span>
          </div>
          <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
            Organizando el comercio local de Aguachica con tecnología de punta.
          </p>
        </div>
      </footer>
    </div>
  );
}
