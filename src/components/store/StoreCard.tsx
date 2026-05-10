
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  MapPin, ChevronRight, Zap, ShieldCheck, Settings,
  Heart, MessageCircle, Loader2, Trash2, Undo, AlertTriangle, Clock, Star
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useFirestore, updateDocumentNonBlocking, useUser } from '@/firebase';
import { useProfile } from '@/firebase/auth/use-profile';
import { doc, arrayUnion, arrayRemove, collection, query, where, getDocs, serverTimestamp, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { checkIsBusinessOpen } from '@/components/home/HomeActions';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { OrderChat } from '@/components/chat/OrderChat';

export function StoreCard({ store }: { store: any }) {
  const firestore = useFirestore();
  const { isAdmin, profile } = useProfile();
  const { user } = useUser();
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [internalChatOrder, setInternalChatOrder] = useState<any | null>(null);
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [showTrashConfirm, setShowTrashConfirm] = useState(false);
  const [isTrashing, setIsTrashing] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);

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
  const isTrashed = store.status === 'trashed';

  const trashedAt = store.trashedAt?.toDate?.()
    || (store.trashedAt?.seconds ? new Date(store.trashedAt.seconds * 1000) : null);
  const hoursElapsed = trashedAt ? (Date.now() - trashedAt.getTime()) / (1000 * 60 * 60) : 0;
  const hoursLeft = Math.max(0, 24 - hoursElapsed);
  const isPermanentlyDeleted = isTrashed && hoursLeft <= 0;
  const canRecover = isTrashed && !isPermanentlyDeleted && (isAdmin || isOwner);

  const displayImage = localImage || store.imageUrl || 'https://picsum.photos/seed/store/800/600';

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user || !firestore) return;
    const userRef = doc(firestore, 'users', user.uid);
    if (isFavorite) updateDocumentNonBlocking(userRef, { favoriteStores: arrayRemove(store.id) });
    else updateDocumentNonBlocking(userRef, { favoriteStores: arrayUnion(store.id) });
  };

  const handleOpenInternalChat = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user || !store || !firestore) {
      toast({ title: "Inicia sesión", description: "Para contactar con el negocio.", variant: "destructive" });
      return;
    }
    setIsOpeningChat(true);
    try {
      const q = query(collection(firestore, 'orders'), where('customerId', '==', user.uid), where('storeId', '==', store.id), where('status', '==', 'inquiry'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setInternalChatOrder({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        const inquiryData = {
          customerId: user.uid, customerName: user.displayName || 'Cliente',
          customerPhone: user.phoneNumber || '', storeId: store.id,
          storeName: store.name, storeOwnerId: store.ownerId,
          participants: [user.uid, store.ownerId], status: 'inquiry',
          productName: 'Consulta Instantánea', createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(), isLogisticsPublic: false
        };
        const docRef = await addDoc(collection(firestore, 'orders'), inquiryData);
        setInternalChatOrder({ id: docRef.id, ...inquiryData });
      }
    } catch {
      toast({ title: "Error al conectar chat", variant: "destructive" });
    } finally {
      setIsOpeningChat(false);
    }
  };

  const handleDirectRequest = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    window.dispatchEvent(new CustomEvent('open-direct-solicitation', {
      detail: { storeId: store.id, storeName: store.name, ownerId: store.ownerId }
    }));
  };

  const handleTrashStore = async () => {
    if (!firestore || !store.id || (!isAdmin && !isOwner)) return;
    setIsTrashing(true);
    try {
      await updateDocumentNonBlocking(doc(firestore, 'stores', store.id), {
        status: 'trashed', trashedAt: serverTimestamp(), trashedBy: user?.uid || 'unknown',
      });
      toast({ title: "🗑️ Tienda en papelera", description: "Tienes 24 horas para recuperarla antes de que se elimine permanentemente." });
      setShowTrashConfirm(false);
    } catch {
      toast({ title: "Error al eliminar", variant: "destructive" });
    } finally {
      setIsTrashing(false);
    }
  };

  const handleRecoverStore = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!firestore || !store.id || !canRecover) return;
    setIsRecovering(true);
    try {
      await updateDocumentNonBlocking(doc(firestore, 'stores', store.id), {
        status: 'active', trashedAt: null, trashedBy: null, recoveredAt: serverTimestamp(),
      });
      toast({ title: "✅ Tienda recuperada", description: "Tu vitrina vuelve a estar activa." });
    } catch {
      toast({ title: "Error al recuperar", variant: "destructive" });
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <>
      <div className={cn(
        "group relative flex flex-col rounded-[40px] overflow-hidden bg-white shadow-[0_8px_40px_rgba(0,0,0,0.10)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.18)] transition-all duration-700",
        isWasherRental && "ring-2 ring-primary/20",
        isTrashed && "opacity-60",
        (!isOpen || !hasHours) && !isOwner && !isAdmin && !isTrashed && "grayscale opacity-75"
      )}>

        {/* ── Panel Maestro overlay (owner hover) ── */}
        {isWasherRental && isOwner && !isTrashed && (
          <Link
            href={`/admin/washer/${store.id}`}
            className="absolute inset-0 z-[40] bg-primary/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center text-center p-8 cursor-pointer rounded-[40px]"
          >
            <div className="w-20 h-20 bg-white text-primary rounded-[32px] flex items-center justify-center shadow-2xl animate-in zoom-in duration-300">
              <Settings className="w-10 h-10" />
            </div>
            <h4 className="text-white font-black text-2xl uppercase italic tracking-tighter mt-6 leading-none">PANEL MAESTRO</h4>
            <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Control de Flota y Ganancias</p>
          </Link>
        )}

        {/* ── Overlay Papelera ── */}
        {isTrashed && (
          <div className="absolute inset-0 z-[60] bg-slate-900/92 backdrop-blur-md flex flex-col items-center justify-center text-center p-8 rounded-[40px] animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-red-500 text-white rounded-[32px] flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.5)] mb-5">
              <Trash2 className="w-10 h-10 animate-pulse" />
            </div>
            <h4 className="text-white font-black text-xl uppercase italic tracking-tighter leading-tight">TIENDA EN PAPELERA</h4>
            {isPermanentlyDeleted ? (
              <p className="text-red-400 text-[10px] font-black uppercase tracking-widest mt-3 max-w-[180px]">Eliminación permanente en proceso...</p>
            ) : (
              <div className="flex items-center gap-2 mt-3">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest">
                  {hoursLeft < 1 ? `${Math.ceil(hoursLeft * 60)} min restantes` : `${Math.ceil(hoursLeft)} horas restantes`}
                </p>
              </div>
            )}
            {canRecover && (
              <Button onClick={handleRecoverStore} disabled={isRecovering} className="mt-7 rounded-full h-12 px-8 bg-white text-slate-900 font-black gap-2 hover:bg-slate-100 transition-all active:scale-95 shadow-xl">
                {isRecovering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Undo className="w-4 h-4" />}
                RECUPERAR TIENDA
              </Button>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            ZONA DE IMAGEN — Cinematic Hero
        ══════════════════════════════════════════ */}
        <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-100">
          <Link href={`/stores/${store.id}`} onClick={(e) => ((!isOpen && !isOwner && !isAdmin) || isTrashed) && e.preventDefault()}>
            <Image
              src={displayImage}
              alt={store.name}
              fill
              className="object-cover transition-transform duration-[1200ms] group-hover:scale-110"
            />
          </Link>

          {/* Gradient cinema bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-10" />

          {/* TOP ROW: Trash + Favorite */}
          <div className="absolute top-4 right-4 z-20 flex gap-2">
            {(isAdmin || isOwner) && !isTrashed && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTrashConfirm(true); }}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-red-500 hover:border-red-400 transition-all active:scale-75 shadow-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleToggleFavorite}
              className={cn(
                "w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-all active:scale-75 shadow-lg",
                isFavorite
                  ? "bg-rose-500 border-rose-400 text-white"
                  : "bg-white/10 border-white/20 text-white hover:bg-white/30"
              )}
            >
              <Heart className={cn("w-4 h-4 transition-all", isFavorite && "fill-current scale-110")} />
            </button>
          </div>

          {/* Status pill — top left */}
          <div className="absolute top-4 left-4 z-20">
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md border shadow-lg",
              isTrashed
                ? "bg-red-500/80 text-white border-red-400/40"
                : isOpen
                  ? "bg-green-500/80 text-white border-green-400/40"
                  : "bg-black/40 text-white/70 border-white/10"
            )}>
              <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                isTrashed ? "bg-red-200" : isOpen ? "bg-white animate-pulse" : "bg-white/40"
              )} />
              {isTrashed ? "Papelera" : isOpen ? "Activa" : "Cerrada"}
            </div>
          </div>

          {/* Washer badge */}
          {isWasherRental && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/90 backdrop-blur-md border border-primary/50 text-white text-[8px] font-black uppercase tracking-widest shadow-lg">
                <Zap className="w-3 h-3 text-yellow-300" />
                Alquiler Express
              </div>
            </div>
          )}

          {/* BOTTOM of image: Store name overlaid */}
          <div className="absolute bottom-0 inset-x-0 z-20 p-5 pb-4">
            <Link href={`/stores/${store.id}`} onClick={(e) => ((!isOpen && !isOwner && !isAdmin) || isTrashed) && e.preventDefault()}>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-none drop-shadow-lg line-clamp-1">
                {store.name}
              </h3>
              <p className="text-white/60 text-[10px] font-semibold mt-1 line-clamp-1">
                {store.description || "Vitrina local verificada"}
              </p>
            </Link>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            ZONA DE CONTENIDO — Info + Actions
        ══════════════════════════════════════════ */}
        <div className="flex flex-col gap-4 p-5 bg-white">

          {/* Address row */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-tight text-slate-900 truncate">
                {store.address || store.cityName || 'Colombia'}
              </p>
              {!isTrashed && !isOpen && hasHours && (
                <p className="text-[9px] text-slate-400 font-medium">Abre a las {store.openTime}</p>
              )}
            </div>
            {/* Verified badge */}
            <div className="ml-auto shrink-0">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100">
                <ShieldCheck className="w-3 h-3 text-primary" />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Verificado</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-100" />

          {/* Action buttons */}
          {!isTrashed && (
            <div className="grid grid-cols-2 gap-3">
              {/* Chat */}
              <button
                onClick={handleOpenInternalChat}
                disabled={isOpeningChat}
                className="group/btn relative h-14 rounded-2xl bg-slate-50 hover:bg-primary/5 border border-slate-100 hover:border-primary/20 flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-sm"
              >
                {isOpeningChat
                  ? <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  : <MessageCircle className="w-5 h-5 text-primary group-hover/btn:scale-110 transition-transform" />
                }
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Contactar</span>
              </button>

              {/* Direct request — premium CTA */}
              <button
                onClick={handleDirectRequest}
                className="group/req relative h-14 rounded-2xl overflow-hidden flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-lg shadow-slate-900/20 border-b-4 border-black/60"
                style={{ background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)' }}
              >
                {/* shimmer */}
                <div className="absolute inset-0 bg-white/5 -translate-x-full group-hover/req:translate-x-full transition-transform duration-700" />
                <Zap className="w-5 h-5 text-yellow-400 shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">Solicitar</span>
              </button>
            </div>
          )}

          {/* Footer: catalog link */}
          {!isTrashed && (
            <Link
              href={`/stores/${store.id}`}
              className="flex items-center justify-between px-4 py-3 rounded-2xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10 hover:from-primary/10 hover:to-primary/15 transition-all group/link"
            >
              <div className="flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Ver Catálogo Completo</span>
              </div>
              <ChevronRight className="w-4 h-4 text-primary group-hover/link:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      </div>

      {/* ── Chat Dialog ── */}
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

      {/* ── Dialog Confirmación Eliminación ── */}
      <Dialog open={showTrashConfirm} onOpenChange={setShowTrashConfirm}>
        <DialogContent className="max-w-sm mx-auto rounded-[32px] border-none p-0 overflow-hidden">
          <div className="bg-gradient-to-b from-red-50 to-white p-8">
            <div className="flex flex-col items-center text-center gap-5">
              <div className="w-20 h-20 bg-red-100 rounded-[28px] flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">¿Enviar a Papelera?</h3>
                <p className="text-slate-500 text-sm font-medium mt-2 leading-relaxed">
                  La tienda <span className="font-black text-slate-800">"{store.name}"</span> irá a la papelera.
                  Tendrás <span className="font-black text-amber-600">24 horas</span> para recuperarla.
                </p>
              </div>
              <div className="w-full flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowTrashConfirm(false)} className="flex-1 h-12 rounded-2xl font-bold border-slate-200 text-slate-700" disabled={isTrashing}>
                  Cancelar
                </Button>
                <Button onClick={handleTrashStore} disabled={isTrashing} className="flex-1 h-12 rounded-2xl font-black bg-red-500 hover:bg-red-600 text-white gap-2 shadow-lg shadow-red-200">
                  {isTrashing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /> Sí, eliminar</>}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
