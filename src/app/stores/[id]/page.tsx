
"use client";

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { StoreHeader } from '@/components/store/view/StoreHeader';
import { StoreInfo } from '@/components/store/view/StoreInfo';
import { StoreHighlights } from '@/components/store/view/StoreHighlights';
import { StoreStats } from '@/components/store/view/StoreStats';
import { StoreContactContainer } from '@/components/store/view/StoreContactContainer';
import { StoreWhatsAppChat } from '@/components/store/view/StoreWhatsAppChat';
import { StoreOwnerActions } from '@/components/store/view/StoreOwnerActions';
import { StoreProductsSection } from '@/components/store/view/StoreProductsSection';
import { 
  ChevronRight,
  Loader2, 
  Store as StoreIcon
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { collection, doc, query, serverTimestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/image-compression';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function StorePage() {
  const params = useParams();
  const id = params?.id as string;
  const { user, isAdmin } = useProfile();
  const firestore = useFirestore();

  const storeRef = useMemoFirebase(() => (!firestore || !id) ? null : doc(firestore, 'stores', id), [firestore, id]);
  const { data: store, isLoading: loadingStore } = useDoc(storeRef);

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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [updatingImage, setUpdatingImage] = useState<string | null>(null);

  if (loadingStore) return <div className="flex flex-col min-h-screen bg-background"><Navbar /><main className="flex-1"><Skeleton className="h-[40vh] w-full" /><div className="container mx-auto px-4 -mt-20"><Skeleton className="h-64 w-full" /></div></main></div>;
  if (!store && !loadingStore) return <div className="flex flex-col min-h-screen items-center justify-center p-4"><Navbar /><div className="text-center space-y-4"><StoreIcon className="w-16 h-16 mx-auto text-muted-foreground opacity-20" /><h2 className="text-2xl font-bold italic text-slate-400">Vitrina no encontrada</h2><Link href="/"><Button className="rounded-full">Inicio</Button></Link></div></div>;

  const canEdit = user?.uid === store?.ownerId || isAdmin;

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
              <StoreHighlights highlights={store?.highlights} isOwner={canEdit} updatingImage={updatingImage} onUpdateHighlight={(e, i) => handleUpdateImage(e, 'highlights', i)} />
              <StoreStats />
              <StoreContactContainer address={store?.address} phoneNumber={store?.phoneNumber} onOpenChat={() => setIsChatOpen(true)} />

              {canEdit && (
                <StoreOwnerActions 
                  catDialogOpen={catDialogOpen} setCatDialogOpen={setCatDialogOpen}
                  prodDialogOpen={prodDialogOpen} setProdDialogOpen={setProdDialogOpen}
                  isAddingCategory={isAddingCategory} isAddingProduct={isAddingProduct} isCompressingProduct={isCompressingProduct}
                  productImage={productImage} setProductImage={setProductImage}
                  categories={categories} onAddCategory={() => {}} onAddProduct={() => {}} onProductImageUpload={() => {}}
                />
              )}

              <StoreProductsSection storeId={id} categories={categories} />

              <div className="pt-8 flex justify-center pb-6">
                <Button className="w-[85%] h-14 rounded-full bg-[#f59e0b] hover:bg-[#d97706] text-white text-xl font-bold shadow-xl border-none gap-2 group">
                   Ver Menú <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <StoreWhatsAppChat isOpen={isChatOpen} onOpenChange={setIsChatOpen} storeName={store?.name} storeImageUrl={store?.imageUrl} />

      <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-2xl font-black italic">Información de Vitrina</DialogTitle></DialogHeader>
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
