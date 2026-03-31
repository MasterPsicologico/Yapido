
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Store as StoreIcon, 
  LayoutGrid, 
  ArrowUpRight, 
  Loader2, 
  TrendingUp, 
  Wallet, 
  Package, 
  Settings, 
  Waves,
  ChevronRight,
  ArrowLeft,
  Plus,
  ShieldCheck
} from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function ManagePage() {
  const { user } = useUser();
  const { profile, isLoading: loadingProfile } = useProfile();
  const firestore = useFirestore();
  const router = useRouter();

  // PROTECCIÓN DE ACCESO: Solo dueños o admins
  useEffect(() => {
    if (!loadingProfile && profile && profile.role !== 'dueño' && profile.role !== 'admin') {
      router.push('/');
    }
  }, [profile, loadingProfile, router]);

  // QUERY: Todos los negocios del usuario
  const storesQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'stores'), where('ownerId', '==', user.uid));
  }, [firestore, user?.uid]);

  const { data: stores, isLoading: loadingStores } = useCollection(storesQuery);

  // ESTADÍSTICAS GLOBALES
  const globalStats = useMemo(() => {
    if (!stores) return { totalBusinesses: 0, washerCount: 0, storeCount: 0 };
    return {
      totalBusinesses: stores.length,
      washerCount: stores.filter(s => s.type === 'washer_rental' || s.mainCategoryId === 'category-washer').length,
      storeCount: stores.filter(s => !s.type || s.type !== 'washer_rental').length
    };
  }, [stores]);

  if (loadingProfile || loadingStores) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-10 max-w-5xl">
        
        {/* HEADER DE CONSOLA UNIFICADA */}
        <div className="flex flex-col gap-8 mb-12 animate-in slide-in-from-top-4 duration-700">
          <Link href="/" className="group flex items-center gap-2 text-slate-400 font-bold hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Volver al Marketplace</span>
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-slate-900 rounded-[32px] flex items-center justify-center text-white shadow-2xl relative">
                <LayoutGrid className="w-10 h-10 text-primary" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-[#f8fafc] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none text-slate-900">Mis Negocios</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-1">Consola de Dueño • {globalStats.totalBusinesses} ACTIVOS</p>
              </div>
            </div>
            <Button asChild className="rounded-full h-14 px-8 font-black text-xs uppercase tracking-widest gap-2 bg-slate-900 shadow-xl shadow-slate-200">
              <Link href="/"><Plus className="w-4 h-4" /> Registrar Nueva Vitrina</Link>
            </Button>
          </div>
        </div>

        {/* LISTADO DE NEGOCIOS */}
        <div className="grid gap-10">
          {stores && stores.length > 0 ? stores.map((store) => {
            const isWasher = store.type === 'washer_rental' || store.mainCategoryId === 'category-washer';
            const adminPath = isWasher ? `/admin/washer/${store.id}` : `/stores/${store.id}`;

            return (
              <Card key={store.id} className="group border-none rounded-[48px] shadow-sm bg-white overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ring-1 ring-black/[0.03]">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Visual de la Vitrina */}
                    <div className="relative w-full md:w-72 h-48 md:h-auto overflow-hidden">
                      <Image src={store.imageUrl || 'https://picsum.photos/seed/store/800/600'} alt={store.name} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <Badge className={cn("text-white border-none font-black text-[8px] uppercase px-3 italic", isWasher ? "bg-primary" : "bg-secondary")}>
                          {isWasher ? "ALQUILER ACTIVO" : "TIENDA ACTIVA"}
                        </Badge>
                      </div>
                    </div>

                    {/* Info y Acciones */}
                    <div className="flex-1 p-8 space-y-8">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 group-hover:text-primary transition-colors">{store.name}</h2>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><MapPin className="w-3 h-3" /> {store.address || 'Ubicación registrada'}</p>
                        </div>
                        <div className="w-14 h-14 rounded-[20px] bg-slate-50 flex items-center justify-center shadow-inner group-hover:bg-primary/10 transition-all">
                          {isWasher ? <Waves className="w-7 h-7 text-primary" /> : <StoreIcon className="w-7 h-7 text-secondary" />}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado</p>
                          <span className="text-xs font-black text-green-500 uppercase italic">OPERATIVO</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Ventas</p>
                          <span className="text-xs font-black text-slate-900">VER DETALLES</span>
                        </div>
                        <div className="hidden sm:block bg-slate-50 p-4 rounded-3xl border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Actualizado</p>
                          <span className="text-xs font-black text-slate-900">HOY</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button asChild className="w-full h-16 rounded-[24px] bg-slate-900 text-white font-black uppercase text-sm tracking-widest gap-3 shadow-xl hover:bg-primary transition-all">
                          <Link href={adminPath}>
                            {isWasher ? "GESTIONAR FLOTA DE LAVADORAS" : "ADMINISTRAR PRODUCTOS Y VITRINA"} 
                            <ChevronRight className="w-5 h-5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }) : (
            <div className="py-24 text-center space-y-6 bg-white rounded-[48px] border-2 border-dashed border-slate-100">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <StoreIcon className="w-10 h-10 text-slate-200" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-400">Sin negocios registrados</h3>
                <p className="text-slate-400 font-medium text-sm">Empieza tu aventura digital hoy mismo.</p>
              </div>
              <Button asChild className="rounded-full h-14 px-10 font-black bg-primary">
                <Link href="/">Crear Mi Primera Vitrina</Link>
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function MapPin({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  );
}
