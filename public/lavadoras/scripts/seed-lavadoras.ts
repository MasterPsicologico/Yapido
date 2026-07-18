/**
 * @fileOverview Semilla del proyecto Lavadoras.
 * Idempotente: usa `set({ merge: true })` así que puede ejecutarse varias veces.
 *
 * Crea:
 *  - appConfig/superAdmins (admin vacío si no pasas UID)
 *  - appConfig/settings (config global del producto lavado­ras)
 *  - mainCategories/{lavadoras,transporte,soporte}
 *  - appConfig/washerTypes (tarifa base por hora por tipo)
 *
 * Uso:
 *   npm run seed:lavadoras
 *   npm run seed:lavadoras -- --admin <UID>
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

function readEnv() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) {
    console.error(
      '❌ Faltan variables FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY en .env.local',
    );
    process.exit(1);
  }
  return { projectId, clientEmail, privateKey };
}

function init() {
  const env = readEnv();
  if (!getApps().length) {
    initializeApp({ credential: cert(env) });
  }
  return getFirestore();
}

function arg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

async function seedSuperAdmins(db: FirebaseFirestore.Firestore, uid?: string) {
  const ref = db.collection('appConfig').doc('superAdmins');
  const payload: Record<string, unknown> = {
    updatedAt: Timestamp.now(),
  };
  if (uid) {
    payload.adminIds = { [uid]: true };
    payload.createdAt = Timestamp.now();
  }
  await ref.set(payload, { merge: true });
  console.log(`✅ appConfig/superAdmins ${uid ? `(admin=${uid})` : '(sin admin)'} actualizado.`);
}

async function seedSettings(db: FirebaseFirestore.Firestore) {
  await db
    .collection('appConfig')
    .doc('settings')
    .set(
      {
        version: '1.0.0-lavadoras',
        name: 'Lavadoras',
        description: 'Alquiler de lavadoras con logística propia + IA.',
        paymentMethods: ['nequi', 'pse', 'cash'],
        maxRentalHours: 24,
        minRentalHours: 4,
        updatedAt: Timestamp.now(),
      },
      { merge: true },
    );
  console.log('✅ appConfig/settings actualizado.');
}

async function seedMainCategories(db: FirebaseFirestore.Firestore) {
  const cats = [
    { id: 'lavadoras', name: 'Alquiler de Lavadoras', icon: 'washing-machine', active: true, order: 1 },
    { id: 'transporte', name: 'Transporte', icon: 'truck', active: true, order: 2 },
    { id: 'soporte', name: 'Soporte', icon: 'life-buoy', active: true, order: 3 },
  ];
  for (const cat of cats) {
    await db.collection('mainCategories').doc(cat.id).set(cat, { merge: true });
  }
  console.log(`✅ ${cats.length} categorías creadas.`);
}

async function seedWasherTypes(db: FirebaseFirestore.Firestore) {
  await db
    .collection('appConfig')
    .doc('washerTypes')
    .set(
      {
        types: [
          { type: 'standard', baseHourlyRate: 8000, enabled: true, capacityKg: 8 },
          { type: 'premium', baseHourlyRate: 14000, enabled: true, capacityKg: 12 },
          { type: 'industrial', baseHourlyRate: 22000, enabled: true, capacityKg: 20 },
        ],
        currency: 'COP',
        updatedAt: Timestamp.now(),
      },
      { merge: true },
    );
  console.log('✅ appConfig/washerTypes configurado (standard/premium/industrial).');
}

async function seedCity(db: FirebaseFirestore.Firestore) {
  await db
    .collection('cities')
    .doc('aguachica')
    .set(
      {
        cityId: 'aguachica',
        displayName: 'Aguachica',
        region: 'Cesar',
        country: 'CO',
        currency: 'COP',
        timezone: 'America/Bogota',
        centerLat: 8.312,
        centerLng: -73.626,
        status: 'active',
        supportPhone: '+57 000 000 0000',
        supportWhatsapp: '+57 000 000 0000',
        createdAt: Timestamp.now(),
      },
      { merge: true },
    );
  console.log('✅ cities/aguachica sembrada.');
}

async function main() {
  const db = init();
  const adminUid = arg('--admin');
  console.log('🚀 Semilla Lavadoras — inicio\n');
  await seedSuperAdmins(db, adminUid);
  await seedSettings(db);
  await seedMainCategories(db);
  await seedWasherTypes(db);
  await seedCity(db);
  console.log('\n🎉 Semilla completa. Ejecuta `git status` para revisar.');
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
