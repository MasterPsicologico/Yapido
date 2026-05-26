
"use client"

import { useEffect } from 'react';

/**
 * Componente de seguridad para evitar el "congelamiento" de la aplicación.
 * Radix UI a veces no limpia los estilos del body al cerrar modales rápidamente.
 */
export function ModalFixer() {
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
          const body = document.body;
          const hasModals = !!document.querySelector('[role="dialog"]');
          
          if (!hasModals) {
            // Si no hay diálogos abiertos pero el body está bloqueado, forzar liberación
            if (body.style.pointerEvents === 'none' || body.style.overflow === 'hidden' || body.hasAttribute('data-aria-hidden')) {
              body.style.pointerEvents = 'auto';
              body.style.overflow = 'auto';
              body.removeAttribute('data-aria-hidden');
              body.removeAttribute('aria-hidden');
            }
          }
        }
      });
    });

    observer.observe(document.body, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
