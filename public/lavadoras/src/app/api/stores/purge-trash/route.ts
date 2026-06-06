import { NextRequest, NextResponse } from 'next/server';

// Forzar ejecución dinámica — nunca se ejecuta en build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// Lazy init de Firebase Admin para evitar errores en build
function getAdminDb() {
  const { getApps, initializeApp, cert } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
}

/**
 * POST /api/stores/purge-trash
 * Purga permanentemente las tiendas que llevan más de 24h en papelera.
 * Llamado por Vercel Cron (diariamente a las 2am UTC) con header X-CRON-SECRET.
 */
export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get('X-CRON-SECRET');
  const isAuthorized = cronSecret === process.env.CRON_SECRET || process.env.NODE_ENV === 'development';

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const { Timestamp } = require('firebase-admin/firestore');
    const cutoffTime = Timestamp.fromMillis(Date.now() - TWENTY_FOUR_HOURS_MS);

    const snapshot = await db
      .collection('stores')
      .where('status', '==', 'trashed')
      .where('trashedAt', '<=', cutoffTime)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ message: 'No stores to purge', purged: 0 });
    }

    const batch = db.batch();
    const purgedIds: string[] = [];

    snapshot.docs.forEach((docSnap: any) => {
      batch.delete(docSnap.ref);
      purgedIds.push(docSnap.id);
    });

    await batch.commit();
    console.log(`[PURGE-TRASH] Purged ${purgedIds.length} stores permanently:`, purgedIds);

    return NextResponse.json({
      message: 'Purge complete',
      purged: purgedIds.length,
      ids: purgedIds,
    });
  } catch (error: any) {
    console.error('[PURGE-TRASH] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/stores/purge-trash
 * Consulta cuántas tiendas están en papelera con su tiempo restante.
 */
export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get('X-CRON-SECRET');
  const isAuthorized = cronSecret === process.env.CRON_SECRET || process.env.NODE_ENV === 'development';

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const snapshot = await db.collection('stores').where('status', '==', 'trashed').get();
    const now = Date.now();

    const stores = snapshot.docs.map((d: any) => {
      const data = d.data();
      const trashedAt = data.trashedAt?.toMillis?.() || 0;
      const hoursLeft = Math.max(0, 24 - (now - trashedAt) / (1000 * 60 * 60));
      return {
        id: d.id,
        name: data.name,
        trashedAt: new Date(trashedAt).toISOString(),
        hoursLeft: Math.round(hoursLeft * 10) / 10,
        deleteAt: new Date(trashedAt + TWENTY_FOUR_HOURS_MS).toISOString(),
      };
    });

    return NextResponse.json({ trashed: stores, total: stores.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
