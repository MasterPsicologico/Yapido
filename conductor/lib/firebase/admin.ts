/**
 * Inicialización del SDK Admin (server-side).
 * Usado por Cloud Functions y scripts de seed.
 */

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getDatabase } from 'firebase-admin/database';
import { getStorage } from 'firebase-admin/storage';

let _app: App | null = null;

function getAdminApp(): App {
  if (_app) return _app;
  if (getApps().length) {
    _app = getApps()[0]!;
    return _app;
  }
  // En emulador, no requiere credenciales explícitas
  if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    _app = initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? 'yapido-movilidad-dev' });
  } else {
    _app = initializeApp({
      credential: cert({
        projectId:   process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey:  process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }
  return _app;
}

export const adminApp = () => getAdminApp();
export const adminAuth = () => getAuth(getAdminApp());
export const adminDb = () => getFirestore(getAdminApp());
export const adminRtdb = () => getDatabase(getAdminApp());
export const adminStorage = () => getStorage(getAdminApp());

