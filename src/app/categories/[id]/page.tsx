
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

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      
      <main className="flex-1">
        {/* Banner de Categoría */}
        <div className="relative h-96 w-full">
          <Image src={category?.imageUrl || ""} alt={category?.name || ""} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          
          <div className="absolute top-8 left-8">
            <Link href="/">
              <Button variant="secondary" className="rounded-full bg-white/95 shadow-xl h-12 px-6 gap-2 font-black text-slate-800 border-none">
                <ArrowLeft className="w-5 h-5" /> Volver al Inicio
              </Button>
            </Link>
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pt-10">
            <div className="bg-primary/20 backdrop-blur-md rounded-full px-6 py-2 border border-white/20 mb-4 animate-in fade-in zoom-in">
              <span className="text-white text-xs font-black uppercase tracking-[0.3em]">Marketplace Aguachica</span>
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter uppercase drop-shadow-2xl">
              {category?.name}
            </h1>
            <p className="text-white/80 text-lg md:text-2xl font-medium max-w-2xl mt-4">
              {category?.description}
            </p>
          </div>
        </div>

        {/* Listado de Tiendas */}
        <section className="container mx-auto px-4 py-16 -mt-16 relative z-10">
          <div className="bg-white/80 backdrop-blur-xl rounded-[60px] p-8 md:p-14 shadow-2xl shadow-slate-200/50 border border-white">
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary">
                  <LayoutGrid className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Vitrinas Disponibles</h2>
              </div>
              <span className="bg-slate-100 text-slate-500 font-bold px-4 py-1 rounded-full text-sm">
                {stores?.length || 0} Negocios
              </span>
            </div>

            {loadingStores ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-80 rounded-[45px]" />)}
              </div>
            ) : stores && stores.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {stores.map((store) => (
                  <StoreCard key={store.id} store={store as any} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-slate-50 rounded-[45px] border-2 border-dashed border-slate-200">
                <StoreIcon className="w-16 h-16 mx-auto text-slate-200 mb-4" />
                <h3 className="text-xl font-bold text-slate-400 italic">No hay tiendas en esta sección todavía.</h3>
                <p className="text-slate-400 text-sm mt-2">Sé el primero en registrar tu vitrina aquí.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 py-16 text-center text-white mt-12">
        <div className="container mx-auto px-4 space-y-4">
          <div className="flex items-center justify-center gap-2">
             <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <LayoutGrid className="w-5 h-5" />
             </div>
             <span className="text-2xl font-black italic">Vitriniando</span>
          </div>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            Organizando el comercio local de Aguachica con tecnología de punta.
          </p>
        </div>
      </footer>
    </div>
  );
}
