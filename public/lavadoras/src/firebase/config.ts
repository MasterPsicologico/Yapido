export const firebaseConfig = {
  "projectId": "studio-4796645076-6f375",
  "appId": "1:294212274372:web:58514b627da5eeb7152191",
  "apiKey": "AIzaSyBkcF4SKkIrIk43qioUfys9bsyRD2MVKW0",
  "authDomain": "studio-4796645076-6f375.firebaseapp.com",
  "storageBucket": "studio-4796645076-6f375.firebasestorage.app",
  "messagingSenderId": "294212274372"
};

/**
 * Google OAuth Web Client ID usado por Google One Tap (Identity Services).
 * Debe coincidir con el Web Client ID registrado en Google Cloud Console
 * para el proyecto lavadoras-yapido y aceptado por Firebase Console
 * (Authentication → Sign-in method → Google → Web SDK configuration).
 *
 * Si NEXT_PUBLIC_GOOGLE_CLIENT_ID esta definido en el entorno, tiene prioridad
 * (utile en previews/deploys alternativos). Sino usamos el default del appId.
 */
export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '294212274372-0o91m9db3733jv5dkhnugfsmi75ho6ui.apps.googleusercontent.com';
