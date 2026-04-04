
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { HomeActions } from '@/components/home/HomeActions';
import { HomeCategorySection } from '@/components/home/HomeCategorySection';
import { HomePromoBanner } from '@/components/home/HomePromoBanner';
import { UnauthenticatedLanding } from '@/components/home/UnauthenticatedLanding';
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, doc, orderBy } from 'firebase/firestore';
import { ShoppingBag, Cpu, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  // EFECTO DE AUDIO PREMIUM DE INTRODUCCIÓN
  useEffect(() => {
    if (isUserLoading) {
      const introSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2436/2436-preview.mp3');
      introSound.volume = 0.4;
      introSound.play().catch(() => {
        // Silenciamos si el navegador bloquea el autoplay sin interacción
      });
    }
  }, [isUserLoading]);

  useEffect(() => {
    if (!isUserLoading && user) {
      const savedMode = localStorage.getItem('vitriniando_preferred_mode');
      if (savedMode === 'delivery') {
        router.replace('/delivery/dashboard');
      }
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505] overflow-hidden">
      {/* BARRIDO DORADO ATMOSFÉRICO (Reflejo de pantalla completa) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent skew-x-[-35deg] animate-[shimmer_5s_infinite_ease-in-out]" />
      </div>

      <div className="flex flex-col items-center gap-10 animate-in fade-in zoom-in duration-1000 relative z-10">
        <div className="relative group">
          {/* Aura Dorada de Energía Pulsante (Iluminación del Contenedor) */}
          <div className="absolute inset-0 rounded-[2.5rem] bg-yellow-500/20 animate-pulse [animation-duration:2000ms] blur-3xl" />
          <div className="absolute -inset-10 rounded-[3rem] bg-gradient-to-br from-yellow-400/10 via-transparent to-yellow-600/10 blur-2xl animate-pulse delay-500" />
          
          {/* Contenedor de Icono en Oro Maestro */}
          <div className="relative w-28 h-28 bg-gradient-to-br from-[#fef08a] via-[#eab308] to-[#a16207] rounded-[2.5rem] flex items-center justify-center shadow-[0_0_80px_rgba(234,179,8,0.4)] border-2 border-yellow-200/50 overflow-hidden">
            {/* Rayo de luz interno dinámico */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent animate-shimmer opacity-70" />
            
            <ShoppingBag className="w-14 h-14 text-slate-950 drop-shadow-2xl relative z-10 transition-transform group-hover:scale-110" />
            
            {/* Destellos Premium */}
            <Sparkles className="absolute top-4 right-4 w-6 h-6 text-white animate-pulse" />
            <Sparkles className="absolute bottom-4 left-4 w-4 h-4 text-white/60 animate-pulse delay-300" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 text-center">
          <div className="space-y-3">
            {/* Título en Gradiente Dorado con Reflejo */}
            <h2 className="text-4xl sm:text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#a16207] uppercase leading-none drop-shadow-[0_4px_20px_rgba(234,179,8,0.4)]">
              Vitriniando
            </h2>
            
            <div className="flex flex-col items-center gap-3">
              <p className="text-yellow-500/90 text-[11px] sm:text-xs font-black uppercase tracking-[0.3em] italic max-w-[250px] leading-relaxed drop-shadow-md">
                Lo que necesitas a un clic de distancia
              </p>
              
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map(i => (
                  <div 
                    key={i} 
                    className="w-1.5 h-1.5 rounded-full bg-yellow-500/40 animate-pulse" 
                    style={{ animationDelay: `${i * 200}ms` }} 
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Barra de Progreso en Metal Líquido */}
          <div className="h-1.5 w-48 bg-white/5 rounded-full overflow-hidden relative border border-white/5 shadow-inner">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-800 via-yellow-400 to-yellow-800 animate-progress-loading shadow-[0_0_25px_rgba(234,179,8,0.7)]" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      {user && <Navbar />}
      <main className="flex-1 w-full overflow-x-hidden">
        {user ? (
          <AuthenticatedHome />
        ) : (
          <UnauthenticatedLanding auth={auth} isAdmin={false} user={null} />
        )}
      </main>
    </div>
  );
}

function AuthenticatedHome() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { isAdmin, profile } = useProfile();
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [openStore, setOpenStore] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [base64Image, setBase64Image] = useState<string | null>(null);

  const lockRef = useMemoFirebase(() => doc(firestore, 'appConfig', 'washer_lock'), [firestore]);
  const { data: lockData } = useDoc(lockRef);
  const isWasherOnlyMode = lockData?.active === true;

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
                      <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400" />
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
