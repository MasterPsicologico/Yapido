'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

/**
 * AndroidBackButtonHandler
 * ────────────────────────────────────────────────────────────────
 * Intercepta el botón "atrás" del sistema Android dentro de la
 * WebView (Capacitor) y lo traduce a navegación de la app:
 *   • Si hay historial interno → router.back()
 *   • Si no hay historial (raíz) → App.exitApp()
 *
 * En plataformas no nativas (web) el listener no se registra.
 * Esto evita que la app se cierre al pulsar el back físico en
 * rutas internas como /washer/waiting-room/[id], /admin/..., etc.
 */
export function AndroidBackButtonHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listenerHandle: { remove: () => void } | null = null;

    const setup = async () => {
      try {
        const handle = await App.addListener('backButton', ({ canGoBack }) => {
          // 1) Si el navegador/App Router tiene historial, vuelve.
          if (window.history.length > 1) {
            router.back();
            return;
          }

          // 2) Si el WebView indica que puede ir hacia atrás, hazlo.
          if (canGoBack) {
            router.back();
            return;
          }

          // 3) En raíz: salir de la app (gesto explícito del usuario).
          App.exitApp();
        });
        listenerHandle = handle;
      } catch (err) {
        // Si el plugin no está disponible, no hacemos nada.
        console.warn('[AndroidBackButtonHandler] No se pudo registrar:', err);
      }
    };

    setup();

    return () => {
      listenerHandle?.remove();
    };
  }, [router, pathname]);

  return null;
}
