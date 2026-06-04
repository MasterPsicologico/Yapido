/**
 * Seed: crea el documento `cities/aguachica` con geofence, pricing y datos de lanzamiento.
 * Ejecutar: `npm run seed:aguachica`
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Config desde .env.local
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'yapido-movilidad-dev';
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!getApps().length) {
  if (clientEmail && privateKey) {
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  } else {
    // Modo emulador
    initializeApp({ projectId });
  }
}

const db = getFirestore();

// Polígono operativo simplificado de Aguachica centro + barrios principales.
// En producción reemplazar con el polígono real dibujado en el mapa.
const AGUACHICA_POLYGON: number[][][] = [
  [
    [-73.6430, 8.3210], // NW
    [-73.6000, 8.3210], // NE
    [-73.6000, 8.3000], // SE
    [-73.6430, 8.3000], // SW
    [-73.6430, 8.3210], // cierre
  ],
];

const aguachica = {
  cityId: 'aguachica',
  displayName: 'Aguachica',
  region: 'cesar',
  country: 'CO' as const,
  currency: 'COP' as const,
  timezone: 'America/Bogota',
  population: 102_000,
  centerLat: 8.3127,
  centerLng: -73.6218,
  serviceArea: { type: 'polygon' as const, coordinates: AGUACHICA_POLYGON },
  geofence:   { type: 'polygon' as const, coordinates: AGUACHICA_POLYGON },
  pricing: {
    moto: {
      base: 3500,
      perKm: 900,
      perMin: 150,
      minFare: 5000,
      currency: 'COP' as const,
      commissionPct: 0.0,    // 0% lanzamiento 4 semanas
      waitingFeePerMin: 200,
    },
    auto: {
      base: 4500,
      perKm: 1400,
      perMin: 200,
      minFare: 7000,
      currency: 'COP' as const,
      commissionPct: 0.0,
      waitingFeePerMin: 200,
    },
    auto_comfort: {
      base: 6500,
      perKm: 1900,
      perMin: 280,
      minFare: 10000,
      currency: 'COP' as const,
      commissionPct: 0.0,
      waitingFeePerMin: 250,
    },
    surge: { enabled: false, max: 1.5 },
  },
  status: 'launching' as const,
  launchedAt: null,
  supportPhone: '+57 300 000 0000',
  supportWhatsapp: '+57 300 000 0000',
  stats: { activeDrivers: 0, tripsToday: 0, avgWaitMin: 0 },
  updatedAt: Timestamp.now(),
};

async function main() {
  console.log(`[seed] Escribiendo cities/aguachica (project=${projectId})…`);
  await db.collection('cities').doc('aguachica').set(aguachica, { merge: true });
  console.log('[seed] ✅ Aguachica lista');
  console.log('  • Centro:        8.3127, -73.6218');
  console.log('  • Población:     ~102.000');
  console.log('  • Comisión:      0% (lanzamiento 4 semanas)');
  console.log('  • Pricing moto:  base $3.500 + $900/km + $150/min, mín $5.000');
  console.log('  • Pricing auto:  base $4.500 + $1.400/km + $200/min, mín $7.000');
}

main().catch((e) => { console.error(e); process.exit(1); });
