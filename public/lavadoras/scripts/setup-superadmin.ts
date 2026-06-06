import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌ ERROR: Faltan variables de entorno.');
  console.log('Configura FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY en .env.local');
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

const db = getFirestore();

async function setupSuperAdmin() {
  const superAdminUid = process.argv[2];
  
  if (!superAdminUid) {
    console.log('❌ ERROR: Proporciona el UID del superadmin.');
    console.log('Usage: npx tsx scripts/setup-superadmin.ts <UID>');
    console.log('');
    console.log('Para obtener tu UID:');
    console.log('1. Inicia sesión en la app');
    console.log('2. Ve a Firestore Console > users > tu documento');
    console.log('3. Copia el ID del documento');
    process.exit(1);
  }

  console.log(`🔧 Configurando superadmin con UID: ${superAdminUid}`);

  try {
    const superAdminRef = db.collection('appConfig').doc('superAdmins');
    
    await superAdminRef.set({
      adminIds: {
        [superAdminUid]: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    console.log('✅ Superadmin configurado correctamente!');
    console.log('');
    console.log('Puedes verificar en Firestore:');
    console.log('  Colección: appConfig');
    console.log('  Documento: superAdmins');
    console.log('  Campo: adminIds.' + superAdminUid + ' = true');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupSuperAdmin();