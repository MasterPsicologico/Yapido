
"use client";

import { doc, getDoc, updateDoc, serverTimestamp, Firestore } from 'firebase/firestore';

/**
 * Actualiza el averageRating de la entidad (store o driver) tras una calificación.
 * Usa incremento atómico: averageRating = ((old * count) + newRating) / (count + 1)
 */
export async function updateAverageRating(
  firestore: Firestore,
  orderId: string,
  ratingType: 'to_store' | 'to_driver' | 'to_customer',
  rating: number
): Promise<void> {
  // Obtener la orden para saber a quién calificar
  const orderSnap = await getDoc(doc(firestore, 'orders', orderId));
  if (!orderSnap.exists()) return;
  const order = orderSnap.data();

  let targetCollection: string;
  let targetDocId: string | undefined;

  if (ratingType === 'to_store') {
    targetCollection = 'stores';
    targetDocId = order.storeId;
  } else if (ratingType === 'to_driver') {
    targetCollection = 'users';
    targetDocId = order.deliveryDriverId;
  } else {
    // to_customer — calificar al cliente
    targetCollection = 'users';
    targetDocId = order.userId;
  }

  if (!targetDocId) return;

  const targetRef = doc(firestore, targetCollection, targetDocId);
  const targetSnap = await getDoc(targetRef);
  if (!targetSnap.exists()) return;

  const targetData = targetSnap.data();
  const currentAvg = targetData.averageRating || 0;
  const currentCount = targetData.totalRatings || 0;

  const newCount = currentCount + 1;
  const newAvg = ((currentAvg * currentCount) + rating) / newCount;

  await updateDoc(targetRef, {
    averageRating: Math.round(newAvg * 100) / 100,
    totalRatings: newCount,
    lastRatedAt: serverTimestamp(),
  });
}
