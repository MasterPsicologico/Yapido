'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { Auth } from 'firebase/auth';
import { initiateGoogleSignInWithOneTap } from '@/firebase/non-blocking-login';

interface GoogleCredential {
  credential: string;
  select_by?: string;
}

interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredential) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: 'signin' | 'signup' | 'use';
  itp_support?: boolean;
  use_fedcm_for_prompt?: boolean;
}

interface GoogleAccountsId {
  initialize: (config: GoogleIdConfiguration) => void;
  prompt: (momentListener?: (notification: any) => void) => void;
  cancel: () => void;
  disableAutoSelect: () => void;
  renderButton: (parent: HTMLElement, options: any) => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

interface UseGoogleOneTapOptions {
  auth: Auth;
  clientId: string;
  enabled?: boolean;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

/**
 * Hook que dispara Google One Tap en la web. Si el usuario tiene sesion
 * de Google abierta, aparece un cuadro flotante en la esquina superior
 * derecha para autenticarse con un solo click (experiencia estilo OpenAI).
 *
 * Totalmente defensivo: si Google Identity Services no carga, si el usuario
 * esta en un navegador que no soporta FedCM, o si la libreria GIS falla por
 * cualquier razon, el hook falla silenciosamente. Esto es clave para entornos
 * como WebView Android de TWA donde GIS puede no estar disponible o fallar.
 */
export function useGoogleOneTap({
  auth,
  clientId,
  enabled = true,
  onSuccess,
  onError,
}: UseGoogleOneTapOptions) {
  const initializedRef = useRef(false);
  const handleCredentialRef = useRef<((response: GoogleCredential) => void) | null>(null);

  const handleCredential = useCallback(
    async (response: GoogleCredential) => {
      if (!response || !response.credential) {
        return;
      }
      try {
        await initiateGoogleSignInWithOneTap(auth, response.credential);
        onSuccess?.();
      } catch (error) {
        // Silencioso: One Tap fallar no debe romper la app. El usuario puede
        // seguir usando el boton INGRESAR como fallback.
        if (typeof window !== 'undefined') {
          // eslint-disable-next-line no-console
          console.warn('Google One Tap callback failed:', error);
        }
        onError?.(error);
      }
    },
    [auth, onSuccess, onError]
  );

  useEffect(() => {
    handleCredentialRef.current = handleCredential;
  }, [handleCredential]);

  useEffect(() => {
    if (!enabled || initializedRef.current || !clientId) {
      return;
    }

    // No intentar One Tap en WebView que sabemos no soporta bien GIS.
    const isAndroidWebView =
      typeof navigator !== 'undefined' &&
      /Android/.test(navigator.userAgent) &&
      /Version\/\d+\.\d+/.test(navigator.userAgent) === false &&
      (typeof (window as any).AndroidAuthBridge !== 'undefined' ||
        /; wv\)/.test(navigator.userAgent));

    if (isAndroidWebView) {
      return;
    }

    let cancelled = false;
    let retries = 0;
    const MAX_RETRIES = 20;

    const tryInitialize = () => {
      if (cancelled) return;
      if (typeof window === 'undefined') return;
      const id = window.google?.accounts?.id;
      if (!id) {
        retries += 1;
        if (retries <= MAX_RETRIES) {
          setTimeout(tryInitialize, 250);
        }
        return;
      }

      if (initializedRef.current) return;
      initializedRef.current = true;

      try {
        id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (handleCredentialRef.current) {
              void handleCredentialRef.current(response);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: false,
          context: 'signin',
          itp_support: true,
          use_fedcm_for_prompt: true,
        });

        id.prompt((notification: any) => {
          // Cuando GIS no se muestra o se skipea (por ITP, cancelacion, etc),
          // el listener recibe una notificacion. Aqui silenciamos cualquier
          // cosa que no sea un display exitoso.
          try {
            if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
              return;
            }
          } catch {
            // Ignorar cualquier excepcion del listener de Google
          }
        });
      } catch (error) {
        initializedRef.current = false;
        if (typeof window !== 'undefined') {
          // eslint-disable-next-line no-console
          console.warn('Google One Tap no pudo inicializarse:', error);
        }
      }
    };

    tryInitialize();

    return () => {
      cancelled = true;
      try {
        if (typeof window !== 'undefined' && window.google?.accounts?.id && initializedRef.current) {
          window.google.accounts.id.cancel();
        }
      } catch {
        // Silencioso
      }
    };
  }, [enabled, clientId]);
}
