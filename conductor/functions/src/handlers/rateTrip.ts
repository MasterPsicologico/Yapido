/**
 * HTTP Cloud Function: calificar viaje.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { TripDoc } from '../types.js';

export const rateTrip = onCall<{ requestId: string; tripId: string; score: number; tags?: string[]; comment?: string; tip?: number }>(async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'No auth');
  const uid = req.auth.uid;
  const { tripId, score, tags, comment, tip = 0 } = req.data;
  if (!tripId || !score) throw new HttpsError('invalid-argument', 'Missing fields');
  if (score < 1 || score > 5) throw new HttpsError('invalid-argument', 'Score 1..5');

  const db = getFirestore();
  const ref = db.collection('trips').doc(tripId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Trip not found');
  const trip = snap.data() as TripDoc;
  if (trip.status !== 'completed') throw new HttpsError('failed-precondition', 'Not completed yet');

  const isPassenger = trip.passenger.uid === uid;
  const isDriver = trip.driver?.uid === uid;
  if (!isPassenger && !isDriver) throw new HttpsError('permission-denied', 'Not your trip');

  // Crear rating
  await db.collection('ratings').doc(tripId).set({
    tripId,
    from: isPassenger ? 'passenger' : 'driver',
    toUid: isPassenger ? trip.driver!.uid : trip.passenger.uid,
    score,
    tags: tags ?? [],
    comment: comment ?? null,
    createdAt: Timestamp.now(),
  });

  // Actualizar ratingAvg del target
  const targetUid = isPassenger ? trip.driver!.uid : trip.passenger.uid;
  const targetCol = isPassenger ? 'driver_profiles' : 'passenger_profiles';
  const targetRef = db.collection(targetCol).doc(targetUid);
  await db.runTransaction(async (tx) => {
    const tSnap = await tx.get(targetRef);
    if (!tSnap.exists) return;
    const data = tSnap.data() as any;
    const newCount = (data.ratingCount ?? 0) + 1;
    const newAvg = (((data.ratingAvg ?? 5) * (data.ratingCount ?? 0)) + score) / newCount;
    tx.update(targetRef, { ratingAvg: newAvg, ratingCount: newCount });
  });

  // Marcar trip como rated + aplicar tip
  await ref.update({
    status: 'rated',
    'fare.tip': tip,
    'timeline.ratedAt': Timestamp.now(),
  });

  // Si hay tip, actualizar payment
  if (tip > 0 && trip.driver) {
    const pays = await db.collection('payments').where('tripId', '==', tripId).limit(1).get();
    if (!pays.empty) {
      pays.docs[0]!.ref.update({ tip });
    }
  }

  return { ok: true };
});
