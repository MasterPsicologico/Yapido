import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, Timestamp } from '@/lib/server/firebase-admin';
import { ensureAdmin } from '@/lib/server/guards';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface CreateRentalInput {
  washerType: 'standard' | 'premium' | 'industrial';
  hours: number;
  address: string;
  cityId: string;
  zoneId: string;
  coordinates: { lat: number; lng: number };
  pricing: {
    rentialFee?: number;
    rentalFee?: number;
    logisticsFee: number;
    serviceFee: number;
    totalPrice: number;
    currency: string;
  };
}

function isCreateRentalInput(payload: unknown): payload is CreateRentalInput {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as Record<string, unknown>;
  return (
    typeof p.washerType === 'string' &&
    ['standard', 'premium', 'industrial'].includes(p.washerType as string) &&
    typeof p.hours === 'number' &&
    p.hours >= 4 &&
    p.hours <= 24 &&
    typeof p.address === 'string' &&
    typeof p.cityId === 'string' &&
    typeof p.zoneId === 'string' &&
    typeof p.pricing === 'object' &&
    typeof (p.pricing as Record<string, unknown>).totalPrice === 'number'
  );
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as unknown;
    if (!isCreateRentalInput(body)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const db = getAdminDb();
    const auth = db; // placeholder alias, sole for readability
    void auth;

    const rentalRef = db.collection('washerRentals').doc();
    await rentalRef.set({
      id: rentalRef.id,
      customerId: 'PENDING_AUTH',
      washerType: body.washerType,
      hours: body.hours,
      address: body.address,
      cityId: body.cityId,
      zoneId: body.zoneId,
      coordinates: body.coordinates,
      pricing: {
        rentalFee: body.pricing.rentalFee ?? body.pricing.rentialFee ?? 0,
        logisticsFee: body.pricing.logisticsFee,
        serviceFee: body.pricing.serviceFee,
        totalPrice: body.pricing.totalPrice,
        currency: body.pricing.currency ?? 'COP',
      },
      status: 'waiting',
      scheduledFor: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({ id: rentalRef.id, status: 'waiting' }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'create failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const guard = await ensureAdmin(req);
  if (guard) return guard as unknown as NextResponse;
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const db = getAdminDb();
    let q = db.collection('washerRentals').orderBy('createdAt', 'desc').limit(50);
    if (status) q = q.where('status', '==', status) as never;
    const snap = await q.get();
    return NextResponse.json({ items: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'list failed' }, { status: 500 });
  }
}
