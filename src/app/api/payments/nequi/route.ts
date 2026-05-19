import { NextResponse } from 'next/server';

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
 * Endpoint (Webhook) para recibir notificaciones de Nequi.
 * Cuando Nequi procese el pago (sea exitoso o rechazado), enviará un POST aquí.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Nequi enviará información como el transactionId, status, y reference (nuestro orderId)
    const { transactionId, status, reference } = body;

    if (!reference || !transactionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getAdminDb();
    const { FieldValue } = require('firebase-admin/firestore');
    
    // Actualizamos el estado del pago en la base de datos
    const orderRef = db.collection('orders').doc(reference);
    
    await orderRef.update({
      paymentStatus: status === 'APPROVED' ? 'paid' : 'failed',
      paymentMethod: 'nequi',
      nequiTransactionId: transactionId,
      updatedAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[NEQUI WEBHOOK ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
