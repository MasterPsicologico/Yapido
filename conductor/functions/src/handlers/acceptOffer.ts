/**
 * HTTP Cloud Function: aceptar oferta.
 * El conductor llama esto. Se hace una transacción atómica en Firestore.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getDatabase } from 'firebase-admin/database';
import type { TripDoc } from '../types.js';

export const acceptOffer = onCall<{ requestId: string; offerId: string; tripId: string }>(async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'No auth');
  const driverId = req.auth.uid;
  const { tripId } = req.data;
  const db = getFirestore();
  const tripRef = db.collection('trips').doc(tripId);

  // Transacción: si trip.status === 'searching' u 'offered', set driver y status.
  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(tripRef);
    if (!snap.exists) throw new HttpsError('not-found', 'Trip not found');
    const trip = snap.data() as TripDoc;
    if (trip.status !== 'searching' && trip.status !== 'offered') {
      throw new HttpsError('failed-precondition', `Trip already ${trip.status}`);
    }
    if (trip.driver?.uid) {
      throw new HttpsError('failed-precondition', 'Already assigned');
    }
    // Cargar perfil del conductor
    const driverSnap = await tx.get(db.collection('driver_profiles').doc(driverId));
    const driver = driverSnap.data();
    if (!driver) throw new HttpsError('not-found', 'Driver profile missing');
    if (driver.status !== 'approved') throw new HttpsError('failed-precondition', 'Driver not approved');

    // Cargar vehículo
    const vehSnap = driver.vehicleId
      ? await tx.get(db.collection('driver_vehicles').doc(driver.vehicleId))
      : null;
    const veh = vehSnap?.data();

    const newTrip: Partial<TripDoc> = {
      status: 'accepted',
      driver: {
        uid: driverId,
        displayName: driver.displayName ?? 'Conductor',
        photoURL: driver.photoURL ?? null,
        rating: driver.ratingAvg ?? 5,
        phone: req.auth!.token.phone_number,
        plate: veh?.plate,
        vehicleDesc: veh ? `${veh.brand} ${veh.model} ${veh.color}` : undefined,
      },
      timeline: {
        ...trip.timeline,
        matchedAt: trip.timeline.matchedAt ?? Timestamp.now(),
        acceptedAt: Timestamp.now(),
      },
    };
    tx.update(tripRef, newTrip);
    return newTrip;
  });

  // Limpiar oferta del conductor
  const rtdb = getDatabase();
  await rtdb.ref(`cities/${result.driver?.uid ? tripRef.parent.parent?.id : ''}/offers/${driverId}/current`).remove();

  return { ok: true };
});
