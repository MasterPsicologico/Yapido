
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

  const CACHE_KEY = `yapido_click_store_img_${store.id}`;

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
        "group relative flex flex-col rounded-3xl overflow-hidden border border-white/10 bg-[#0A0A0A] shadow-2xl transition-all duration-500 hover:shadow-primary/20",
        isWasherRental && "ring-1 ring-primary/30 shadow-[0_0_30px_rgba(var(--primary),0.1)]",
        isTrashed && "opacity-60 grayscale-[0.5]",
        (!isOpen || !hasHours) && !isOwner && !isAdmin && !isTrashed && "grayscale opacity-75"
      )}>

        {/* ── Overlay Papelera ── */}
        {isTrashed && (
          <div className="absolute inset-0 z-[60] bg-[#0A0A0A]/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-red-500/20 border border-red-500/30 text-red-400 rounded-[32px] flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.3)] mb-5">
              <Trash2 className="w-10 h-10 animate-pulse" />
            </div>
            <h4 className="text-white font-black text-xl uppercase italic tracking-tighter leading-tight">TIENDA EN PAPELERA</h4>
            {isPermanentlyDeleted ? (
              <p className="text-red-400 text-[10px] font-black uppercase tracking-widest mt-3 max-w-[180px]">Eliminación permanente en proceso...</p>
            ) : (
              <div className="flex items-center gap-2 mt-3 bg-amber-500/10 px-4 py-2 rounded-full border border-amber-500/20">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest">
                  {hoursLeft < 1 ? `${Math.ceil(hoursLeft * 60)} min restantes` : `${Math.ceil(hoursLeft)} horas restantes`}
                </p>
              </div>
            )}
            {canRecover && (
              <Button onClick={handleRecoverStore} disabled={isRecovering} className="mt-7 rounded-full h-12 px-8 bg-white text-black font-black gap-2 hover:bg-slate-200 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                {isRecovering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Undo className="w-4 h-4" />}
                RECUPERAR TIENDA
              </Button>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            ZONA DE IMAGEN — Cinematic Hero
        ══════════════════════════════════════════ */}
        <div className="group/image relative w-full aspect-[4/3] overflow-hidden bg-[#0A0A0A]">
          <Link href={`/stores/${store.id}`} onClick={(e) => ((!isOpen && !isOwner && !isAdmin) || isTrashed) && e.preventDefault()}>
            <Image
              src={displayImage}
              alt={store.name}
              fill
              className="object-cover transition-transform duration-[1500ms] group-hover/image:scale-110 opacity-90"
            />
          </Link>

          {/* ── Panel Maestro overlay (owner hover) ── */}
          {isWasherRental && isOwner && !isTrashed && (
            <Link
              href={`/admin/washer/${store.id}`}
              className="absolute inset-0 z-[40] bg-black/80 backdrop-blur-md opacity-0 group-hover/image:opacity-100 transition-all duration-500 flex flex-col items-center justify-center text-center p-8 cursor-pointer"
            >
              <div className="w-20 h-20 bg-primary/20 border border-primary/50 text-primary rounded-[32px] flex items-center justify-center shadow-2xl shadow-primary/20 animate-in zoom-in duration-300">
                <Settings className="w-10 h-10 drop-shadow-lg" />
              </div>
              <h4 className="text-white font-black text-2xl uppercase italic tracking-tighter mt-6 leading-none">PANEL MAESTRO</h4>
              <p className="text-primary/80 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Control de Flota y Ganancias</p>
            </Link>
          )}

          {/* Gradient cinema bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10 h-1/2" />

          {/* TOP ROW: Trash + Favorite */}
          <div className="absolute top-4 right-4 z-20 flex gap-2">
            {(isAdmin || isOwner) && !isTrashed && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTrashConfirm(true); }}
                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/80 flex items-center justify-center hover:bg-red-500 hover:text-white hover:border-red-400 transition-all active:scale-75 shadow-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleToggleFavorite}
              className={cn(
                "w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-all active:scale-75 shadow-lg",
                isFavorite
                  ? "bg-rose-500 border-rose-400 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                  : "bg-black/40 border-white/10 text-white/80 hover:bg-white/20"
              )}
            >
              <Heart className={cn("w-4 h-4 transition-all", isFavorite && "fill-current scale-110")} />
            </button>
          </div>

          {/* Status pill — top left */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-xl border shadow-lg w-max",
              isTrashed
                ? "bg-red-500/20 text-red-400 border-red-500/30"
                : isOpen
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-black/40 text-white/60 border-white/10"
            )}>
              <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                isTrashed ? "bg-red-400" : isOpen ? "bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" : "bg-white/40"
              )} />
              {isTrashed ? "Papelera" : isOpen ? "Activa" : "Cerrada"}
            </div>


          </div>

          {/* BOTTOM of image: Store name overlaid */}
          <div className="absolute bottom-0 inset-x-0 z-20 p-5 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
            <Link href={`/stores/${store.id}`} onClick={(e) => ((!isOpen && !isOwner && !isAdmin) || isTrashed) && e.preventDefault()}>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none drop-shadow-2xl line-clamp-1">
                {store.name}
              </h3>
              <p className="text-slate-400 text-xs font-medium mt-1.5 line-clamp-2 drop-shadow-lg">
                {store.description || "Vitrina local verificada lista para servirte"}
              </p>
            </Link>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            ZONA DE CONTENIDO — Info + Actions
        ══════════════════════════════════════════ */}
        <div className="relative flex flex-col gap-5 p-5 bg-[#0A0A0A] overflow-hidden">
          {/* Subtle top border glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Address row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-slate-300" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-widest text-white truncate">
                  {store.address || store.cityName || 'Colombia'}
                </p>
                {!isTrashed && !isOpen && hasHours && (
                  <p className="text-[10px] text-slate-500 font-medium">Abre a las {store.openTime}</p>
                )}
              </div>
            </div>
            {/* Verified badge */}
            <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verificado</span>
            </div>
          </div>

          {/* Action buttons */}
          {!isTrashed && (
            <div className="grid grid-cols-2 gap-3">
              {/* Chat */}
              <button
                onClick={handleOpenInternalChat}
                disabled={isOpeningChat}
                className="group/btn relative h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {isOpeningChat
                  ? <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                  : <MessageCircle className="w-4 h-4 text-slate-300 group-hover/btn:scale-110 transition-transform" />
                }
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Contactar</span>
              </button>

              {/* Direct request — premium CTA */}
              <button
                onClick={handleDirectRequest}
                className="group/req relative h-12 rounded-xl overflow-hidden flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)' }}
              >
                <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover/req:translate-x-full transition-transform duration-700" />
                <Zap className="w-4 h-4 text-yellow-400 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white drop-shadow-md">Solicitar</span>
              </button>
            </div>
          )}

          {/* Footer: catalog link */}
          {!isTrashed && (
            <Link
              href={`/stores/${store.id}`}
              className="flex items-center justify-between px-5 py-3.5 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all group/link relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover/link:translate-x-full transition-transform duration-1000" />
              <div className="flex items-center gap-2.5 relative z-10">
                <Star className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.3)]">Explorar Vitrina Completa</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center group-hover/link:bg-primary/30 transition-colors relative z-10">
                <ChevronRight className="w-4 h-4 text-primary group-hover/link:translate-x-0.5 transition-transform" />
              </div>
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
