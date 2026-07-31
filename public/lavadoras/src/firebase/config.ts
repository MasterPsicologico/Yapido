export const firebaseConfig = {
  "projectId": "studio-4796645076-6f375",
  "appId": "1:294212274372:web:57e201d54dc62a72152191",
  "apiKey": "AIzaSyB3UPA2BTY-BT6YripgFmf5VX_BT9XIwGo",
  "authDomain": "studio-4796645076-6f375.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "294212274372"
};

/**
 * Google OAuth Web Client ID usado por Google One Tap (Identity Services).
 * Debe coincidir con el Web Client ID registrado en Google Cloud Console
 * para el proyecto studio-4796645076-6f375 y aceptado por Firebase Console
 * (Authentication → Sign-in method → Google → Web SDK configuration).
 *
 * Si NEXT_PUBLIC_GOOGLE_CLIENT_ID esta definido en el entorno, tiene prioridad
 * (utile en previews/deploys alternativos). Sino usamos el default del appId.
 */
export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '294212274372-0o91m9db3733jv5dkhnugfsmi75ho6ui.apps.googleusercontent.com';
