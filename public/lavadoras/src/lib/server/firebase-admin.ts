import 'server-only';

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, Firestore, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

interface AppEnv {
  projectId: string | undefined;
  clientEmail: string | undefined;
  privateKey: string | undefined;
}

function readAppEnv(): AppEnv {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    const missing = [];
    if (!projectId) missing.push('FIREBASE_PROJECT_ID');
    if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
    if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');
    throw new Error(
      `[Firebase Admin] Missing required environment variables: ${missing.join(', ')}. ` +
      `Configure them in Vercel Dashboard → Settings → Environment Variables.`
    );
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKey!.replace(/\\n/g, '\n'),
  };
}

function ensureInitialized(): void {
  if (getApps().length > 0) return;
  const env = readAppEnv();
  initializeApp({
    credential: cert({
      projectId: env.projectId,
      clientEmail: env.clientEmail,
      privateKey: env.privateKey,
    }),
  });
}

export function getAdminDb(): Firestore {
  ensureInitialized();
  return getFirestore();
}

export function getAdminAuth() {
  ensureInitialized();
  return getAuth();
}

export async function isSuperAdmin(uid: string): Promise<boolean> {
  const db = getAdminDb();
  const doc = await db.collection('appConfig').doc('superAdmins').get();
  if (!doc.exists) return false;
  const adminIds = (doc.data()?.adminIds as Record<string, boolean> | undefined) || {};
  return adminIds[uid] === true;
}

export async function verifySuperAdminFromAuthHeader(authHeader: string | null): Promise<boolean> {
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.substring(7);
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return isSuperAdmin(decoded.uid);
  } catch {
    return false;
}
}

export { FieldValue, Timestamp } from 'firebase-admin/firestore';