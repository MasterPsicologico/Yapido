import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/server/firebase-admin';
import { ensureAdmin, ensureDebug } from '@/lib/server/guards';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const adminGuard = await ensureAdmin(req);
  if (adminGuard) return adminGuard as unknown as NextResponse;

  const debugGuard = await ensureDebug(req);
  if (debugGuard) return debugGuard as unknown as NextResponse;

  try {
    const db = getAdminDb();
    const batch = db.batch();

    const store1Ref = db.collection('stores').doc('WpcMktprzrfV81bkecYv');
    batch.update(store1Ref, { type: 'washer_rental', status: 'active' });

    const store2Ref = db.collection('stores').doc('weYfl6c9CUGVGY8hR1ea');
    batch.update(store2Ref, { type: 'washer_rental', status: 'active' });

    const store3Ref = db.collection('stores').doc('eAdT15Y3GkUgdce7JzBT');
    batch.update(store3Ref, { type: 'washer_rental', status: 'active' });

    await batch.commit();

    console.log('[Debug] Stores fixed successfully');
    return NextResponse.json({
      message: 'Stores fixed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Debug] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
