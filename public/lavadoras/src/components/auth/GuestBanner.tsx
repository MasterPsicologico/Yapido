'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Phone, X, CheckCircle, ArrowRight, Key, Shield, AlertCircle } from 'lucide-react';

export function GuestBanner() {
  const { isAnonymous, isAuthenticated, sendWhatsAppCode, sendEmailLink, upgradeWithPhone, upgradeWithEmail, getRecoveryCode } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeMethod, setUpgradeMethod] = useState<'email' | 'whatsapp' | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showRecoveryCode, setShowRecoveryCode] = useState(false);

  if (!isAnonymous) return null;

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setDismissed(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  if (dismissed && !showUpgrade) return null;

  const recoveryCode = getRecoveryCode();

  const handleEmailUpgrade = async () => {
    if (!email || !email.includes('@')) {
      alert('Ingresa un correo válido');
      return;
    }
    try {
      await sendEmailLink(email);
      alert('Enlace mágico enviado a tu correo. Revisa tu bandeja de entrada.');
      setShowUpgrade(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error enviando enlace');
    }
  };

  const handleWhatsAppUpgrade = async () => {
    if (!phone || phone.length < 10) {
      alert('Ingresa un número válido (ej: +573001234567)');
      return;
    }
    try {
      await sendWhatsAppCode(phone);
      alert('Código enviado por WhatsApp. Ingrésalo abajo.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error enviando código');
    }
  };

  const handleClose = () => {
    setShowUpgrade(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 md:px-8 animate-slide-up">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl shadow-2xl p-4 md:p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
                  <Shield className="w-3 h-3 mr-1" /> Modo Invitado
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-1">Modo Invitado Activo</h3>
              <p className="text-white/90 text-sm mb-3">
                Estás accediendo como invitado. Tus datos se guardan localmente. Crea tu cuenta permanente para sincronizar en la nube y recuperar tu cuenta en cualquier dispositivo.
              </p>
              
              {/* Recovery Code Display */}
              <div className="mb-3 p-3 bg-white/10 rounded-lg border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/80 text-sm flex items-center gap-1">
                    <Key className="w-4 h-4" />
                    Tu código de recuperación (6 dígitos):
                  </span>
                  <button
                    onClick={() => setShowRecoveryCode(!showRecoveryCode)}
                    className="text-white/70 hover:text-white text-xs"
                  >
                    {showRecoveryCode ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <div className="bg-white/5 rounded-lg p-3 font-mono text-2xl tracking-widest text-center select-all text-white">
                  {showRecoveryCode ? getRecoveryCode() : '••••••'}
                </div>
                <p className="text-white/60 text-xs mt-1 text-center">
                  Guarda este código. Con él podrás recuperar tu cuenta en cualquier dispositivo.
                </p>
              </div>

              {/* Upgrade Options */}
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => setShowUpgrade(true)}
                  size="lg"
                >
                  Hacer mi cuenta permanente
                </Button>
                <p className="text-center text-white/70 text-xs">
                  Tus datos se guardarán y podrás acceder desde cualquier dispositivo
                </p>
              </div>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-white/70 hover:text-white p-1 ml-2"
              aria-label="Cerrar banner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}