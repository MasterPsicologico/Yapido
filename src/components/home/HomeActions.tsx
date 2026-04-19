
"use client";

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc, query, where } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { compressImage } from '@/lib/image-compression';

// Importación de Sub-Módulos Atómicos
import { WasherRentalCard } from './washer-rental/WasherRentalCard';
import { WasherSolicitationDialog } from './washer-rental/solicitation/WasherSolicitationDialog';
import { WasherAdminPricingDialog } from './washer-rental/WasherAdminPricingDialog';
import { WasherStoreCreationDialog } from './washer-rental/WasherStoreCreationDialog';

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

export function HomeActions({ isAdmin, profile, openStore, setOpenStore }: HomeActionsProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [openWasher, setOpenWasher] = useState(false);
  const [openAddWasherStore, setOpenAddWasherStore] = useState(false);
  const [showAdminPricing, setShowAdminPricing] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [directStoreData, setDirectStoreData] = useState<{id: string, name: string, ownerId: string} | null>(null);

  // Escuchar evento de Solicitud Directa desde StoreCard
  useEffect(() => {
    const handleDirect = (e: any) => {
      const { storeId, storeName, ownerId } = e.detail;
      setDirectStoreData({ id: storeId, name: storeName, ownerId });
      setOpenWasher(true);
    };
    window.addEventListener('open-direct-solicitation' as any, handleDirect);
    return () => window.removeEventListener('open-direct-solicitation' as any, handleDirect);
  }, []);

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
    const nextState = !lockData?.active;
    await setDocumentNonBlocking(lockRef, { active: nextState, updatedAt: serverTimestamp(), updatedBy: user?.uid }, { merge: true });
    toast({ title: nextState ? "Modo Enfoque Activado" : "Marketplace Restaurado" });
  };

  const handleWasherRequest = async (data: any): Promise<string | undefined> => {
    if (!user || !firestore) {
      toast({ title: "Sesión requerida", description: "Inicia sesión para solicitar.", variant: "destructive" });
      return undefined;
    }
    
    try {
      const orderRef = doc(collection(firestore, 'orders'));
      
      updateDocumentNonBlocking(doc(firestore, 'users', user.uid), { 
        displayName: data.customerName, 
        address: data.customerAddress, 
        sector: data.customerSector,
        phoneNumber: data.customerPhone, 
        updatedAt: serverTimestamp() 
      });

      const isDirect = !!directStoreData;
      const participants = [user.uid];
      if (isDirect) participants.push(directStoreData!.ownerId);
      else participants.push('ADMIN_WASHER_POOL');

      await setDocumentNonBlocking(orderRef, {
        id: orderRef.id,
        customerId: user.uid,
        customerName: data.customerName,
        customerPhone: data.customerPhone, 
        customerAddress: data.customerAddress, 
        customerSector: data.customerSector,   
        type: 'WASHER_RENTAL_REQUEST',
        status: 'pending', 
        requestHours: data.requestHours,
        totalPrice: data.totalPrice,
        paymentMethod: data.paymentMethod,
        washerType: data.washerType,
        floor: data.floor,
        hasElevator: data.hasElevator,
        hasStairs: data.hasStairs,
        stairCount: data.stairCount,
        createdAt: serverTimestamp(), 
        updatedAt: serverTimestamp(),
        participants: participants, 
        isLogisticsPublic: !isDirect,
        isDirectRequest: isDirect,
        storeId: isDirect ? directStoreData!.id : null,
        storeName: isDirect ? directStoreData!.name : null,
        storeOwnerId: isDirect ? directStoreData!.ownerId : null,
        productName: `Alquiler ${data.washerType === 'automatica' ? 'Auto' : 'Semi'} (${data.requestHours}h)`,
      }, { merge: true });

      return orderRef.id;
    } catch (e) {
      toast({ title: "Fallo de conexión", description: "Inténtalo de nuevo.", variant: "destructive" });
      return undefined;
    }
  };

  const handleUpdatePricing = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin) return;
    const fd = new FormData(e.currentTarget);
    await setDocumentNonBlocking(pricingRef, {
      minHours: Number(fd.get('minHours')), rateAuto: Number(fd.get('rateAuto')),
      rateSemi: Number(fd.get('rateSemi')), floorFee: Number(fd.get('floorFee')),
      stairsFee: Number(fd.get('stairsFee')), updatedAt: serverTimestamp()
    }, { merge: true });
    toast({ title: "Economía Sincronizada" });
    setShowAdminPricing(false);
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

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'mobile' | 'pc') => {
    const file = e.target.files?.[0];
    if (!file || !isAdmin) return;
    setIsUploadingBanner(true);
    try {
      const compressed = await compressImage(file, target === 'mobile' ? 1200 : 1920, target === 'mobile' ? 1600 : 1080, 0.85);
      const updateKey = target === 'mobile' ? 'backgroundImage' : 'backgroundImageDesktop';
      await setDocumentNonBlocking(bannerConfigRef, { [updateKey]: compressed, updatedAt: serverTimestamp() }, { merge: true });
      toast({ title: `Portada ${target === 'mobile' ? 'Móvil' : 'PC'} actualizada` });
    } catch (error) {
      toast({ title: "Error al subir", variant: "destructive" });
    } finally {
      setIsUploadingBanner(false);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <WasherRentalCard 
        isAdmin={isAdmin} bannerConfig={bannerConfig} isAnyStoreOpen={isAnyStoreOpen}
        isUploadingBanner={isUploadingBanner} isLocked={lockData?.active === true}
        onToggleLock={handleToggleLock} onOpenSolicitation={() => { setDirectStoreData(null); setOpenWasher(true); }}
        onOpenStoreCreation={() => setOpenAddWasherStore(true)} onBannerUpload={handleBannerUpload}
      />
      <WasherSolicitationDialog 
        isOpen={openWasher} onOpenChange={(v) => { if(!v) setDirectStoreData(null); setOpenWasher(v); }} isAdmin={isAdmin}
        profile={profile} pricingConfig={pricingConfig} isAnyStoreOpen={isAnyStoreOpen}
        onOpenAdminSettings={() => setShowAdminPricing(true)} onSubmitRequest={handleWasherRequest}
      />
      <WasherAdminPricingDialog isOpen={showAdminPricing} onOpenChange={setShowAdminPricing} pricingConfig={pricingConfig} onUpdatePricing={handleUpdatePricing} />
      <WasherStoreCreationDialog isOpen={openAddWasherStore} onOpenChange={setOpenAddWasherStore} profile={profile} isSending={isSendingRequest} onCreateStore={handleCreateWasherStore} />
    </div>
  );
}
