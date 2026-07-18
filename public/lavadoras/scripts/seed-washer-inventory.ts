/**
 * @fileOverview Semilla de inventario de lavadoras para demos/dev.
 * Crea N unidades en `washerInventory/{unitId}` con estado `available`.
 *
 * Uso:
 *   npm run seed:washer-inventory
 *   npm run seed:washer-inventory -- --count 25
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

function readEnv() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Faltan variables FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY en .env.local');
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

function argInt(name: string, fallback: number): number {
  const idx = process.argv.indexOf(name);
  if (idx < 0) return fallback;
  const n = parseInt(process.argv[idx + 1], 10);
  return Number.isFinite(n) ? n : fallback;
}

const TYPES = ['standard', 'premium', 'industrial'] as const;
const BRANDS = ['LG', 'Samsung', 'Whirlpool', 'Mabe', 'Electrolux'];
const CITIES = ['aguachica'];

async function main() {
  const count = argInt('--count', 10);
  console.log(`🚀 Sembrando ${count} unidades de lavadoras…\n`);
  const db = init();

  for (let i = 0; i < count; i += 1) {
    const type = TYPES[i % TYPES.length];
    const brand = BRANDS[i % BRANDS.length];
    const cityId = CITIES[i % CITIES.length];
    const id = `lava-${String(i + 1).padStart(4, '0')}`;
    await db
      .collection('washerInventory')
      .doc(id)
      .set(
        {
          id,
          serialNumber: `${brand.toUpperCase()}-${String(Date.now() + i).slice(-6)}`,
          type,
          brand,
          model: `${brand}-${type}`,
          capacityKg: type === 'standard' ? 8 : type === 'premium' ? 12 : 20,
          status: 'available',
          currentCityId: cityId,
          totalRentals: 0,
          totalRevenue: 0,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
        { merge: true },
      );
  }

  console.log(`✅ ${count} unidades sembradas en washerInventory.`);
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
