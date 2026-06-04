/**
 * HTTP Cloud Function: conductor se pone online/offline.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { getDatabase } from 'firebase-admin/database';
import { encodeGeohash } from '../lib/geo.js';

export const setOnline = onCall<{ requestId: string; online: boolean; cityId: string; loc: { lat: number; lng: number } }>(async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'No auth');
  const driverId = req.auth.uid;
  const { online, cityId, loc } = req.data;
  const db = getFirestore();
  const rtdb = getDatabase();

  // Verificar que el conductor está aprobado
  const profRef = db.collection('driver_profiles').doc(driverId);
  const prof = await profRef.get();
  if (!prof.exists) throw new HttpsError('not-found', 'Driver profile missing');
  const data = prof.data() as any;
  if (data.status !== 'approved') throw new HttpsError('failed-precondition', 'Driver not approved');

  if (online) {
    const vehicleType = data.vehicleType ?? 'moto';
    const geo6 = encodeGeohash(loc, 6);
    await rtdb.ref(`cities/${cityId}/drivers_online/${driverId}`).set({
      driverId,
      status: 'online',
      vehicleType,
      loc: { ...loc, ts: Date.now() },
      geo6,
      ratingAvg: data.ratingAvg ?? 5,
      acceptRate30d: data.acceptRate30d ?? 1,
      updatedAt: Date.now(),
    });
    await profRef.update({ online: true, currentCityId: cityId, currentLocation: loc, currentGeohash6: geo6 });
  } else {
    await rtdb.ref(`cities/${cityId}/drivers_online/${driverId}`).remove();
    await profRef.update({ online: false });
  }

  return { ok: true };
});
