
"use client";

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp, doc, query, where, limit, orderBy } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/image-compression';

// Importación de Sub-Módulos Atómicos
import { WasherRentalCard } from './washer-rental/WasherRentalCard';
import { WasherSolicitationDialog } from './washer-rental/solicitation/WasherSolicitationDialog';
import { WasherAdminPricingDialog } from './washer-rental/WasherAdminPricingDialog';
import { AccountRecoveryDialog } from '@/components/auth/AccountRecoveryDialog';

export const checkIsBusinessOpen = (openTime?: string, closeTime?: string) => {
  if (!openTime || !closeTime) return true;
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

  const [openWasher, setOpenWasher] = useState(false);
  const [showAdminPricing, setShowAdminPricing] = useState(false);
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
    
    // Auto-Reapertura SOLO tras redirección Login Google (requiere sessionStorage flag)
    if (typeof window !== 'undefined') {
      const keepOpen = localStorage.getItem('keep_solicitation_open');
      const fromAuth = sessionStorage.getItem('from_google_auth');
      if (keepOpen === 'true' && fromAuth === 'true') {
        localStorage.removeItem('keep_solicitation_open');
        sessionStorage.removeItem('from_google_auth');
        setTimeout(() => setOpenWasher(true), 800);
      }
    }

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
    where('mainCategoryId', '==', 'category-washer'),
    where('status', '==', 'active')
  ), [firestore]);
  const { data: washerStores, isLoading: loadingStores } = useCollection(washerStoresQuery);

  const activeStoresCount = washerStores?.filter(s => {
    const isWasherStore = s.type === 'washer_rental' || s.mainCategoryId === 'category-washer';
    if (!isWasherStore) return false;
    // Si la tienda tiene isOpen=false, está cerrada
    if (s.isOpen === false) return false;
    // Verificar horarios con lógica flexible (soporta openTime/closeTime o operatingHours)
    return checkIsBusinessOpen(s.openTime, s.closeTime);
  }).length || 0;
  const isAnyStoreOpen = activeStoresCount > 0;

  // Consulta de pedidos recientes para Social Proof
  const recentOrdersQuery = useMemoFirebase(() => query(
    collection(firestore, 'orders'),
    where('type', '==', 'WASHER_RENTAL_REQUEST'),
    orderBy('createdAt', 'desc'),
    limit(15)
  ), [firestore]);
  const { data: recentOrders } = useCollection(recentOrdersQuery);

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
        cityId: data.cityId || null,
        cityName: data.cityName || null,
        zoneId: data.zoneId || null,
        updatedAt: serverTimestamp() 
      });

      let finalDirectStoreData = directStoreData;

      // RUTEO INTELIGENTE: Si la solicitud no es directa, buscamos si hay una única tienda elegible en la zona/ciudad
      if (!finalDirectStoreData && washerStores) {
        const eligibleStores = washerStores.filter(store => {
          if (!checkIsBusinessOpen(store.openTime, store.closeTime)) return false;
          if (data.zoneId && store.zoneId !== data.zoneId) return false;
          if (data.cityId && store.cityId !== data.cityId) return false;
          if (data.washerType === 'automatica' && !store.hasAutomatic) return false;
          if (data.washerType === 'semiautomatica' && !store.hasSemiautomatic) return false;
          return true;
        });

        // Si solo hay una tienda que cumpla las condiciones, ruteo directo
        if (eligibleStores.length === 1) {
          finalDirectStoreData = {
            id: eligibleStores[0].id,
            name: eligibleStores[0].name,
            ownerId: eligibleStores[0].ownerId
          };
        }
      }

      const isDirectFinal = !!finalDirectStoreData;
      const participants = [user.uid];
      if (isDirectFinal) participants.push(finalDirectStoreData!.ownerId);
      else participants.push('ADMIN_WASHER_POOL');

      await setDocumentNonBlocking(orderRef, {
        id: orderRef.id,
        customerId: user.uid,
        customerName: data.customerName,
        customerPhone: data.customerPhone, 
        customerAddress: data.customerAddress, 
        customerSector: data.customerSector,
        cityId: data.cityId || null,
        cityName: data.cityName || null,
        zoneId: data.zoneId || null,
        zoneName: data.zoneName || null,
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
        isLogisticsPublic: !isDirectFinal,
        isDirectRequest: isDirectFinal,
        storeId: isDirectFinal ? finalDirectStoreData!.id : null,
        storeName: isDirectFinal ? finalDirectStoreData!.name : null,
        storeOwnerId: isDirectFinal ? finalDirectStoreData!.ownerId : null,
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
        activeStoresCount={activeStoresCount} recentOrders={recentOrders || []} userRole={profile?.role || 'cliente'}
        isUploadingBanner={isUploadingBanner} isLocked={lockData?.active === true}
        onToggleLock={handleToggleLock} onOpenSolicitation={() => { setDirectStoreData(null); setOpenWasher(true); }}
        onBannerUpload={handleBannerUpload}
      />
      <WasherSolicitationDialog 
        isOpen={openWasher} onOpenChange={(v) => { if(!v) setDirectStoreData(null); setOpenWasher(v); }} isAdmin={isAdmin}
        profile={profile} pricingConfig={pricingConfig} isAnyStoreOpen={isAnyStoreOpen}
        activeStores={washerStores || []}
        onOpenAdminSettings={() => setShowAdminPricing(true)} onSubmitRequest={handleWasherRequest}
      />
      <WasherAdminPricingDialog isOpen={showAdminPricing} onOpenChange={setShowAdminPricing} pricingConfig={pricingConfig} onUpdatePricing={handleUpdatePricing} />
      <AccountRecoveryDialog />
    </div>
  );
}
