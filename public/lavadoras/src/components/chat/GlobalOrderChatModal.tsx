"use client";

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { OrderChat } from '@/components/chat/OrderChat';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';

export function GlobalOrderChatModal() {
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    const handleOpenGlobalChat = (e: any) => {
      const orderId = e.detail?.orderId;
      if (orderId) {
        setActiveOrderId(orderId);
      }
    };

    window.addEventListener('open-global-chat', handleOpenGlobalChat);
    return () => window.removeEventListener('open-global-chat', handleOpenGlobalChat);
  }, []);

  const memoizedDocRef = useMemo(() => {
    if (!firestore || !activeOrderId) return null;
    return doc(firestore, 'orders', activeOrderId);
  }, [firestore, activeOrderId]);

  const { data: orderData } = useDoc(memoizedDocRef);

  return (
    <Dialog open={!!activeOrderId} onOpenChange={(v) => { if (!v) { setActiveOrderId(null); } }}>
      <DialogContent className="p-0 border-none bg-white max-w-none w-screen h-[100dvh] flex flex-col z-[5000] [&>button:last-child]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Chat Maestro de Órdenes</DialogTitle>
          <DialogDescription>Gestión centralizada de comunicación.</DialogDescription>
        </DialogHeader>
        {activeOrderId && (
          <OrderChat 
            orderId={activeOrderId} 
            orderData={orderData} 
            onClose={() => { setActiveOrderId(null); }} 
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
