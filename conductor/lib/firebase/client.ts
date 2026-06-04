/**
 * Inicialización de Firebase para el CLIENTE.
 * ⚠️  NO importar nada de Node (firebase-admin) desde este archivo.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, type Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getDatabase, type Database, connectDatabaseEmulator } from 'firebase/database';
import { getStorage, type FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, type Functions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'yapido-movilidad',
  databaseURL:       process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isEmulator = false;

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _rtdb: Database | null = null;
let _storage: FirebaseStorage | null = null;
let _functions: Functions | null = null;

function getAppInstance(): FirebaseApp {
  if (_app) return _app;
  _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return _app;
}

export function firebaseApp(): FirebaseApp {
  return getAppInstance();
}

export function firebaseAuth(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(getAppInstance());
  if (isEmulator) {
    try { connectAuthEmulator(_auth, 'http://localhost:9099', { disableWarnings: true }); } catch {}
  }
  return _auth;
}

export function firebaseDb(): Firestore {
  if (_db) return _db;
  _db = getFirestore(getAppInstance());
  if (isEmulator) {
    try { connectFirestoreEmulator(_db, 'localhost', 8080); } catch {}
  }
  return _db;
}

export function firebaseRtdb(): Database {
  if (_rtdb) return _rtdb;
  _rtdb = getDatabase(getAppInstance());
  if (isEmulator) {
    try { connectDatabaseEmulator(_rtdb, 'localhost', 9000); } catch {}
  }
  return _rtdb;
}

export function firebaseStorage(): FirebaseStorage {
  if (_storage) return _storage;
  _storage = getStorage(getAppInstance());
  if (isEmulator) {
    try { connectStorageEmulator(_storage, 'localhost', 9199); } catch {}
  }
  return _storage;
}

export function firebaseFunctions(): Functions {
  if (_functions) return _functions;
  _functions = getFunctions(getAppInstance(), 'us-central1');
  if (isEmulator) {
    try { connectFunctionsEmulator(_functions, 'localhost', 5001); } catch {}
  }
  return _functions;
}

export type { FirebaseApp, Auth, Firestore, Database, FirebaseStorage, Functions };

