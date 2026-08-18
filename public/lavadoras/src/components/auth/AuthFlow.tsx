'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Phone, User, X, CheckCircle, AlertCircle } from 'lucide-react';

export function AuthFlow() {
  const {
    state,
    user,
    error,
    isAnonymous,
    isAuthenticated,
    signInAnonymously,
    sendEmailLink,
    completeEmailLink,
    sendWhatsAppCode,
    verifyWhatsAppCode,
    upgradeWithEmail,
    upgradeWithPhone,
    signOut,
    clearError,
  } = useAuth();

  const [step, setStep] = useState<'welcome' | 'anonymous' | 'upgrade' | 'email-link' | 'whatsapp-code' | 'success'>('welcome');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Check for email link completion on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'signIn' && params.get('email')) {
      handleEmailLinkComplete(params.get('email')!);
    }
  }, []);

  const handleAnonymousLogin = async () => {
    setLoading(true);
    setLocalError(null);
    try {
      await signInAnonymously();
      setStep('anonymous');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Error al entrar como invitado');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!isAnonymous) return;
    setStep('upgrade');
  };

  const handleEmailLink = async () => {
    if (!email || !email.includes('@')) {
      setLocalError('Ingresa un correo válido');
      return;
    }
    setLoading(true);
    setLocalError(null);
    try {
      await sendEmailLink(email);
      setStep('email-link');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Error enviando enlace');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLinkComplete = async (emailParam: string) => {
    setLoading(true);
    setLocalError(null);
    try {
      await completeEmailLink(emailParam, window.location.href);
      setStep('success');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Error completando login');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppSend = async () => {
    if (!phone || phone.length < 10) {
      setLocalError('Ingresa un número válido (ej: +573001234567)');
      return;
    }
    setLoading(true);
    setLocalError(null);
    try {
      await sendWhatsAppCode(phone);
      setStep('whatsapp-code');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Error enviando código');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppVerify = async () => {
    if (!code || code.length !== 6) {
      setLocalError('Ingresa el código de 6 dígitos');
      return;
    }
    setLoading(true);
    setLocalError(null);
    try {
      if (isAnonymous) {
        await upgradeWithPhone(phone, code);
      } else {
        await verifyWhatsAppCode(code);
      }
      setStep('success');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setStep('welcome');
    setEmail('');
    setPhone('');
    setCode('');
  };

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle>Bienvenido a Lavadoras</CardTitle>
              <p className="text-muted-foreground text-sm">
                Accede instantáneamente o crea tu cuenta permanente
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                size="lg"
                onClick={handleAnonymousLogin}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar como Invitado'
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Sin registro, acceso inmediato a todas las funciones
              </p>
            </CardContent>
          </Card>
        );

      case 'anonymous':
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle>¡Ya estás dentro!</CardTitle>
              <p className="text-muted-foreground text-sm">
                Modo invitado activo - Tu actividad se guarda temporalmente
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-muted rounded-lg text-center text-sm">
                <User className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                <p>Usuario temporal: <span className="font-mono">{user?.uid?.slice(0, 8)}...</span></p>
              </div>
              <Button className="w-full" onClick={handleUpgrade}>
                <User className="mr-2 h-4 w-4" />
                Hacer mi cuenta permanente
              </Button>
              <Button variant="outline" className="w-full" onClick={handleSignOut}>
                Salir
              </Button>
            </CardContent>
          </Card>
        );

      case 'upgrade':
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>Haz tu cuenta permanente</CardTitle>
              <p className="text-muted-foreground text-sm">
                Elige cómo quieres acceder siempre
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                onClick={() => setStep('email-link')}
              >
                <Mail className="mr-2 h-4 w-4" />
                Email (enlace mágico)
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setStep('whatsapp-code')}>
                <Phone className="mr-2 h-4 w-4" />
                WhatsApp (SMS)
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setStep('anonymous')}>
                <X className="mr-2 h-4 w-4" />
                Seguir como invitado
              </Button>
            </CardContent>
          </Card>
        );

      case 'email-link':
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <Mail className="mx-auto mb-4 w-12 h-12 text-blue-600" />
              <CardTitle>Enlace mágico enviado</CardTitle>
              <p className="text-muted-foreground text-sm">
                Revisa tu correo <strong>{email}</strong> y haz click en el enlace
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg text-center text-sm text-blue-700">
                <Mail className="w-4 h-4 mx-auto mb-1" />
                <p>El enlace expira en 15 minutos</p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setStep('upgrade')}>
                <X className="mr-2 h-4 w-4" />
                Cambiar método
              </Button>
            </CardContent>
          </Card>
        );

      case 'whatsapp-code':
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <Phone className="mx-auto mb-4 w-12 h-12 text-green-600" />
              <CardTitle>Código enviado por WhatsApp</CardTitle>
              <p className="text-muted-foreground text-sm">
                Ingresa el código de 6 dígitos enviado a <strong>{phone}</strong>
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="text-center text-2xl tracking-widest"
                inputMode="numeric"
                autoComplete="one-time-code"
              />
              <Button className="w-full" onClick={handleWhatsAppVerify} disabled={loading || code.length !== 6}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar código'
                )}
              </Button>
              <Button variant="ghost" className="w-full text-sm" onClick={() => setStep('upgrade')}>
                Reenviar código / Cambiar método
              </Button>
            </CardContent>
          </Card>
        );

      case 'success':
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle>¡Cuenta permanente creada!</CardTitle>
              <p className="text-muted-foreground text-sm">
                Ahora puedes acceder desde cualquier dispositivo
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg text-center text-sm text-green-700">
                <CheckCircle className="w-4 h-4 mx-auto mb-1" />
                <p>Tu cuenta es ahora permanente</p>
              </div>
              <Button className="w-full" onClick={() => setStep('welcome')}>
                Continuar a la app
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      {error && (
        <Alert variant="destructive" className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {localError && (
        <Alert variant="destructive" className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{localError}</AlertDescription>
        </Alert>
      )}
      <div className="w-full">
        {renderStep()}
      </div>
    </div>
  );
}

export default AuthFlow;