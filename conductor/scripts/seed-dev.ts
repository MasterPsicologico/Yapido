/**
 * Seed de desarrollo: crea usuarios y conductores fake para testing E2E.
 * Ejecutar: `npm run seed:dev`
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'yapido-movilidad-dev';
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!getApps().length) {
  if (clientEmail && privateKey) {
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  } else {
    initializeApp({ projectId });
  }
}

const db = getFirestore();
const auth = getAuth();

const FAKE_DRIVERS = [
  { uid: 'test-driver-1', name: 'Juan Pérez',       phone: '+573001000001', plate: 'ABC123', type: 'moto' as const, brand: 'Yamaha',    model: 'FZ 150',  color: 'Rojo' },
  { uid: 'test-driver-2', name: 'Carlos Ramírez',   phone: '+573001000002', plate: 'DEF456', type: 'moto' as const, brand: 'Honda',     model: 'CB 125',  color: 'Negro' },
  { uid: 'test-driver-3', name: 'Miguel Hernández', phone: '+573001000003', plate: 'GHI789', type: 'auto' as const, brand: 'Renault',   model: 'Logan',   color: 'Blanco' },
  { uid: 'test-driver-4', name: 'Andrés López',     phone: '+573001000004', plate: 'JKL012', type: 'auto' as const, brand: 'Chevrolet', model: 'Onix',    color: 'Gris' },
];

const FAKE_PASSENGER = { uid: 'test-passenger-1', name: 'María González', phone: '+573002000001' };

async function ensureUser(uid: string, name: string, phone: string) {
  try {
    await auth.getUser(uid);
  } catch {
    await auth.createUser({ uid, displayName: name, phoneNumber: phone });
  }
}

async function main() {
  console.log('[seed:dev] Creando datos de prueba…');

  // Pasajero
  await ensureUser(FAKE_PASSENGER.uid, FAKE_PASSENGER.name, FAKE_PASSENGER.phone);
  await db.collection('users').doc(FAKE_PASSENGER.uid).set({
    uid: FAKE_PASSENGER.uid,
    displayName: FAKE_PASSENGER.name,
    phone: FAKE_PASSENGER.phone,
    role: 'passenger',
    fcmTokens: [],
    status: 'active',
    locale: 'es-CO',
    citiesActive: ['aguachica'],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }, { merge: true });
  console.log(`  ✓ Pasajero ${FAKE_PASSENGER.name}`);

  // Conductores
  for (const d of FAKE_DRIVERS) {
    await ensureUser(d.uid, d.name, d.phone);
    const vehicleId = `vehicle-${d.uid}`;
    await db.collection('users').doc(d.uid).set({
      uid: d.uid, displayName: d.name, phone: d.phone, role: 'driver',
      fcmTokens: [], status: 'active', locale: 'es-CO', citiesActive: ['aguachica'],
      createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    }, { merge: true });
    await db.collection('driver_profiles').doc(d.uid).set({
      uid: d.uid, status: 'approved', ratingAvg: 4.8, ratingCount: 32,
      totalTrips: 32, acceptRate30d: 0.9, cancelRate30d: 0.05,
      vehicleId, vehicleType: d.type, online: false,
      currentLocation: null, currentGeohash6: null,
      citiesActive: ['aguachica'], currentCityId: 'aguachica',
      flaggedAt: null, city: 'aguachica',
      bankAccount: null,
      market: { primaryZone: 'centro', worksWeekends: true, worksNights: false, vehicleInspectionPassed: true },
      onboarding: { channel: 'in_person', verifiedBy: 'admin-1', verifiedAt: Timestamp.now(), verificationNotes: null },
    }, { merge: true });
    await db.collection('driver_vehicles').doc(vehicleId).set({
      vehicleId, driverId: d.uid, type: d.type, plate: d.plate,
      brand: d.brand, model: d.model, year: 2020, color: d.color,
      capacity: d.type === 'moto' ? 1 : 4,
      insuranceExpiry: Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 3600 * 1000)),
      soatExpiry:     Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 3600 * 1000)),
      verifiedAt: Timestamp.now(),
    }, { merge: true });
    await db.collection('driver_documents').doc(d.uid).set({
      uid: d.uid, status: 'approved', reviewedBy: 'admin-1', reviewedAt: Timestamp.now(),
    }, { merge: true });
    console.log(`  ✓ Conductor ${d.name} (${d.plate})`);
  }

  console.log('[seed:dev] ✅ Listo. 4 conductores + 1 pasajero fake.');
  console.log('\nLogin en emulador:');
  console.log('  Pasajero:  +57 300 200 0001 → cualquier OTP');
  console.log('  Conductor: +57 300 100 0001 → cualquier OTP');
}

main().catch((e) => { console.error(e); process.exit(1); });
