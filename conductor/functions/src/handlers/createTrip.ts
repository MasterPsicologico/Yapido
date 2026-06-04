/**
 * HTTP Cloud Function: crear viaje.
 * El cliente llama createTrip, que crea el doc en Firestore.
 * El matchTrip se dispara automáticamente por onTripCreated.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';
import { computeFare, estimateDistanceDuration } from '../lib/fare.js';
import { geohash9 } from '../lib/geo.js';
import type { City, TripDoc } from '../types.js';

interface Input {
  requestId: string;
  type: 'moto' | 'auto' | 'auto_comfort';
  pickup: { lat: number; lng: number; address: string; notes?: string };
  dropoff: { lat: number; lng: number; address: string; notes?: string };
  paymentMethod: 'cash' | 'card' | 'wompi' | 'pse';
  paymentMethodId?: string;
  notes?: string;
  promoCode?: string;
}

export const createTrip = onCall<Input>(async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'No auth');
  const input = req.data;
  if (!input?.requestId || !input?.type || !input?.pickup || !input?.dropoff) {
    throw new HttpsError('invalid-argument', 'Bad input');
  }

  const db = getFirestore();
  const uid = req.auth.uid;

  // 1. Idempotencia: si ya hay un trip con este requestId para este usuario, devolverlo.
  const existing = await db.collection('trips')
    .where('passenger.uid', '==', uid)
    .where('payment.requestId', '==', input.requestId)
    .limit(1).get();
  if (!existing.empty) {
    const t = existing.docs[0]!.data() as TripDoc;
    return { tripId: t.tripId, status: 'searching' as const, fare: { total: t.fare.total, currency: 'COP', surge: t.fare.surge } };
  }

  // 2. Cargar ciudad
  const cityId = await getUserCity(db, uid);
  const citySnap = await db.collection('cities').doc(cityId).get();
  if (!citySnap.exists) throw new HttpsError('not-found', `City ${cityId} not configured`);
  const city = citySnap.data() as City;

  // 3. Cargar perfil del pasajero
  const userSnap = await db.collection('users').doc(uid).get();
  const user = userSnap.data() ?? { displayName: 'Pasajero', ratingAvg: 5 };

  // 4. Estimar distancia/duración (en v2 llamar Mapbox Directions)
  const { meters, seconds } = estimateDistanceDuration(input.pickup, input.dropoff);

  // 5. Calcular fare
  const fare = computeFare({ city, type: input.type, distanceMeters: meters, durationSeconds: seconds });

  // 6. Crear trip
  const tripId = uuidv4();
  const geo6 = geohash9(input.pickup, 6)[0]!;

  const trip: TripDoc = {
    tripId,
    cityId,
    status: 'searching',
    type: input.type,
    passenger: {
      uid,
      displayName: user.displayName ?? 'Pasajero',
      photoURL: user.photoURL ?? null,
      rating: user.ratingAvg ?? 5,
      phone: req.auth.token.phone_number,
    },
    driver: null,
    pickup: input.pickup,
    dropoff: input.dropoff,
    distanceMeters: meters,
    durationSeconds: seconds,
    fare,
    payment: {
      method: input.paymentMethod,
      status: 'pending',
      transactionId: null,
      paidAt: null,
    },
    timeline: {
      requestedAt: Timestamp.now(),
      matchedAt: null,
      acceptedAt: null,
      arrivedAt: null,
      startedAt: null,
      completedAt: null,
      cancelledAt: null,
      cancelledBy: null,
      cancelReason: null,
      ratedAt: null,
    },
    offerLog: [],
    createdAt: Timestamp.now(),
  };

  await db.collection('trips').doc(tripId).set(trip);

  // Mirror de búsqueda en RTDB
  const rtdb = (await import('firebase-admin/database')).getDatabase();
  await rtdb.ref(`cities/${cityId}/trip_search/${geo6}/${tripId}`).set({
    tripId,
    pickup: input.pickup,
    type: input.type,
    requestedAt: Date.now(),
  });

  return { tripId, status: 'searching' as const, fare: { total: fare.total, currency: 'COP', surge: fare.surge }, eta: seconds };
});

async function getUserCity(db: FirebaseFirestore.Firestore, uid: string): Promise<string> {
  const p = await db.collection('passenger_profiles').doc(uid).get();
  return p.data()?.defaultCityId ?? 'aguachica';
}
