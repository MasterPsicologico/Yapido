
"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { HomeHeader } from '@/components/home/HomeHeader';
import { HomeActions } from '@/components/home/HomeActions';
import { HomeCategorySection } from '@/components/home/HomeCategorySection';
import { HomePromoBanner } from '@/components/home/HomePromoBanner';
import { UnauthenticatedLanding } from '@/components/home/UnauthenticatedLanding';
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, query, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/image-compression';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  // EFECTO QUIRÚRGICO: Sincroniza el perfil del usuario con Firestore al iniciar sesión
  useEffect(() => {
    if (user && firestore) {
      const userRef = doc(firestore, 'users', user.uid);
      // Solo actualizamos datos básicos para no sobreescribir el ROL si ya fue asignado
      setDocumentNonBlocking(userRef, {
        id: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLogin: serverTimestamp(),
      }, { merge: true });
    }
  }, [user, firestore]);

  if (isUserLoading) return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 w-full px-4 py-12">
        <Skeleton className="h-12 w-1/3 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-lg" />)}
        </div>
      </main>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc]">
      <Navbar />
      <main className="flex-1 w-full overflow-x-hidden">
        {user ? <AuthenticatedHome /> : <UnauthenticatedLanding auth={auth} />}
      </main>
    </div>
  );
}

function AuthenticatedHome() {
  const firestore = useFirestore();
  const { isAdmin } = useProfile();
  
  const [openStore, setOpenStore] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [base64Image, setBase64Image] = useState<string | null>(null);

  const catQ = useMemoFirebase(() => query(collection(firestore, 'mainCategories'), orderBy('createdAt', 'desc')), [firestore]);
  const { data: mainCategories, isLoading: loadingCategories } = useCollection(catQ);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try { const comp = await compressImage(file); setBase64Image(comp); }
      catch (e) { toast({ title: "Error de imagen" }); }
      finally { setIsCompressing(false); }
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin) {
      toast({ title: "Acceso Denegado", description: "Solo el administrador puede crear categorías.", variant: "destructive" });
      return;
    }
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
    const fd = new FormData(e.currentTarget);
    const mainCategoryId = fd.get('mainCategoryId');
    const name = fd.get('name');
    const address = fd.get('address');
    
    setIsRegistering(true);
    try {
      const ref = doc(collection(firestore, 'stores'));
      setDocumentNonBlocking(ref, { 
        id: ref.id, 
        ownerId: (window as any).__USER_ID__, 
        mainCategoryId, 
        name, 
        address, 
        status: 'active', 
        createdAt: serverTimestamp() ,
        imageUrl: `https://picsum.photos/seed/${ref.id}/800/600`
      }, { merge: true });
      setOpenStore(false);
    } catch (e) { toast({ title: "Error" }); }
    finally { setIsRegistering(false); }
  };

  return (
    <div className="w-full py-6 sm:py-10 space-y-8">
      <div className="px-4 sm:px-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <HomeHeader />
        <HomeActions 
          isAdmin={isAdmin}
          openCategory={openCategory} setOpenCategory={setOpenCategory} openStore={openStore} setOpenStore={setOpenStore}
          editingCategory={editingCategory} mainCategories={mainCategories} base64Image={base64Image} setBase64Image={setBase64Image}
          isRegistering={isRegistering} isCompressing={isCompressing} onImageUpload={handleImageUpload} onCategorySubmit={handleCategorySubmit} onStoreSubmit={handleStoreSubmit}
        />
      </div>
      <HomeCategorySection isAdmin={isAdmin} categories={mainCategories} isLoading={loadingCategories} onEdit={(c) => { setEditingCategory(c); setOpenCategory(true); }} />
      <HomePromoBanner onAction={() => setOpenStore(true)} />
    </div>
  );
}
