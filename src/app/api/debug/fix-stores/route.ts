
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getAdminDb() {
  const { getApps, initializeApp, cert } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');
  if (!getApps().length) {
    // If env vars are missing, this might fail, but let's try
    try {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    } catch (e) {
      // If it fails, try default initialization (works if ADC is set)
      initializeApp();
    }
  }
  return getFirestore();
}

export async function GET(req: NextRequest) {
  try {
    const db = getAdminDb();
    const batch = db.batch();
    
    // Fix: Alquiler de lavadoras la esquina
    const store1Ref = db.collection('stores').doc('WpcMktprzrfV81bkecYv');
    batch.update(store1Ref, { type: 'washer_rental', status: 'active' });
    
    // Fix: LavaExpress
    const store2Ref = db.collection('stores').doc('weYfl6c9CUGVGY8hR1ea');
    batch.update(store2Ref, { type: 'washer_rental', status: 'active' });

    // Fix: Lava express (re-activate)
    const store3Ref = db.collection('stores').doc('eAdT15Y3GkUgdce7JzBT');
    batch.update(store3Ref, { type: 'washer_rental', status: 'active' });
    
    await batch.commit();
    
    return NextResponse.json({ message: 'Stores fixed successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
