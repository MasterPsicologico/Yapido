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

export function useGoogleOneTap({
  auth,
  clientId,
  enabled = true,
  onSuccess,
  onError,
}: UseGoogleOneTapOptions) {
  const initializedRef = useRef(false);
  const callbackRef = useRef<((response: GoogleCredential) => void) | null>(null);

  const handleCredential = useCallback(
    async (response: GoogleCredential) => {
      if (!response.credential) {
        return;
      }
      try {
        await initiateGoogleSignInWithOneTap(auth, response.credential);
        onSuccess?.();
      } catch (error) {
        onError?.(error);
      }
    },
    [auth, onSuccess, onError]
  );

  useEffect(() => {
    if (!enabled || initializedRef.current || !clientId) {
      return;
    }

    let cancelled = false;
    let retries = 0;
    const MAX_RETRIES = 20;

    const tryInitialize = () => {
      if (cancelled) return;
      if (typeof window === 'undefined') return;
      if (!window.google?.accounts?.id) {
        retries += 1;
        if (retries <= MAX_RETRIES) {
          setTimeout(tryInitialize, 250);
        }
        return;
      }

      if (initializedRef.current) return;
      initializedRef.current = true;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredential,
          auto_select: false,
          cancel_on_tap_outside: false,
          context: 'signin',
          itp_support: true,
          use_fedcm_for_prompt: true,
        });

        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
            return;
          }
        });
      } catch (error) {
        console.warn('Google One Tap no pudo inicializarse:', error);
      }
    };

    tryInitialize();

    return () => {
      cancelled = true;
    };
  }, [enabled, clientId, handleCredential]);
}
