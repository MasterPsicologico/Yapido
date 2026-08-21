'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Key, Shield, X, CheckCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AccountRecoveryDialog() {
  const { 
    state, 
    recoverAccount, 
    quickRestoreAccount, 
    getRememberedAccount, 
    clearRememberedAccount,
    signInAnonymously 
  } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isQuickRestoring, setIsQuickRestoring] = useState(false);

  const rememberedAccount = getRememberedAccount();
  const showQuickRestore = state === 'account_selection' && rememberedAccount;
  const showPhoneVerification = state === 'phone_verification_needed';

  // Auto-open for quick restore when device is linked
  if (showQuickRestore && !isOpen) {
    setIsOpen(true);
  }

  if (showPhoneVerification && !isQuickRestoring) {
    setIsQuickRestoring(true);
    quickRestoreAccount().finally(() => setIsQuickRestoring(false));
  }

  const handleRecover = async () => {
    if (code.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setIsRecovering(true);
    setError(null);
    try {
      await recoverAccount(code);
      setSuccess(true);
      setCode('');
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código inválido');
    } finally {
      setIsRecovering(false);
    }
  };

  const handleQuickRestore = async () => {
    setIsQuickRestoring(true);
    try {
      await quickRestoreAccount();
    } catch (err) {
      console.error('Quick restore failed:', err);
    } finally {
      setIsQuickRestoring(false);
    }
  };

  const handleNewAccount = async () => {
    clearRememberedAccount();
    await signInAnonymously();
    setIsOpen(false);
  };

  if (!isOpen && !showQuickRestore && !showPhoneVerification) {
    return null;
  }

  // Phone verification needed - show waiting screen
  if (showPhoneVerification && !showQuickRestore) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Restaurando tu cuenta</h3>
                <p className="text-muted-foreground mt-1">
                  Enviamos un código SMS a tu número vinculado.<br />
                  En Android se completará automáticamente.
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                className="w-full"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Account selection (remembered account + device linked)
  if (showQuickRestore) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Bienvenido de vuelta, {rememberedAccount?.displayName?.split(' ')[0] || 'Usuario'}</h3>
                <p className="text-muted-foreground mt-1">
                  Detectamos tu cuenta anterior en este dispositivo
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">Tu número vinculado</p>
                    <p className="text-sm text-muted-foreground">
                      {rememberedAccount?.phoneNumber || 'Teléfono guardado'}
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleQuickRestore}
                disabled={isQuickRestoring}
                className="w-full h-12"
              >
                {isQuickRestoring ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Enviando SMS...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-5 h-5 mr-2" />
                    Continuar con SMS automático
                  </>
                )}
              </Button>

              <Button 
                variant="outline" 
                onClick={handleNewAccount}
                className="w-full"
              >
                Iniciar sesión de otra forma
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Manual recovery code input
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-md animate-in fade-in zoom-in duration-300">
        <CardHeader className="text-center pb-2">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Key className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-xl">Recuperar cuenta</CardTitle>
          <CardDescription className="text-muted-foreground">
            Ingresa tu código de 6 dígitos para restaurar tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <AlertDescription className="text-green-800">
                ¡Cuenta restaurada correctamente! Redirigiendo...
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-center gap-2">
            {[...code].map((char, i) => (
              <input
                key={i}
                type="text"
                maxLength={1}
                value={char}
                onChange={(e) => {
                  const newCode = code.split('');
                  newCode[i] = e.target.value.replace(/\D/g, '');
                  if (i < 5 && newCode[i]) {
                    // Auto-focus next input would require refs
                  }
                  setCode(newCode.join(''));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !char && i > 0) {
                    // Handle backspace
                  }
                }}
                className="w-10 h-14 text-center text-2xl font-mono border-2 rounded-lg focus:border-primary focus:outline-none transition-colors bg-white"
                readOnly={success}
              />
            ))}
            {code.length < 6 && (
              <input
                type="text"
                maxLength={6 - code.length}
                value={code.slice(code.length)}
                onChange={(e) => setCode(code + e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && code.length > 0 && !e.target.value) {
                    setCode(code.slice(0, -1));
                  }
                }}
                className="w-10 h-14 text-center text-2xl font-mono border-2 rounded-lg focus:border-primary focus:outline-none transition-colors bg-white"
                autoFocus
                autoComplete="one-time-code"
                inputMode="numeric"
              />
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="text-sm">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleRecover}
            disabled={isRecovering || code.length !== 6 || success}
            className="w-full h-12"
          >
            {isRecovering ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Restaurando...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 mr-2" />
                Recuperar cuenta
              </>
            )}
          </Button>

          <Button 
            variant="ghost" 
            onClick={() => setIsOpen(false)}
            className="w-full"
            disabled={isRecovering}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}