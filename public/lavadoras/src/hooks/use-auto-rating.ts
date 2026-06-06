
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';

interface AutoRatingResult {
  orderToRate: any | null;
  showRating: boolean;
  setShowRating: (v: boolean) => void;
  ratingType: 'to_store' | 'to_driver' | 'to_customer';
}

/**
 * Hook que detecta órdenes en status "completed" que aún no han sido calificadas.
 * Retorna la primera orden pendiente de calificación para el usuario actual.
 */
export function useAutoRating(): AutoRatingResult {
  const { user } = useUser();
  const firestore = useFirestore();
  const [showRating, setShowRating] = useState(false);
  const [dismissedOrderIds, setDismissedOrderIds] = useState<Set<string>>(new Set());

  // Buscar órdenes completadas del usuario actual
  const completedQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'orders'),
      where('status', '==', 'completed'),
      where('participants', 'array-contains', user.uid),
      orderBy('completedAt', 'desc'),
      limit(5)
    );
  }, [firestore, user?.uid]);

  const { data: completedOrders } = useCollection(completedQuery);

  // Encontrar la primera orden sin calificar
  const orderToRate = useMemo(() => {
    if (!completedOrders || !user?.uid) return null;

    return completedOrders.find(order => {
      if (dismissedOrderIds.has(order.id)) return false;

      const isCustomer = order.userId === user.uid;
      const isDriver = order.deliveryDriverId === user.uid;

      if (isCustomer && !order.ratedByCustomer) return true;
      if (isDriver && !order.ratedByDriver) return true;
      return false;
    }) || null;
  }, [completedOrders, user?.uid, dismissedOrderIds]);

  // Determinar tipo de calificación
  const ratingType = useMemo(() => {
    if (!orderToRate || !user?.uid) return 'to_store' as const;

    if (orderToRate.userId === user.uid) return 'to_store' as const;
    if (orderToRate.deliveryDriverId === user.uid) return 'to_customer' as const;
    return 'to_store' as const;
  }, [orderToRate, user?.uid]);

  // Auto-mostrar cuando se detecta una orden sin calificar
  useEffect(() => {
    if (orderToRate && !showRating) {
      const timer = setTimeout(() => setShowRating(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [orderToRate?.id]);

  const handleSetShowRating = (v: boolean) => {
    setShowRating(v);
    if (!v && orderToRate) {
      setDismissedOrderIds(prev => new Set([...prev, orderToRate.id]));
    }
  };

  return { orderToRate, showRating, setShowRating: handleSetShowRating, ratingType };
}
