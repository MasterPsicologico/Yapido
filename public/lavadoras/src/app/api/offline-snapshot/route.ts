import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/server/firebase-admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_PATHS = ['products', 'stores', 'cities', 'appConfig/washerTypes'] as const;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.searchParams.get('path');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 200);

  if (!path || !(ALLOWED_PATHS as readonly string[]).includes(path)) {
    return NextResponse.json({ error: 'path no permitido' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const isDoc = !path.includes('/');
    if (isDoc) {
      if (path === 'appConfig/washerTypes') {
        // path contiene "/" pero es doc singular
      }
    }

    if (path.includes('/')) {
      const [col, docId] = path.split('/');
      const snap = await db.collection(col).doc(docId).get();
      if (!snap.exists) return NextResponse.json({ items: [] });
      const data = snap.data() || {};
      return NextResponse.json({ items: [{ id: snap.id, ...data }] });
    }

    const snapshot = await db.collection(path).limit(limit).get();
    const items = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));
    return NextResponse.json({ items, count: items.length });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'snapshot failed' }, { status: 500 });
  }
}
