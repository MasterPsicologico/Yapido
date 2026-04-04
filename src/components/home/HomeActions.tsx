
"use client";

import { useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, updateDocumentNonBlocking, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc, query, where } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { compressImage } from '@/lib/image-compression';

// Importación de Sub-Módulos Atómicos
import { WasherRentalCard } from './washer-rental/WasherRentalCard';
import { WasherSolicitationDialog } from './washer-rental/WasherSolicitationDialog';
import { WasherAdminPricingDialog } from './washer-rental/WasherAdminPricingDialog';
import { WasherStoreCreationDialog } from './washer-rental/WasherStoreCreationDialog';

interface HomeActionsProps {
  isAdmin: boolean;
  profile: any;
  openCategory: boolean;
  setOpenCategory: (v: boolean) => void;
  openStore: boolean;
  setOpenStore: (v: boolean) => void;
  editingCategory: any | null;
  mainCategories: any[] | null;
  base64Image: string | null;
  setBase64Image: (v: string | null) => void;
  isRegistering: boolean;
  isCompressing: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCategorySubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onStoreSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const WASHER_BANNER_CACHE_KEY = 'vitriniando_washer_banner_cache';

export const checkIsBusinessOpen = (openTime?: string, closeTime?: string) => {
  if (!openTime || !closeTime) return false;
  const now = new Date();
  const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;
  if (closeMinutes < openMinutes) return currentTotalMinutes >= openMinutes || currentTotalMinutes < closeMinutes;
  return currentTotalMinutes >= openMinutes && currentTotalMinutes < closeMinutes;
};

export function HomeActions({
  isAdmin, profile, openStore, setOpenStore, mainCategories, onStoreSubmit
}: HomeActionsProps) {
  
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [openWasher, setOpenWasher] = useState(false);
  const [openAddWasherStore, setOpenAddWasherStore] = useState(false);
  const [showAdminPricing, setShowAdminPricing] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // FETCH: Candado de Enfoque
  const lockRef = useMemoFirebase(() => doc(firestore, 'appConfig', 'washer_lock'), [firestore]);
  const { data: lockData } = useDoc(lockRef);

  const pricingRef = useMemoFirebase(() => doc(firestore, 'appConfig', 'washer_pricing'), [firestore]);
  const { data: pricingConfig } = useDoc(pricingRef);

  const bannerConfigRef = useMemoFirebase(() => doc(firestore, 'appConfig', 'washer_banner'), [firestore]);
  const { data: bannerConfig } = useDoc(bannerConfigRef);

  const washerStoresQuery = useMemoFirebase(() => query(
    collection(firestore, 'stores'), 
    where('type', '==', 'washer_rental'),
    where('status', '==', 'active')
  ), [firestore]);
  const { data: washerStores } = useCollection(washerStoresQuery);

  const isAnyStoreOpen = washerStores?.some(s => checkIsBusinessOpen(s.openTime, s.closeTime)) || false;

  const handleToggleLock = async () => {
    if (!isAdmin || !firestore) return;
    try {
      const nextState = !lockData?.active;
      await setDocumentNonBlocking(lockRef, { 
        active: nextState, 
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid
      }, { merge: true });
      
      toast({ 
        title: nextState ? "Modo Enfoque Activado" : "Marketplace Restaurado",
        description: nextState ? "Solo se muestra Alquiler de Lavadoras en móvil." : "Todo el contenido es visible ahora.",
        className: nextState ? "bg-slate-900 text-white" : "bg-green-600 text-white"
      });
    } catch (e) {
      toast({ title: "Error al cambiar estado", variant: "destructive" });
    }
  };

  const handleWasherRequest = async (data: any) => {
    if (!user || !firestore) return;
    try {
      updateDocumentNonBlocking(doc(firestore, 'users', user.uid), { 
        displayName: data.customerName, address: data.customerAddress, phoneNumber: data.customerPhone, updatedAt: serverTimestamp() 
      });

      await addDocumentNonBlocking(collection(firestore, 'orders'), {
        customerId: user.uid, 
        customerName: data.customerName, 
        customerPhone: data.customerPhone, 
        customerAddress: data.customerAddress,
        type: 'WASHER_RENTAL_REQUEST', 
        status: 'pending', 
        requestHours: data.requestHours, 
        totalPrice: data.totalPrice,
        paymentMethod: data.paymentMethod,
        washerType: data.washerType,
        floor: data.floor,
        hasElevator: data.hasElevator,
        needsInstallation: data.needsInstallation,
        routeType: data.routeType,
        hasStairs: data.hasStairs,
        createdAt: serverTimestamp(), 
        updatedAt: serverTimestamp(),
        participants: [user.uid, 'ADMIN_WASHER_POOL'], 
        isLogisticsPublic: true, 
        productName: `Alquiler ${data.washerType === 'automatica' ? 'Auto' : 'Semi'} (${data.requestHours}h)`,
      });
      toast({ title: "¡Solicitud Enviada!", className: "bg-green-600 text-white border-none" });
      setOpenWasher(false);
    } catch (e) {
      toast({ title: "Error al procesar", variant: "destructive" });
    }
  };

  const handleUpdatePricing = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin) return;
    const fd = new FormData(e.currentTarget);
    try {
      await setDocumentNonBlocking(pricingRef, {
        minHours: Number(fd.get('minHours')), 
        rateAuto: Number(fd.get('rateAuto')),
        rateSemi: Number(fd.get('rateSemi')),
        floorFee: Number(fd.get('floorFee')),
        stairsFee: Number(fd.get('stairsFee')),
        installFee: Number(fd.get('installFee')),
        roundTripFee: Number(fd.get('roundTripFee')),
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast({ title: "Economía Sincronizada" });
      setShowAdminPricing(false);
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleCreateWasherStore = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !firestore) return;
    setIsSendingRequest(true);
    const fd = new FormData(e.currentTarget);
    try {
      const storeRef = doc(collection(firestore, 'stores'));
      await setDocumentNonBlocking(storeRef, {
        id: storeRef.id, ownerId: user.uid, name: fd.get('name'), phoneNumber: fd.get('phone'), 
        address: fd.get('address'), openTime: fd.get('openTime'), closeTime: fd.get('closeTime'),
        mainCategoryId: 'category-washer', type: 'washer_rental', status: 'active', createdAt: serverTimestamp(),
        imageUrl: `https://picsum.photos/seed/${storeRef.id}/800/600`, driverCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        privateDrivers: []
      }, { merge: true });
      if (profile?.role === 'cliente') updateDocumentNonBlocking(doc(firestore, 'users', user.uid), { role: 'dueño', updatedAt: serverTimestamp() });
      toast({ title: "¡Vitrina Lanzada!" });
      setOpenAddWasherStore(false);
      router.push(`/admin/washer/${storeRef.id}`);
    } catch (e) {
      toast({ title: "Error al registrar", variant: "destructive" });
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isAdmin) return;
    setIsUploadingBanner(true);
    try {
      const compressed = await compressImage(file, 1920, 1080, 0.8);
      localStorage.setItem(WASHER_BANNER_CACHE_KEY, compressed);
      setDocumentNonBlocking(bannerConfigRef, { backgroundImage: compressed, updatedAt: serverTimestamp() }, { merge: true });
      toast({ title: "Portada actualizada" });
    } catch (error) {
      toast({ title: "Fallo en carga", variant: "destructive" });
    } finally {
      setIsUploadingBanner(false);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <WasherRentalCard 
        isAdmin={isAdmin}
        bannerConfig={bannerConfig}
        isAnyStoreOpen={isAnyStoreOpen}
        isUploadingBanner={isUploadingBanner}
        isLocked={lockData?.active === true}
        onToggleLock={handleToggleLock}
        onOpenSolicitation={() => setOpenWasher(true)}
        onOpenStoreCreation={() => setOpenAddWasherStore(true)}
        onBannerUpload={handleBannerUpload}
      />

      <WasherSolicitationDialog 
        isOpen={openWasher}
        onOpenChange={setOpenWasher}
        isAdmin={isAdmin}
        profile={profile}
        pricingConfig={pricingConfig}
        isAnyStoreOpen={isAnyStoreOpen}
        onOpenAdminSettings={() => setShowAdminPricing(true)}
        onSubmitRequest={handleWasherRequest}
      />

      <WasherAdminPricingDialog 
        isOpen={showAdminPricing}
        onOpenChange={setShowAdminPricing}
        pricingConfig={pricingConfig}
        onUpdatePricing={handleUpdatePricing}
      />

      <WasherStoreCreationDialog 
        isOpen={openAddWasherStore}
        onOpenChange={setOpenAddWasherStore}
        profile={profile}
        isSending={isSendingRequest}
        onCreateStore={handleCreateWasherStore}
      />
    </div>
  );
}
