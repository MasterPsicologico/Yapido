'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { handleEmailLinkCompletion } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

function AuthCompletePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [message, setMessage] = useState('Verificando enlace...');

  useEffect(() => {
    const completeSignIn = async () => {
      const email = searchParams.get('email');
      const mode = searchParams.get('mode');

      if (mode === 'signIn' && email) {
        try {
          const result = await handleEmailLinkCompletion();

          if (result.success) {
            setStatus('success');
            setMessage('¡Cuenta verificada! Redirigiendo...');
            setTimeout(() => router.push('/'), 2000);
          } else {
            setStatus('error');
            setMessage(result.error || 'Error verificando el enlace');
          }
        } catch (err) {
          setStatus('error');
          setMessage(err instanceof Error ? err.message : 'Error inesperado');
        }
      } else {
        setStatus('error');
        setMessage('Enlace inválido o incompleto');
      }
    };

    completeSignIn();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'checking' && (
            <>
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-600" />
              <CardTitle>Verificando tu enlace</CardTitle>
            </>
          )}
          {status === 'success' && (
            <>
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-green-600" />
              <CardTitle>¡Cuenta verificada!</CardTitle>
            </>
          )}
          {status === 'error' && (
            <>
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-red-600" />
              <CardTitle>Error al verificar</CardTitle>
            </>
          )}
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>

          {status === 'error' && (
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="w-full"
            >
              Volver a intentarlo
            </Button>
          )}

          {status === 'checking' && (
            <p className="text-xs text-muted-foreground">
              Si tarda mucho, revisa tu bandeja de spam o solicita un nuevo enlace.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthCompletePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>}>
      <AuthCompletePageContent />
    </Suspense>
  );
}