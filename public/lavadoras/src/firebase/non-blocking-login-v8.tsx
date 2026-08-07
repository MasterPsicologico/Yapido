'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
} from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

function handleAuthError(error: any) {
  if (
    error.code === 'auth/popup-closed-by-user' ||
    error.code === 'auth/cancelled-by-user' ||
    error.code === 'auth/cancelled-popup-request'
  ) {
    return;
  }
  if (error.code === 'auth/unauthorized-domain') {
    const domain = window.location.hostname;
    toast({
      title: 'DOMINIO NO AUTORIZADO',
      description: `Copia esto en tu Firebase: ${domain}`,
      variant: 'destructive',
      duration: 15000,
    });
    console.error('Firebase requiere que autorices este dominio:', domain);
    return;
  }
  if (error.code === 'auth/popup-blocked') {
    toast({
      title: 'Popup Bloqueado',
      description: 'Tu navegador bloqueo la ventana. Intenta de nuevo.',
    });
    return;
  }
  console.warn('Error de autenticacion:', error.code, error.message);
  toast({
    title: 'Error de Acceso',
    description: error.message,
    variant: 'destructive',
  });
}

export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance).catch(handleAuthError);
}

export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  createUserWithEmailAndPassword(authInstance, email, password).catch(handleAuthError);
}

export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password).catch(handleAuthError);
}

export async function initiateGoogleSignIn(authInstance: Auth): Promise<import('firebase/auth').UserCredential> {
  // 1. APK de lavadoras (TWA con bridge Java inyectado por MainActivity)
  if (typeof window !== 'undefined' && (window as any).AndroidAuthBridge?.requestNativeGoogleAuth) {
    return initiateGoogleSignInViaAndroidBridge(authInstance);
  }

  // 2. Navegador web (PC/Movil)
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(authInstance, provider).catch((error) => {
    handleAuthError(error);
    throw error;
  });
}

