require('dotenv').config({ path: '.env.local' });

const admin = require('firebase-admin');

const SUPER_ADMIN_UIDS = [
  '9qjHXRHfKfS2LrlE6074rR9JOm83',
  'OUeZfonX8AY4YHRI4qLCc1WiVFN2',
  'YohYZ5BLFiUIL9Z4IWrTVlDjwt43',
  'ZfSO1go6agR2owAsDh07GH440QN2',
];

function initializeFirebaseAdmin() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  console.log('🔍 Verificando configuración...\n');

  if (!projectId) {
    console.error('❌ Falta FIREBASE_PROJECT_ID en .env.local');
    console.log('\n📋 Para obtener tus credenciales:');
    console.log('   1. Ve a: https://console.firebase.google.com');
    console.log('   2. Selecciona tu proyecto');
    console.log('   3. Ve a Configuración → Cuentas de servicio');
    console.log('   4. Haz clic en "Generar nueva clave privada"');
    console.log('   5. Descarga el archivo JSON y copia los valores a .env.local\n');
    process.exit(1);
  }

  console.log('✅ Project ID:', projectId);

  if (!clientEmail || !privateKey) {
    console.error('❌ Falta FIREBASE_CLIENT_EMAIL o FIREBASE_PRIVATE_KEY en .env.local');
    console.log('\n📋 Pasos para obtenerlas:');
    console.log('   1. Ve a: https://console.firebase.google.com');
    console.log('   2. Selecciona tu proyecto (studio-4796645076-6f375)');
    console.log('   3. Ve a Configuración → Cuentas de servicio');
    console.log('   4. Haz clic en "Generar nueva clave privada"');
    console.log('   5. Descarga el JSON y añade los valores a .env.local\n');
    process.exit(1);
  }

  try {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
    }
    console.log('✅ Firebase Admin inicializado correctamente\n');
  } catch (error) {
    console.error('❌ Error al inicializar Firebase Admin:', error.message);
    console.log('\n⚠️ Posibles causas:');
    console.log('   - La clave privada está mal formada');
    console.log('   - El project ID no existe');
    console.log('   - La cuenta de servicio está deshabilitada\n');
    process.exit(1);
  }

  return admin.firestore();
}

async function initializeSuperAdmins() {
  console.log('🚀 Inicializando superadmins en Firestore...\n');

  const db = initializeFirebaseAdmin();

  const adminIds = {};
  SUPER_ADMIN_UIDS.forEach(uid => {
    adminIds[uid] = true;
  });

  try {
    const existingDoc = await db.collection('appConfig').doc('superAdmins').get();
    
    if (existingDoc.exists) {
      console.log('⚠️ Ya existe configuración de superadmins.\n');
      
      const existingData = existingDoc.data();
      console.log('UIDs actuales en Firestore:');
      if (existingData && existingData.adminIds) {
        Object.keys(existingData.adminIds).forEach(uid => {
          console.log('  - ' + uid);
        });
      }
      console.log('');
      
      console.log('ℹ️ Los superadmins ya están configurados.');
      console.log('   No necesitas ejecutar este script de nuevo.\n');
      console.log('✅ Sincronización completada.\n');
      return;
    }

    await db.collection('appConfig').doc('superAdmins').set({
      adminIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: 'Configuración de superadministradores. NO eliminar.',
      initializedBy: 'init-superadmins.js',
    });

    console.log('✅ Superadmins inicializados correctamente');
    console.log('\nUIDs configurados como superadmin:');
    SUPER_ADMIN_UIDS.forEach(uid => console.log('  - ' + uid));
    console.log('');

    console.log('📝 IMPORTANTE: Las reglas de Firestore ahora verificarán esta configuración.');
    console.log('   Los UIDs ya NO están hardcodeados en el código (seguridad mejorada).\n');

    console.log('📋 Próximo paso: Despliega las reglas de seguridad');
    console.log('   firebase deploy --only firestore:rules\n');

  } catch (error) {
    console.error('❌ Error al inicializar superadmins:', error.message);
    process.exit(1);
  }
}

initializeSuperAdmins();