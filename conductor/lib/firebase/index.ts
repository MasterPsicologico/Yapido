/**
 * ⚠️  Barrel CLIENTE-ONLY. NO incluye firebase-admin (rompe webpack en navegador).
 *     Para código server-side (Cloud Functions, scripts), importar directo de:
 *       import { adminDb, adminAuth, ... } from '@/lib/firebase/admin';
 */

export {
  firebaseApp,
  firebaseAuth,
  firebaseDb,
  firebaseRtdb,
  firebaseStorage,
  firebaseFunctions,
  isEmulator,
} from './client';

export type {
  FirebaseApp,
  Auth,
  Firestore,
  Database,
  FirebaseStorage,
  Functions,
} from './client';