async function initiateGoogleSignInViaAndroidBridge(authInstance: Auth): Promise<import('firebase/auth').UserCredential> {
  return new Promise((resolve, reject) => {
    const bridge = (window as any).AndroidAuthBridge;
    if (!bridge?.requestNativeGoogleAuth) {
      reject(new Error('AndroidAuthBridge no disponible'));
      return;
    }
    if (typeof window !== 'undefined' && typeof console !== 'undefined') {
      console.info('[auth] AndroidAuthBridge detectada, disparando selector nativo');
    }
    let settled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const consumePendingToken = (source: string) => {
      try {
        let pendingIdToken: string | null = null;
        if ((window as any).__pendingIdToken) {
          pendingIdToken = (window as any).__pendingIdToken as string;
          (window as any).__pendingIdToken = null;
        } else {
          try {
            pendingIdToken = localStorage.getItem('__twa_pending_id_token');
            if (pendingIdToken) localStorage.removeItem('__twa_pending_id_token');
          } catch (_) {}
        }
        if (!pendingIdToken) return false;
        console.log('[auth] Token pendiente consumido desde', source);
        const credential = GoogleAuthProvider.credential(pendingIdToken);
        signInWithCredential(authInstance, credential)
          .then((uc) => { settled = true; cleanup(); resolve(uc); })
          .catch((err) => { settled = true; cleanup(); handleAuthError(err); reject(err); });
        return true;
      } catch (_) {
        return false;
      }
    };

    if (consumePendingToken('fallback-inmediato')) return;

    const cleanup = () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('android-native-auth-result', handler as EventListener);
        window.removeEventListener('yapido-pending-auth', pendingHandler as EventListener);
        if (timeoutId) clearTimeout(timeoutId);
      }
    };
    
    // Handler principal: evento android-native-auth-result
    const handler = (event: Event) => {
      if (settled) return;
      const detail = (event as CustomEvent).detail || {};
      console.log('[auth] android-native-auth-result recibido:', detail);
      if (!detail.success) {
        settled = true;
        cleanup();
        reject(new Error(detail.error || 'android_auth_failed'));
        return;
      }
      const idToken: string | undefined = detail.id_token;
      if (!idToken) {
        settled = true;
        cleanup();
        reject(new Error('android_auth_no_id_token'));
        return;
      }
      const credential = GoogleAuthProvider.credential(idToken);
      console.log('[auth] Llamando signInWithCredential con id_token');
      signInWithCredential(authInstance, credential)
        .then((userCredential) => {
          console.log('[auth] signInWithCredential ÉXITO:', userCredential.user?.uid);
          settled = true;
          cleanup();
          // Forzar reload para que React tome el user state nuevo y el redirect condicional funcione
          try {
            localStorage.setItem('__twa_post_login_reload', '1');
          } catch (_) {}
          setTimeout(() => {
            try { window.location.reload(); } catch (_) {}
          }, 250);
          resolve(userCredential);
        })
        .catch((err) => {
          console.error('[auth] signInWithCredential FALLÓ:', err?.code, err?.message);
          settled = true;
          cleanup();
          handleAuthError(err);
          reject(err);
        });
    };
    
    // FALLBACK 2: Listener para yapido-pending-auth (evento defensivo inyectado por MainActivity)
    const pendingHandler = (event: Event) => {
      if (settled) return;
      const detail = (event as CustomEvent).detail || {};
      const idToken = detail.id_token;
      console.log('[auth] yapido-pending-auth recibido:', !!idToken);
      if (!idToken) return;
      settled = true;
      cleanup();
      const credential = GoogleAuthProvider.credential(idToken);
      signInWithCredential(authInstance, credential)
        .then((uc) => {
          try { localStorage.setItem('__twa_post_login_reload', '1'); } catch (_) {}
          setTimeout(() => {
            try { window.location.reload(); } catch (_) {}
          }, 250);
          resolve(uc);
        })
        .catch(reject);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('android-native-auth-result', handler as EventListener);
      window.addEventListener('yapido-pending-auth', pendingHandler as EventListener);
      console.log('[auth] Listeners registrados: android-native-auth-result, yapido-pending-auth');
    }
    
    // FALLBACK 3: Polling cada 500ms por window.__pendingIdToken O localStorage (último recurso)
    let pollCount = 0;
    const maxPolls = 60; // 30 segundos
    const pollInterval = setInterval(() => {
      if (settled) {
        clearInterval(pollInterval);
        return;
      }
      pollCount++;
      if (typeof window !== 'undefined') {
        if ((window as any).__pendingIdToken) {
          console.log('[auth] Polling detectó __pendingIdToken');
          clearInterval(pollInterval);
          consumePendingToken('polling');
          return;
        }
        try {
          const fromLs = localStorage.getItem('__twa_pending_id_token');
          if (fromLs) {
            console.log('[auth] Polling detectó token en localStorage');
            clearInterval(pollInterval);
            (window as any).__pendingIdToken = fromLs;
            localStorage.removeItem('__twa_pending_id_token');
            consumePendingToken('polling-localstorage');
            return;
          }
        } catch (_) {}
      }
      if (pollCount >= maxPolls) {
        console.warn('[auth] Polling timeout sin token');
        clearInterval(pollInterval);
      }
    }, 500);
    
    timeoutId = setTimeout(() => {
      if (!settled) {
        console.warn('[auth] Timeout general esperando autenticación nativa');
        clearInterval(pollInterval);
        settled = true;
        cleanup();
        reject(new Error('android_auth_timeout'));
      }
    }, 5 * 60 * 1000);
    
    try {
      console.log('[auth] Llamando bridge.requestNativeGoogleAuth()');
      bridge.requestNativeGoogleAuth();
    } catch (e) {
      console.error('[auth] Error llamando requestNativeGoogleAuth:', e);
      clearInterval(pollInterval);
      cleanup();
      reject(e as Error);
    }
  });
}

export async function initiateGoogleSignInWithOneTap(
  authInstance: Auth,
  idToken: string
): Promise<import('firebase/auth').UserCredential> {
  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(authInstance, credential).catch((error) => {
    handleAuthError(error);
    throw error;
  });
}

export const __ANDROID_BRIDGE_BUILD_MARKER__ = (() => {
  const buildId = 'twa-real-v13-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
  if (typeof window !== 'undefined') {
    (window as any).__diagnostics__ = (window as any).__diagnostics__ || {};
    (window as any).__diagnostics__.androidBridge = true;
    (window as any).__diagnostics__.buildId = buildId;
    (window as any).__diagnostics__.timestamp = new Date().toISOString();
  }
  return buildId;
})();