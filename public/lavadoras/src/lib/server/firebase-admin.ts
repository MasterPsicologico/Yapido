import 'server-only';

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, Firestore, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

type AppEnv = {
  projectId: string | undefined;
  clientEmail: string | undefined;
  privateKey: string | undefined;
};

function readAppEnv(): AppEnv {
  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };
}

function ensureInitialized(): void {
  if (getApps().length > 0) return;
  const env = readAppEnv();
  if (env.projectId && env.clientEmail && env.privateKey) {
    initializeApp({
      credential: cert({
        projectId: env.projectId,
        clientEmail: env.clientEmail,
        privateKey: env.privateKey,
      }),
    });
    return;
  }
  initializeApp();
}

export function getAdminDb(): Firestore {
  ensureInitialized();
  return getFirestore();
}

export function getAdminAuth() {
  ensureInitialized();
  return getAuth();
}

export { FieldValue, Timestamp };

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
