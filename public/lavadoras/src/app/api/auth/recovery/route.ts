import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/server/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Código debe tener 6 dígitos numéricos' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const auth = getAdminAuth();

    // Look up user by recovery code in users collection
    const usersSnapshot = await db
      .collection('users')
      .where('recoveryCode', '==', code)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json(
        { error: 'Código de recuperación inválido. Verifica tu código de 6 dígitos.' },
        { status: 404 }
      );
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    const targetUid = userDoc.id;

    // Generate custom token for the user
    const customToken = await auth.createCustomToken(targetUid);

    console.log('[Recovery API] Generated custom token for UID:', targetUid);

    return NextResponse.json({
      customToken,
      uid: targetUid,
      recoveryCode: code,
      profile: userData.profile || {},
      rentalHistory: userData.rentalHistory || [],
      favorites: userData.favorites || [],
      cart: userData.cart || [],
      notifications: userData.notifications || [],
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Recovery API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}