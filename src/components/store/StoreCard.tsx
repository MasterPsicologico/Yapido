
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  MapPin, 
  ChevronRight, 
  Zap, 
  Award, 
  Clock, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Crown, 
  Leaf, 
  Heart, 
  Medal, 
  Plus,
  Package,
  Target,
  Settings,
  Moon,
  AlertCircle,
  MessageCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirestore, updateDocumentNonBlocking, useUser } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { doc, arrayUnion, arrayRemove, collection, query, where, getDocs, serverTimestamp, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { checkIsBusinessOpen } from '@/components/home/HomeActions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { OrderChat } from '@/components/chat/OrderChat';

export function StoreCard({ store }: { store: any }) {
  const firestore = useFirestore();
  const { isAdmin, profile } = useProfile();
  const { user } = useUser();
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [internalChatOrder, setInternalChatOrder] = useState<any | null>(null);
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  
  const CACHE_KEY = `vitriniando_store_img_${store.id}`;

  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) setLocalImage(cached);
  }, [CACHE_KEY]);

  useEffect(() => {
    if (store.imageUrl && store.imageUrl !== localImage) {
      setLocalImage(store.imageUrl);
      localStorage.setItem(CACHE_KEY, store.imageUrl);
    }
  }, [store.imageUrl, localImage, CACHE_KEY]);

  const isFavorite = profile?.favoriteStores?.includes(store.id);
  const isOwner = user?.uid === store.ownerId;
  const isWasherRental = store.mainCategoryId === 'category-washer' || store.type === 'washer_rental';

  const hasHours = !!(store.openTime && store.closeTime);
  const isOpen = checkIsBusinessOpen(store.openTime, store.closeTime);
  
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !firestore) return;
    const userRef = doc(firestore, 'users', user.uid);
    if (isFavorite) updateDocumentNonBlocking(userRef, { favoriteStores: arrayRemove(store.id) });
    else updateDocumentNonBlocking(userRef, { favoriteStores: arrayUnion(store.id) });
  };

  const handleOpenInternalChat = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !store || !firestore) {
      toast({ title: "Inicia sesión", description: "Para contactar con el negocio.", variant: "destructive" });
      return;
    }

    setIsOpeningChat(true);
    try {
      const q = query(
        collection(firestore, 'orders'),
        where('customerId', '==', user.uid),
        where('storeId', '==', store.id),
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
          storeId: store.id,
          storeName: store.name,
          storeOwnerId: store.ownerId,
          participants: [user.uid, store.ownerId],
          status: 'inquiry',
          productName: 'Consulta Instantánea',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isLogisticsPublic: false
        };
        const docRef = await addDoc(collection(firestore, 'orders'), inquiryData);
        setInternalChatOrder({ id: docRef.id, ...inquiryData });
      }
    } catch (e) {
      toast({ title: "Error al conectar chat", variant: "destructive" });
    } finally {
      setIsOpeningChat(false);
    }
  };

  const handleDirectRequest = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('open-direct-solicitation', { 
      detail: { 
        storeId: store.id, 
        storeName: store.name, 
        ownerId: store.ownerId 
      } 
    }));
  };

  const displayImage = localImage || store.imageUrl || 'https://picsum.photos/seed/store/800/600';

  return (
    <Card className={cn(
      "group flex flex-col h-full border-none rounded-[48px] shadow-xl hover:shadow-2xl transition-all duration-700 bg-white overflow-hidden relative",
      isWasherRental && "ring-4 ring-primary/5",
      (!isOpen || !hasHours) && !isOwner && !isAdmin && "grayscale opacity-80"
    )}>
      {isWasherRental && isOwner && (
        <Link 
          href={`/admin/washer/${store.id}`}
          className="absolute inset-0 z-[40] bg-primary/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center text-center p-8 cursor-pointer"
        >
          <div className="w-20 h-20 bg-primary text-white rounded-[32px] flex items-center justify-center shadow-2xl animate-in zoom-in duration-300">
            <Settings className="w-10 h-10 animate-spin-slow" />
          </div>
          <h4 className="text-primary font-black text-2xl uppercase italic tracking-tighter mt-6 leading-none">PANEL MAESTRO</h4>
          <p className="text-primary/60 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Control de Flota y Ganancias</p>
        </Link>
      )}

      <div className="block relative aspect-[16/10] w-full overflow-hidden bg-slate-50">
        <Link href={`/stores/${store.id}`} onClick={(e) => (!isOpen && !isOwner && !isAdmin) && e.preventDefault()}>
          <Image src={displayImage} alt={store.name} fill className="object-cover transition-transform duration-1000 group-hover:scale-110" />
        </Link>
        
        <div className="absolute top-6 right-6 z-20">
          <Button onClick={handleToggleFavorite} variant="ghost" size="icon" className={cn("rounded-full h-12 w-12 backdrop-blur-xl border border-white/20 shadow-2xl transition-all active:scale-75", isFavorite ? "bg-rose-500 text-white border-none" : "bg-white/20 text-white hover:bg-white/40")}>
            <Heart className={cn("w-6 h-6 transition-transform", isFavorite && "fill-current scale-110")} />
          </Button>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />
      </div>

      <CardContent className="p-8 flex flex-col flex-1 space-y-6 bg-white">
        <div className="space-y-1">
          <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none group-hover:text-primary transition-colors">
            {store.name}
          </h3>
          <p className="text-xs text-slate-400 font-medium italic line-clamp-1 opacity-70">
            {store.description || "Vitrina local verificada"}
          </p>
        </div>

        <div className="bg-[#f8fafc] p-6 rounded-[36px] border border-slate-100 space-y-5 shadow-inner">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-xs font-black uppercase tracking-tight text-slate-900 truncate">{store.address || store.cityName || 'Colombia'}</span>
            </div>
            
            <div className="flex items-center gap-2 ml-1">
              <div className={cn("w-2 h-2 rounded-full", isOpen ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500")} />
              <span className={cn("text-[9px] font-black uppercase tracking-widest", isOpen ? "text-green-600" : "text-red-500")}>
                {isOpen ? "TIENDA ACTIVA" : "TIENDA CERRADA"}
              </span>
              {!isOpen && hasHours && (
                <span className="text-[8px] font-bold text-slate-400 uppercase italic">/ Abre {store.openTime}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button 
              onClick={handleOpenInternalChat}
              disabled={isOpeningChat}
              className="h-14 rounded-2xl bg-white border-2 border-slate-100 hover:border-primary/20 text-slate-900 shadow-sm transition-all flex flex-col items-center justify-center gap-1 group/chat active:scale-95"
            >
              {isOpeningChat ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <MessageCircle className="w-5 h-5 text-primary group-hover/chat:scale-110 transition-transform" />}
              <span className="text-[8px] font-black uppercase tracking-widest leading-none">Contactar</span>
            </Button>

            <Button 
              onClick={handleDirectRequest}
              className="h-14 rounded-2xl bg-slate-900 text-white shadow-xl hover:bg-primary transition-all flex flex-col items-center justify-center gap-1 group/req active:scale-95 border-b-4 border-black"
            >
              <Zap className="w-5 h-5 text-yellow-400 group-req:animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-widest leading-none">Solicitud Directa</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
           <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="text-[8px] font-black uppercase tracking-[0.3em]">Kernel v1.0.4</span>
           </div>
           <Link href={`/stores/${store.id}`} className="text-primary font-black text-[10px] uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Ver Catálogo <ChevronRight className="w-3 h-3" />
           </Link>
        </div>
      </CardContent>

      <Dialog open={!!internalChatOrder} onOpenChange={v => !v && setInternalChatOrder(null)}>
        <DialogContent className="p-0 border-none bg-white shadow-none max-w-none w-screen h-[100dvh] top-0 left-0 translate-x-0 translate-y-0 sm:p-4 md:p-8 flex flex-col z-[1000] [&>button:last-child]:hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Chat con la Tienda</DialogTitle>
            <DialogDescription>Canal de comunicación seguro.</DialogDescription>
          </DialogHeader>
          {internalChatOrder && (
            <div className="flex-1 min-h-0 w-full animate-in zoom-in duration-300">
              <OrderChat orderId={internalChatOrder.id} orderData={internalChatOrder} onClose={() => setInternalChatOrder(null)} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
