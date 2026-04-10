
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { HomeActions } from '@/components/home/HomeActions';
import { HomeCategorySection } from '@/components/home/HomeCategorySection';
import { HomePromoBanner } from '@/components/home/HomePromoBanner';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, doc, orderBy } from 'firebase/firestore';
import { ShoppingBag, Cpu, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';

/**
 * Home - El Portal Unificado de Vitriniando.
 * CARGA INSTANTÁNEA: Se ha eliminado el splash por mandato superior.
 */
export default function Home() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      const savedMode = localStorage.getItem('vitriniando_preferred_mode');
      if (savedMode === 'delivery') {
        router.replace('/delivery/dashboard');
      }
    }
  }, [user, isUserLoading, router]);

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <main className="flex-1 w-full overflow-x-hidden">
        <AuthenticatedHome />
      </main>
    </div>
  );
}

function AuthenticatedHome() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { isAdmin, profile } = useProfile();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [openStore, setOpenStore] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [base64Image, setBase64Image] = useState<string | null>(null);

  const lockRef = useMemoFirebase(() => doc(firestore, 'appConfig', 'washer_lock'), [firestore]);
  const { data: dataLock } = useDoc(lockRef);
  const isWasherOnlyMode = dataLock?.active === true;

  const catQ = useMemoFirebase(() => query(collection(firestore, 'mainCategories'), orderBy('createdAt', 'desc')), [firestore]);
  const { data: mainCategories, isLoading: loadingCategories } = useCollection(catQ);

  const allStoresQ = useMemoFirebase(() => query(collection(firestore, 'stores')), [firestore]);
  const { data: allStores } = useCollection(allStoresQ);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return { categories: mainCategories, stores: null };
    const lowerSearch = searchTerm.toLowerCase();
    const matchedCategories = mainCategories?.filter(c => 
      c.name.toLowerCase().includes(lowerSearch) || 
      c.description.toLowerCase().includes(lowerSearch)
    );
    const matchedStores = allStores?.filter(s => 
      s.name.toLowerCase().includes(lowerSearch) || 
      s.description?.toLowerCase().includes(lowerSearch) ||
      s.address?.toLowerCase().includes(lowerSearch)
    );
    return { categories: matchedCategories, stores: matchedStores };
  }, [searchTerm, mainCategories, allStores]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try { 
        const { compressImage } = await import('@/lib/image-compression');
        const comp = await compressImage(file); 
        setBase64Image(comp); 
      }
      catch (e) { console.error(e); }
      finally { setIsCompressing(false); }
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full">
        <HomeActions 
          isAdmin={isAdmin}
          profile={profile}
          openCategory={openCategory} 
          setOpenCategory={setOpenCategory} 
          openStore={openStore} 
          setOpenStore={setOpenStore}
          editingCategory={editingCategory} 
          mainCategories={mainCategories} 
          base64Image={base64Image} 
          setBase64Image={setBase64Image}
          isRegistering={isRegistering} 
          isCompressing={isCompressing} 
          onImageUpload={handleImageUpload} 
          onCategorySubmit={() => {}} 
          onStoreSubmit={() => {}}
        />
      </div>

      <div className="w-full max-w-7xl space-y-12 pb-20">
        {isAdmin && !isWasherOnlyMode && (
          <section className="px-4 sm:px-8 mt-12 animate-in fade-in duration-500">
            <Link href="/admin/agents">
              <Card className="border-none rounded-[40px] bg-slate-900 text-white overflow-hidden shadow-2xl group hover:scale-[1.01] transition-all duration-500 cursor-pointer relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-colors" />
                <CardContent className="p-10 flex flex-col sm:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-white/10 rounded-[32px] flex items-center justify-center backdrop-blur-xl border border-white/5 relative">
                      <Cpu className="w-10 h-10 text-primary animate-pulse" />
                      <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter leading-none">Ciudadela de Agentes</h3>
                      <p className="text-primary/60 text-[10px] font-black uppercase tracking-[0.4em] ml-1">Administración de IA Centralizada</p>
                    </div>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </section>
        )}

        <div className={isWasherOnlyMode ? "hidden md:block" : "block"}>
          <HomeCategorySection 
            isAdmin={isAdmin} 
            categories={filteredData.categories} 
            isLoading={loadingCategories} 
            onEdit={(c) => { 
              setEditingCategory(c); 
              setOpenCategory(true); 
              setBase64Image(null);
            }} 
          />
          
          {!searchTerm && (
            <div className="px-4 sm:px-8 mt-12">
              <HomePromoBanner onAction={() => setOpenStore(true)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
