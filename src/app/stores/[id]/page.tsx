"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { StoreHeader } from '@/components/store/view/StoreHeader';
import { StoreInfo } from '@/components/store/view/StoreInfo';
import { StoreHighlights } from '@/components/store/view/StoreHighlights';
import { StoreStats } from '@/components/store/view/StoreStats';
import { StoreContactContainer } from '@/components/store/view/StoreContactContainer';
import { StoreOwnerActions } from '@/components/store/view/StoreOwnerActions';
import { StoreProductsSection } from '@/components/store/view/StoreProductsSection';
import { 
  ChevronRight,
  Loader2, 
  Store as StoreIcon,
  Eye,
  EyeOff
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, setDocumentNonBlocking, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, doc, query, serverTimestamp, where, getDocs, addDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/image-compression';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { OrderChat } from '@/components/chat/OrderChat';
import { cn } from '@/lib/utils';

export default function StorePage() {
  const params = useParams();
  const id = params?.id as string;
  const { user, isAdmin } = useProfile();
  const firestore = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const storeRef = useMemoFirebase(() => (!firestore || !id) ? null : doc(firestore, 'stores', id), [firestore, id]);
  const { data: store, isLoading: loadingStore } = useDoc(storeRef);

  const ownerRef = useMemoFirebase(() => (!firestore || !store?.ownerId) ? null : doc(firestore, 'users', store.ownerId), [firestore, store?.ownerId]);
  const { data: ownerProfile } = useDoc(ownerRef);

  const catQ = useMemoFirebase(() => !id ? null : query(collection(firestore, 'stores', id, 'categories')), [firestore, id]);
  const { data: categories } = useCollection(catQ);

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);
  const [isCompressingProduct, setIsCompressingProduct] = useState(false);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [prodDialogOpen, setProdDialogOpen] = useState(false);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [updatingImage, setUpdatingImage] = useState<string | null>(null);
  const [internalChatOrder, setInternalChatOrder] = useState<any | null>(null);

  if (!mounted || loadingStore) return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-md">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">Cargando Vitrina</p>
      </div>
    </div>
  );

  if (!store && !loadingStore) return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4">
      <Navbar />
      <div className="text-center space-y-4">
        <StoreIcon className="w-16 h-16 mx-auto text-muted-foreground opacity-20" />
        <h2 className="text-2xl font-bold italic text-slate-400">Vitrina no encontrada</h2>
        <Link href="/">
          <Button className="rounded-full">Volver al Inicio</Button>
        </Link>
      </div>
    </div>
  );

  const canEdit = user?.uid === store?.ownerId || isAdmin;
  const effectivePhoneNumber = store?.phoneNumber || ownerProfile?.phoneNumber;

  const handleOpenInternalChat = async () => {
    if (!user || !store || !firestore) {
      toast({ title: "Inicia sesión", description: "Para chatear con el negocio.", variant: "destructive" });
      return;
    }

    try {
      const q = query(
        collection(firestore, 'orders'),
        where('customerId', '==', user.uid),
        where('storeId', '==', id),
        where('status', '==', 'inquiry')
      );
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        setInternalChatOrder({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        const inquiryData = {
          customerId: user.uid,
          customerName: user.displayName || 'Cliente',
          customerPhone: user.phoneNumber || '',
          storeId: id,
          storeName: store.name,
          storeOwnerId: store.ownerId,
          participants: [user.uid, store.ownerId],
          status: 'inquiry',
          productName: 'Consulta en Vitrina',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isLogisticsPublic: false
        };
        const docRef = await addDoc(collection(firestore, 'orders'), inquiryData);
        setInternalChatOrder({ id: docRef.id, ...inquiryData });
      }
    } catch (e) {
      toast({ title: "Error al conectar chat", variant: "destructive" });
    }
  };

  const handleUpdateImage = async (e: React.ChangeEvent<HTMLInputElement>, field: string, index?: number) => {
    const file = e.target.files?.[0];
    if (!file || !storeRef) return;
    const loadingId = index !== undefined ? `highlight-${index}` : 'main';
    setUpdatingImage(loadingId);
    try {
      const compressed = await compressImage(file, 1200, 1200, 0.85);
      if (index !== undefined) {
        const h = store?.highlights || [1, 2, 3].map(i => `https://picsum.photos/seed/${i}/300`);
        const newH = [...h]; newH[index] = compressed;
        updateDocumentNonBlocking(storeRef, { highlights: newH, updatedAt: serverTimestamp() });
      } else {
        updateDocumentNonBlocking(storeRef, { [field]: compressed, updatedAt: serverTimestamp() });
      }
      toast({ title: "¡Actualizado!" });
    } catch (e) { toast({ title: "Error", variant: "destructive" }); }
    finally { setUpdatingImage(null); }
  };

  const handleUpdateInfo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canEdit || !storeRef) return;
    const formData = new FormData(e.currentTarget);
    const data = { name: formData.get('name'), description: formData.get('description'), address: formData.get('address'), phoneNumber: formData.get('phoneNumber'), updatedAt: serverTimestamp() };
    setIsUpdatingInfo(true);
    try { updateDocumentNonBlocking(storeRef, data); toast({ title: "Info Actualizada" }); setInfoDialogOpen(false); }
    catch (e) { toast({ title: "Error", variant: "destructive" }); }
    finally { setIsUpdatingInfo(false); }
  };

  const handleToggleFeatures = () => {
    if (!canEdit || !storeRef) return;
    updateDocumentNonBlocking(storeRef, {
      featuresHidden: !store?.featuresHidden,
      updatedAt: serverTimestamp()
    });
    toast({ 
      title: store?.featuresHidden ? "Sección Visible" : "Sección Oculta"
    });
  };

  const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id || !firestore) return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    
    setIsAddingCategory(true);
    try {
      const catColRef = collection(firestore, 'stores', id, 'categories');
      addDocumentNonBlocking(catColRef, {
        name,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Sección creada exitosamente" });
      setCatDialogOpen(false);
    } catch (e) {
      toast({ title: "Error al crear sección", variant: "destructive" });
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressingProduct(true);
      try {
        const comp = await compressImage(file);
        setProductImage(comp);
        toast({ title: "Imagen lista" });
      } catch (err) {
        toast({ title: "Error al procesar", variant: "destructive" });
      } finally {
        setIsCompressingProduct(false);
      }
    }
  };

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id || !firestore || !store) return;
    if (!productImage) {
      toast({ title: "Falta la imagen", variant: "destructive" });
      return;
    }
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const price = Number(formData.get('price'));
    const description = formData.get('description') as string;
    const categoryId = formData.get('categoryId') as string;

    if (!categoryId) {
      toast({ title: "Selecciona una sección", variant: "destructive" });
      return;
    }

    setIsAddingProduct(true);
    try {
      const prodColRef = collection(firestore, 'products');
      const ownerId = store.ownerId || user?.uid;
      
      addDocumentNonBlocking(prodColRef, {
        name,
        price,
        description,
        imageUrl: productImage,
        status: 'available',
        storeId: id,
        storeName: store.name || 'Negocio Local',
        storeOwnerId: ownerId,
        categoryId: categoryId,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Producto publicado" });
      setProdDialogOpen(false);
      setProductImage(null);
    } catch (e) {
      toast({ title: "Error al publicar", variant: "destructive" });
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleWhatsAppOpen = () => {
    const phone = effectivePhoneNumber;
    if (!phone) {
      toast({ title: "Teléfono no disponible", variant: "destructive" });
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const message = `¡Hola! 👋 Te contacto desde Vitriniando. Me interesa tu vitrina *${store.name}*.`;
    const url = `https://wa.me/${cleanPhone.startsWith('57') ? cleanPhone : '57' + cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f3f4f6]">
      <Navbar />
      <main className="flex-1 pb-20">
        <StoreHeader 
          imageUrl={store?.imageUrl} name={store?.name} mainCategoryId={store?.mainCategoryId} 
          isOwner={canEdit} updatingImage={updatingImage} onUpdateImage={handleUpdateImage} onOpenInfo={() => setInfoDialogOpen(true)}
        />

        <div className="container mx-auto max-w-xl px-0 -mt-24 relative z-20">
          <div className="bg-white shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.2)] overflow-hidden">
            <div className="p-8 md:p-10 space-y-10">
              <StoreInfo name={store?.name} description={store?.description} />
              
              <div className="relative group/features space-y-10">
                {canEdit && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleToggleFeatures}
                    className="absolute -top-6 right-0 z-30 h-8 w-8 rounded-full bg-slate-100/50 backdrop-blur-sm border border-slate-200 text-slate-500 hover:bg-primary hover:text-white transition-all shadow-sm"
                  >
                    {store?.featuresHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                )}

                {(!store?.featuresHidden || canEdit) && (
                  <div className={cn(
                    "space-y-10 transition-all duration-500",
                    store?.featuresHidden && "opacity-40 grayscale blur-[2px] pointer-events-none"
                  )}>
                    <StoreHighlights 
                      highlights={store?.highlights} 
                      isOwner={canEdit} 
                      updatingImage={updatingImage} 
                      onUpdateHighlight={(e, i) => handleUpdateImage(e, 'highlights', i)} 
                    />
                    <StoreStats 
                      stats={store?.customStats} 
                      isOwner={canEdit} 
                      storeId={id}
                    />
                  </div>
                )}
              </div>

              <StoreContactContainer 
                address={store?.address} 
                phoneNumber={effectivePhoneNumber} 
                onOpenChat={handleWhatsAppOpen}
                onOpenInternalChat={handleOpenInternalChat}
              />

              {canEdit && (
                <StoreOwnerActions 
                  catDialogOpen={catDialogOpen} setCatDialogOpen={setCatDialogOpen}
                  prodDialogOpen={prodDialogOpen} setProdDialogOpen={setProdDialogOpen}
                  isAddingCategory={isAddingCategory} isAddingProduct={isAddingProduct} isCompressingProduct={isCompressingProduct}
                  productImage={productImage} setProductImage={setProductImage}
                  categories={categories} 
                  onAddCategory={handleAddCategory} 
                  onAddProduct={handleAddProduct} 
                  onProductImageUpload={handleProductImageUpload}
                />
              )}

              <StoreProductsSection storeId={id} categories={categories} />
            </div>
          </div>
        </div>
      </main>

      {/* DIÁLOGO BLINDADO PARA CHAT INTERNO EN VITRINA */}
      <Dialog open={!!internalChatOrder} onOpenChange={v => !v && setInternalChatOrder(null)}>
        <DialogContent className="p-0 border-none bg-white shadow-none max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 sm:p-4 md:p-8 flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Chat con la Tienda</DialogTitle>
            <DialogDescription>Conversación privada.</DialogDescription>
          </DialogHeader>
          {internalChatOrder && (
            <div className="flex-1 min-h-0 w-full animate-in zoom-in duration-300">
              <OrderChat orderId={internalChatOrder.id} orderData={internalChatOrder} onClose={() => setInternalChatOrder(null)} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-2xl font-black italic">Info de Vitrina</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdateInfo} className="space-y-4 pt-4">
            <div className="space-y-2"><Label>Nombre</Label><Input name="name" defaultValue={store?.name} required /></div>
            <div className="space-y-2"><Label>Descripción</Label><Textarea name="description" defaultValue={store?.description} required /></div>
            <div className="space-y-2"><Label>Teléfono</Label><Input name="phoneNumber" defaultValue={store?.phoneNumber} /></div>
            <div className="space-y-2"><Label>Dirección</Label><Input name="address" defaultValue={store?.address} /></div>
            <Button type="submit" className="w-full h-12 font-bold" disabled={isUpdatingInfo}>{isUpdatingInfo ? <Loader2 className="animate-spin" /> : "Guardar"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
