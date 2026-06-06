"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Redirección de Seguridad.
 * El formulario ahora vive dentro de la Landing de Bienvenida por mandato superior.
 */
export default function DeliveryRegisterPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/delivery/dashboard');
  }, [router]);

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Sincronizando Portal Unificado...</p>
      </div>
    </div>
  );
}
