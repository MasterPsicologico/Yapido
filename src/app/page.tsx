
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { HomeActions } from '@/components/home/HomeActions';
import { HomeCategorySection } from '@/components/home/HomeCategorySection';
import { HomePromoBanner } from '@/components/home/HomePromoBanner';
import { UnauthenticatedLanding } from '@/components/home/UnauthenticatedLanding';
import { StoreCard } from '@/components/store/StoreCard';
import { useUser, useAuth, useFirestore, useCollection, useDoc, useMemoFirebase, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/image-compression';
import { ShoppingBag, SearchX, Search, Cpu, ArrowRight, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      const savedMode = localStorage.getItem('vitriniando_preferred_mode');
      if (savedMode === 'delivery') {
        router.replace('/delivery/dashboard');
      }
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0a]">
      <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-700">
        <div className="relative">
          <div className="absolute inset-0 rounded-[2.5rem] bg-primary/20 animate-ping duration-[2000ms]" />
          <div className="relative w-24 h-24 bg-primary rounded-[2.5rem] flex items-center justify-center text-white shadow-[0_20px_50px_rgba(59,130,246,0.3)] border border-white/10">
            <ShoppingBag className="w-12 h-12" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="space-y-1">
            <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none">Vitriniando</h2>
            <p className="text-primary/60 text-[10px] font-black uppercase tracking-[0.4em] translate-x-1">Cargando Experiencia</p>
          </div>
          <div className="h-1 w-32 bg-white/5 rounded-full overflow-hidden relative">
            <div className="absolute inset-0 bg-primary animate-progress-loading" />
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
  
  const [searchTerm, setSearchTerm] = useState("");
  const [openStore, setOpenStore] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [isImageRemoved, setIsImageRemoved] = useState(false);

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
        const comp = await compressImage(file); 
        setBase64Image(comp); 
        setIsImageRemoved(false);
      }
      catch (e) { toast({ title: "Error de imagen" }); }
      finally { setIsCompressing(false); }
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin) return;
    const fd = new FormData(e.currentTarget);
    const name = fd.get('name') as string;
    const description = fd.get('description') as string;
    setIsRegistering(true);
    try {
      if (editingCategory) {
        const ref = doc(firestore, 'mainCategories', editingCategory.id);
        const data: any = { name, description, updatedAt: serverTimestamp() };
        if (base64Image) data.imageUrl = base64Image;
        updateDocumentNonBlocking(ref, data);
      } else {
        const ref = doc(collection(firestore, 'mainCategories'));
        setDocumentNonBlocking(ref, { id: ref.id, name, description, imageUrl: base64Image, createdAt: serverTimestamp() }, { merge: true });
      }
      setOpenCategory(false); setEditingCategory(null); setBase64Image(null);
    } catch (e) { toast({ title: "Error" }); }
    finally { setIsRegistering(false); }
  };

  const handleStoreSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const mainCategoryId = fd.get('mainCategoryId');
    const name = fd.get('name');
    const address = fd.get('address');
    
    setIsRegistering(true);
    try {
      const ref = doc(collection(firestore, 'stores'));
      setDocumentNonBlocking(ref, { id: ref.id, ownerId: user.uid, mainCategoryId, name, address, status: 'active', createdAt: serverTimestamp(), imageUrl: `https://picsum.photos/seed/${ref.id}/800/600` }, { merge: true });
      const userRef = doc(firestore, 'users', user.uid);
      updateDocumentNonBlocking(userRef, { role: 'dueño', updatedAt: serverTimestamp() });
      setOpenStore(false);
      toast({ title: "Vitrina registrada con éxito" });
    } catch (e) { toast({ title: "Error al registrar vitrina" }); }
    finally { setIsRegistering(false); }
  };

  return (
    <div className="w-full space-y-8">
      {/* SECCIÓN DE ACCIÓN PRINCIPAL: Banner 100% ancho sin márgenes */}
      <HomeActions 
        isAdmin={isAdmin}
        profile={profile}
        openCategory={openCategory} 
        setOpenCategory={(val) => { setOpenCategory(val); if(!val) setIsImageRemoved(false); }} 
        openStore={openStore} 
        setOpenStore={setOpenStore}
        editingCategory={editingCategory} 
        mainCategories={mainCategories} 
        base64Image={base64Image} 
        setBase64Image={setBase64Image}
        isImageRemoved={isImageRemoved}
        setIsImageRemoved={setIsImageRemoved}
        isRegistering={isRegistering} 
        isCompressing={isCompressing} 
        onImageUpload={handleImageUpload} 
        onCategorySubmit={handleCategorySubmit} 
        onStoreSubmit={handleStoreSubmit}
      />

      {isAdmin && (
        <section className="px-4 sm:px-8">
          <Link href="/admin/agents">
            <Card className="border-none rounded-[40px] bg-slate-900 text-white overflow-hidden shadow-2xl group hover:scale-[1.01] transition-all duration-500 cursor-pointer relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-primary/20 transition-colors" />
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
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Estado Global</span>
                    <span className="text-sm font-black text-green-400 italic">ACTIVO • 16 ESPECIALISTAS</span>
                  </div>
                  <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </section>
      )}

      <HomeCategorySection 
        isAdmin={isAdmin} 
        categories={filteredData.categories} 
        isLoading={loadingCategories} 
        onEdit={(c) => { 
          setEditingCategory(c); 
          setOpenCategory(true); 
          setIsImageRemoved(false);
          setBase64Image(null);
        }} 
      />
      
      {!searchTerm && <HomePromoBanner onAction={() => setOpenStore(true)} />}
    </div>
  );
}
