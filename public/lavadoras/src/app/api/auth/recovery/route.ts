import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth, FieldValue } from '@/lib/server/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, deviceFingerprint, deviceInfo } = body;

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

    // ==========================================
    // SERVER-SIDE PERSISTENCE (Admin SDK)
    // Firestore rules do NOT apply here, so this always succeeds.
    // The account data is stored keyed by device fingerprint so the
    // account can be auto-restored on this device later, and so the
    // client never needs to write to Firestore (avoids the
    // "Missing or insufficient permissions" error entirely).
    // ==========================================
    if (deviceFingerprint && typeof deviceFingerprint === 'string') {
      try {
        const accountData = {
          uid: targetUid,
          recoveryCode: code,
          profile: userData.profile || {},
          rentalHistory: userData.rentalHistory || [],
          favorites: userData.favorites || [],
          cart: userData.cart || [],
          notifications: userData.notifications || [],
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: FieldValue.serverTimestamp(),
          synced: true,
        };

        // Link device fingerprint -> UID
        await db.collection('device_fingerprints').doc(deviceFingerprint).set(
          {
            uid: targetUid,
            recoveryCode: code,
            deviceInfo: deviceInfo || null,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        // Store full account snapshot keyed by device fingerprint
        await db.collection('device_data').doc(deviceFingerprint).set(
          {
            ...accountData,
            deviceFingerprint,
            currentUid: targetUid,
            accounts: {
              [targetUid]: accountData,
            },
          },
          { merge: true }
        );

        console.log('[Recovery API] Device link + data persisted for fingerprint:', deviceFingerprint);
      } catch (persistError) {
        // Non-fatal: the login itself already succeeded (custom token is valid)
        console.error('[Recovery API] Failed to persist device link (non-fatal):', persistError);
      }
    }

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