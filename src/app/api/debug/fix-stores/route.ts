import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SUPER_ADMIN_CONFIG_DOC = process.env.SUPER_ADMIN_FIRESTORE_PATH || 'appConfig/superAdmins';

async function verifyAdminAuth(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  
  const token = authHeader.substring(7);
  
  try {
    const { getApps, initializeApp, cert } = require('firebase-admin/app');
    const { getAuth, getFirestore } = require('firebase-admin/auth');
    
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
    
    const decodedToken = await getAuth().verifyIdToken(token);
    const db = getFirestore();
    
    const superAdminDoc = await db.collection('appConfig').doc('superAdmins').get();
    if (superAdminDoc.exists) {
      const adminIds = superAdminDoc.data()?.adminIds || {};
      return adminIds[decodedToken.uid] === true;
    }
    
    return false;
  } catch {
    return false;
  }
}

function getAdminDb() {
  const { getApps, initializeApp, cert } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');
  
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (!getApps().length) {
    try {
      if (projectId && clientEmail && privateKey) {
        initializeApp({
          credential: cert({ projectId, clientEmail, privateKey }),
        });
      } else {
        initializeApp();
      }
    } catch (e) {
      initializeApp();
    }
  }
  return getFirestore();
}

export async function GET(req: NextRequest) {
  const isAuthorized = await verifyAdminAuth(req);
  
  if (!isAuthorized) {
    const envCheck = process.env.NODE_ENV !== 'development';
    if (envCheck) {
      return NextResponse.json({ 
        error: 'Unauthorized - Admin access required',
        hint: 'Pass a valid Firebase ID token with admin role in Authorization header'
      }, { status: 403 });
    }
  }
  
  const secretHeader = req.headers.get('x-debug-secret');
  const debugSecret = process.env.DEBUG_SECRET;
  
  if (debugSecret && secretHeader !== debugSecret) {
    return NextResponse.json({ error: 'Invalid debug secret' }, { status: 403 });
  }
  
  if (debugSecret && secretHeader === debugSecret) {
    console.log('[Debug] Debug access granted via secret key');
  }
  
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
    return NextResponse.json({ message: 'Stores fixed successfully', timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error('[Debug] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}