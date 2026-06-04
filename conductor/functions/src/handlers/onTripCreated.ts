/**
 * Cloud Function principal: cuando se crea un trip, busca conductor.
 */

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getDatabase } from 'firebase-admin/database';
import { getMessaging } from 'firebase-admin/messaging';
import { v4 as uuidv4 } from 'uuid';
import type { City, TripDoc } from '../types.js';
import { rankDrivers, getOfferTimeoutMs } from '../lib/matching.js';
import { geohash9 } from '../lib/geo.js';

export const onTripCreated = onDocumentCreated('trips/{tripId}', async (event) => {
  const tripId = event.params.tripId;
  const snap = event.data;
  if (!snap) return;
  const trip = snap.data() as TripDoc;
  if (trip.status !== 'searching') return;

  const db = getFirestore();
  const rtdb = getDatabase();

  // 1. Cargar ciudad
  const citySnap = await db.collection('cities').doc(trip.cityId).get();
  if (!citySnap.exists) {
    logger.error(`City ${trip.cityId} not found`);
    return;
  }
  const city = citySnap.data() as City;

  // 2. Listar conductores online en la ciudad
  const driversSnap = await rtdb.ref(`cities/${trip.cityId}/drivers_online`).once('value');
  const raw = driversSnap.val() ?? {};
  const candidates = Object.values(raw)
    .filter((d: any) => d.status === 'online' && d.vehicleType === trip.type)
    .map((d: any) => ({
      id: d.driverId ?? d.id,
      loc: { lat: d.loc.lat, lng: d.loc.lng },
      ratingAvg: d.ratingAvg ?? 5,
      acceptRate30d: d.acceptRate30d ?? 1,
      vehicleType: d.vehicleType,
      idleMinutes: Math.floor((Date.now() - (d.updatedAt ?? Date.now())) / 60_000),
    }));

  // 3. Ranking
  const ranked = rankDrivers(candidates, trip.pickup, trip.type, city);
  if (ranked.length === 0) {
    await snap.ref.update({ status: 'no_drivers' });
    return;
  }

  // 4. Cascada de ofertas
  const offerTimeout = getOfferTimeoutMs(city);
  for (const driver of ranked) {
    const offerId = uuidv4();
    const expiresAt = Date.now() + offerTimeout;

    // 4a. Publicar oferta en RTDB
    await rtdb.ref(`cities/${trip.cityId}/offers/${driver.id}/current`).set({
      offerId,
      tripId,
      pickup: trip.pickup,
      dropoff: trip.dropoff,
      type: trip.type,
      fareEstimate: trip.fare.total,
      distanceKm: driver.distance,
      expiresAt,
      createdAt: Date.now(),
    });

    // 4b. Log de oferta
    await snap.ref.update({
      offerLog: FieldValue.arrayUnion({
        driverId: driver.id,
        offeredAt: Timestamp.now(),
        expiredAt: null,
      }),
    });

    // 4c. Notificar al conductor (FCM)
    const fcmToken = await getFcmToken(db, driver.id);
    if (fcmToken) {
      try {
        await getMessaging().send({
          token: fcmToken,
          notification: {
            title: 'Nuevo viaje cerca',
            body: `${formatCOP(trip.fare.total)} • ${driver.distance.toFixed(1)} km`,
          },
          data: { tripId, offerId, type: 'new_offer' },
          android: { priority: 'high', notification: { sound: 'default' } },
        });
      } catch (e) {
        logger.warn(`FCM send failed to ${driver.id}`, e);
      }
    }

    // 4d. Esperar respuesta
    const accepted = await waitForAccept(rtdb, tripId, driver.id, offerTimeout);
    if (accepted) {
      logger.info(`Trip ${tripId} assigned to ${driver.id}`);
      return;
    }
    // Limpiar oferta expirada
    await rtdb.ref(`cities/${trip.cityId}/offers/${driver.id}/current`).remove();
  }

  // Nadie aceptó
  await snap.ref.update({ status: 'no_drivers' });
});

async function getFcmToken(db: FirebaseFirestore.Firestore, uid: string): Promise<string | null> {
  const u = await db.collection('users').doc(uid).get();
  const tokens = (u.data()?.fcmTokens as string[] | undefined) ?? [];
  return tokens[0] ?? null;
}

async function waitForAccept(
  rtdb: ReturnType<typeof getDatabase>,
  tripId: string,
  driverId: string,
  timeoutMs: number
): Promise<boolean> {
  return new Promise(async (resolve) => {
    const start = Date.now();
    const unsub = rtdb.ref(`trips/${tripId}/acceptances/${driverId}`).on('value', async (s) => {
      const v = s.val();
      if (v?.status === 'accepted') {
        unsub();
        resolve(true);
      }
      if (Date.now() - start > timeoutMs) {
        unsub();
        resolve(false);
      }
    });
    // Safety timeout
    setTimeout(() => {
      unsub();
      resolve(false);
    }, timeoutMs + 1000);
  });
}

function formatCOP(n: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}
