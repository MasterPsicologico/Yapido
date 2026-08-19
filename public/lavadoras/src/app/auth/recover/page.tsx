'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Key, CheckCircle, AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';

export default function RecoverAccountPage() {
  const router = useRouter();
  const { recoverAccount, isAnonymous, isAuthenticated } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRecover = async () => {
    if (!code || code.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await recoverAccount(code);
      setSuccess(true);
      setTimeout(() => router.push('/'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código inválido o expirado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <Key className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle>Recuperar Cuenta</CardTitle>
          <p className="text-muted-foreground text-sm">
            Ingresa tu código de recuperación de 6 dígitos para restaurar tu cuenta
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Shield className="w-5 h-5 mx-auto mb-2 text-blue-600" />
            <p className="text-sm text-blue-800 text-center">
              Tu código de 6 dígitos te permite recuperar tu cuenta con todo el historial,
              favoritos, alquileres y configuraciones desde cualquier dispositivo.
            </p>
          </div>

          <div className="space-y-3">
            <Input
              type="text"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="text-center text-3xl tracking-widest font-mono"
              inputMode="numeric"
              autoComplete="one-time-code"
              disabled={loading}
            />

            {error && (
              <Alert variant="destructive" className="text-sm">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              className="w-full"
              onClick={handleRecover}
              disabled={loading || code.length !== 6}
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recuperando cuenta...
                </>
              ) : (
                'Recuperar mi cuenta'
              )}
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>¿No tienes tu código de recuperación?</p>
            <Link href="/auth" className="text-blue-600 hover:underline ml-1">
              Iniciar como invitado
            </Link>
          </div>

          <div className="pt-4 border-t">
            <Link href="/" className="text-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-1 inline" />
              Volver al inicio
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}