import { NextResponse } from 'next/server';
import { FieldValue, getAdminDb } from '@/lib/server/firebase-admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Endpoint (Webhook) para recibir notificaciones de Nequi.
 * Cuando Nequi procese el pago (sea exitoso o rechazado), enviará un POST aquí.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { transactionId, status, reference } = body;

    if (!reference || !transactionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(reference);

    await orderRef.update({
      paymentStatus: status === 'APPROVED' ? 'paid' : 'failed',
      paymentMethod: 'nequi',
      nequiTransactionId: transactionId,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[NEQUI WEBHOOK ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
