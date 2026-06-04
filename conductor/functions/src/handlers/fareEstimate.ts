/**
 * HTTP Cloud Function: cotizar tarifa antes de solicitar.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { computeFare, estimateDistanceDuration } from '../lib/fare.js';
import type { City } from '../types.js';

export const fareEstimate = onCall<{ type: 'moto' | 'auto' | 'auto_comfort'; pickup: { lat: number; lng: number }; dropoff: { lat: number; lng: number }; cityId?: string }>(async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'No auth');
  const { type, pickup, dropoff } = req.data;
  const cityId = req.data.cityId ?? 'aguachica';
  if (!type || !pickup || !dropoff) throw new HttpsError('invalid-argument', 'Missing fields');

  const db = getFirestore();
  const citySnap = await db.collection('cities').doc(cityId).get();
  if (!citySnap.exists) throw new HttpsError('not-found', `City ${cityId} not found`);
  const city = citySnap.data() as City;

  const { meters, seconds } = estimateDistanceDuration(pickup, dropoff);
  const fare = computeFare({ city, type, distanceMeters: meters, durationSeconds: seconds });

  return { fare, distanceMeters: meters, durationSeconds: seconds, surge: fare.surge };
});
