import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, collection } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

const SUPER_ADMIN_UIDS = [
  '9qjHXRHfKfS2LrlE6074rR9JOm83',
  'OUeZfonX8AY4YHRI4qLCc1WiVFN2',
  'YohYZ5BLFiUIL9Z4IWrTVlDjwt43',
  'ZfSO1go6agR2owAsDh07GH440QN2'
];

export async function initializeSuperAdmins() {
  if (getApps().length === 0) {
    initializeApp(firebaseConfig);
  }
  
  const db = getFirestore();
  
  const adminIds: Record<string, boolean> = {};
  SUPER_ADMIN_UIDS.forEach(uid => {
    adminIds[uid] = true;
  });

  await setDoc(doc(db, 'appConfig', 'superAdmins'), {
    adminIds,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    description: 'Configuración de superadministradores. NO eliminar.'
  });

  console.log('✅ Superadmins inicializados en Firestore');
}

export function getSuperAdminUids(): string[] {
  return SUPER_ADMIN_UIDS;
}