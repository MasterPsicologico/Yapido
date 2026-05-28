'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DiagnosticRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/recorder');
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <div className="text-center">
            <p className="mt-4 text-lg">Redirigiendo a la Grabadora Clínica...</p>
        </div>
    </div>
  );
}
