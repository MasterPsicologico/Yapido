/**
 * HTTP Cloud Function: marcar viaje como completado por el conductor.
 * Recalcula tarifa final con waiting time y la persiste.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { City, TripDoc } from '../types.js';
import { computeFare } from '../lib/fare.js';

export const completeTrip = onCall<{ requestId: string; finalLocation?: { lat: number; lng: number }; waitSeconds?: number }>(async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'No auth');
  const driverId = req.auth.uid;
  const db = getFirestore();

  const { tripId, finalLocation, waitSeconds } = (req.data ?? {}) as any;
  if (!tripId) throw new HttpsError('invalid-argument', 'tripId required');

  const tripRef = db.collection('trips').doc(tripId);
  const snap = await tripRef.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Trip not found');
  const trip = snap.data() as TripDoc;
  if (trip.driver?.uid !== driverId) throw new HttpsError('permission-denied', 'Not your trip');
  if (trip.status !== 'in_progress' && trip.status !== 'accepted' && trip.status !== 'arriving') {
    throw new HttpsError('failed-precondition', `Cannot complete trip in status ${trip.status}`);
  }

  // Recalcular tarifa con tiempo real (duración)
  const city = (await db.collection('cities').doc(trip.cityId).get()).data() as City;
  const durationSeconds = (Date.now() - (trip.timeline.startedAt?.toMillis?.() ?? Date.now())) / 1000;
  const fare = computeFare({
    city,
    type: trip.type,
    distanceMeters: trip.distanceMeters,
    durationSeconds,
    waitSeconds: waitSeconds ?? 0,
  });

  await tripRef.update({
    status: 'completed',
    fare,
    timeline: { ...trip.timeline, completedAt: Timestamp.now() },
  });

  // Crear payment pendiente
  await db.collection('payments').add({
    tripId,
    driverId,
    passengerId: trip.passenger.uid,
    amount: fare.total,
    driverEarning: fare.driverEarning,
    platformFee: fare.platformFee,
    tip: 0,
    method: trip.payment.method,
    status: trip.payment.method === 'cash' ? 'paid' : 'pending',
    wompiTransactionId: null,
    settledAt: null,
    createdAt: Timestamp.now(),
  });

  return { ok: true, fare };
});
