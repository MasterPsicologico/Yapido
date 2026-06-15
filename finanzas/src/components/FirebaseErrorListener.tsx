'use client';

import { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * FirebaseErrorListener
 *
 * Escucha errores de permisos emitidos por la capa de Firestore.
 * Antes (legacy): throw en render → crash de la app entera.
 * Ahora: muestra un toast en la esquina inferior derecha con un mensaje amigable.
 *
 * Los errores también se logean en consola para debugging.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handleError = (err: FirestorePermissionError) => {
      // Loggear para devs
      console.error('[Firestore Permission Error]', err);
      // Mostrar UI amigable
      setError(err);
    };
    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-4 right-4 z-[200] max-w-sm"
          role="alert"
        >
          <div className="bg-red-50 border-2 border-red-500 rounded-2xl shadow-2xl p-4 flex gap-3 items-start">
            <div className="shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black uppercase tracking-widest text-red-600">
                Permiso Denegado
              </p>
              <p className="text-[10px] text-red-700/80 mt-1 break-words">
                {error.message || 'No tienes permisos para acceder a este recurso.'}
              </p>
            </div>
            <button
              onClick={() => setError(null)}
              className="shrink-0 p-1 rounded-full hover:bg-red-100 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
