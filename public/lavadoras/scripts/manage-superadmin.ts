/**
 * @fileOverview Añade/quita un UID a `appConfig/superAdmins`.
 *
 * Uso:
 *   npm run admin:add -- <UID>
 *   npm run admin:remove -- <UID>
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

function readEnv() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Faltan variables FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY en .env.local');
    process.exit(1);
  }
  return { projectId, clientEmail, privateKey };
}

function init() {
  const env = readEnv();
  if (!getApps().length) {
    initializeApp({ credential: cert(env) });
  }
  return getFirestore();
}

async function main() {
  const mode = process.argv[1]?.includes('admin:remove') ? 'remove' : 'add';
  const uid = process.argv[2];
  if (!uid) {
    console.error(`❌ Falta UID. Uso: npm run admin:${mode} -- <UID>`);
    process.exit(1);
  }

  const db = init();
  const ref = db.collection('appConfig').doc('superAdmins');
  const snap = await ref.get();
  const current = (snap.data()?.adminIds as Record<string, boolean> | undefined) || {};

  if (mode === 'add') {
    if (current[uid] === true) {
      console.log(`ℹ️  ${uid} ya es superadmin. Nada que hacer.`);
      return;
    }
    current[uid] = true;
    await ref.set(
      {
        adminIds: { ...current },
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    console.log(`✅ ${uid} añadido como superadmin.`);
    return;
  }

  if (current[uid] !== true) {
    console.log(`ℹ️  ${uid} no estaba en adminIds. Nada que hacer.`);
    return;
  }
  delete current[uid];
  await ref.set(
    {
      adminIds: { ...current },
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  console.log(`✅ ${uid} removido de superadmins.`);
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
