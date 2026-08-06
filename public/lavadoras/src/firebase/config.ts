export const firebaseConfig = {
  "projectId": "lavadoras-yapido",
  "appId": "1:219835294681:web:a91eaaa8eb52b80d486fc8",
  "apiKey": "AIzaSyAp__NEmviMhYxaijdjcSkzKh5BbZG2dJo",
  "authDomain": "lavadoras-yapido.firebaseapp.com",
  "measurementId": "G-QP10BCM5Y8",
  "messagingSenderId": "219835294681"
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
  '219835294681-a8cre4pf6mq4jr1uprm97m2a4pcjbat5.apps.googleusercontent.com';
