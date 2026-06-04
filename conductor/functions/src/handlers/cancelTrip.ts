/**
 * HTTP Cloud Function: pasajero/conductor cancela viaje.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { TripDoc } from '../types.js';

export const cancelTrip = onCall<{ requestId: string; tripId: string; reason: string }>(async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'No auth');
  const uid = req.auth.uid;
  const { tripId, reason } = req.data;
  if (!tripId || !reason) throw new HttpsError('invalid-argument', 'Missing tripId/reason');

  const db = getFirestore();
  const ref = db.collection('trips').doc(tripId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Trip not found');
  const trip = snap.data() as TripDoc;

  const isPassenger = trip.passenger.uid === uid;
  const isDriver = trip.driver?.uid === uid;
  if (!isPassenger && !isDriver) throw new HttpsError('permission-denied', 'Not your trip');

  if (['completed', 'rated', 'cancelled'].includes(trip.status)) {
    throw new HttpsError('failed-precondition', `Cannot cancel in ${trip.status}`);
  }

  await ref.update({
    status: 'cancelled',
    timeline: {
      ...trip.timeline,
      cancelledAt: Timestamp.now(),
      cancelledBy: isPassenger ? 'passenger' : 'driver',
      cancelReason: reason,
    },
  });

  return { ok: true };
});
