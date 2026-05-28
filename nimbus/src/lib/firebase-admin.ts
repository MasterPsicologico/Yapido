import * as admin from 'firebase-admin';

// Esta función ahora se encarga de la inicialización de forma robusta.
export function getAdminApp() {
    // Si la app 'default' ya está inicializada, la devuelve.
    // Esto evita errores de "la app ya existe".
    if (admin.apps.length > 0 && admin.apps[0]) {
        return admin.apps[0];
    }

    try {
        // Intenta inicializar con las credenciales predeterminadas de la aplicación.
        // Esto funciona en Google Cloud (producción) y también en un entorno local
        // si se ha autenticado con `gcloud auth application-default login`.
        // Es el mismo método que usa Genkit.
        return admin.initializeApp({
             credential: admin.credential.applicationDefault(),
             storageBucket: "studio-3422235219-dd152.appspot.com"
        });
    } catch (error: any) {
        console.error('Error al inicializar Firebase Admin SDK con credenciales predeterminadas:', error);
        // Devolvemos null si falla, para que el código que lo llama pueda manejarlo.
        return null;
    }
}
