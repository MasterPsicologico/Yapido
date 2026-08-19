'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Phone, X, CheckCircle, ArrowRight } from 'lucide-react';

export function GuestBanner() {
  const { isAnonymous, isAuthenticated, sendWhatsAppCode, sendEmailLink, upgradeWithPhone, upgradeWithEmail } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeMethod, setUpgradeMethod] = useState<'email' | 'whatsapp' | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAnonymous) return null;

  const handleEmailUpgrade = async () => {
    if (!email || !email.includes('@')) {
      alert('Ingresa un correo válido');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await sendEmailLink(email);
      alert('Enlace mágico enviado a tu correo. Revisa tu bandeja de entrada.');
      setShowUpgrade(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error enviando enlace');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppUpgrade = async () => {
    if (!phone || phone.length < 10) {
      alert('Ingresa un número válido (ej: +573001234567)');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await sendWhatsAppCode(phone);
      alert('Código enviado por WhatsApp. Ingrésalo abajo.');
      setUpgradeMethod('whatsapp');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error enviando código');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeVerify = async () => {
    if (!code || code.length !== 6) {
      alert('Ingresa el código de 6 dígitos');
      return;
    }
    // Note: This would need the upgradeWithPhone function from useAuth
    // For now, we'll just show a message
    alert('Función de verificación de código en desarrollo');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 md:px-8">
      <div className="max-w-2xl mx-auto animate-slide-up">
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl shadow-2xl p-4 md:p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
                  Modo Invitado
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-1">Estás en modo invitado</h3>
              <p className="text-white/90 text-sm mb-4">
                Tu actividad se guarda temporalmente. Haz tu cuenta permanente para acceder desde cualquier dispositivo y no perder tu historial.
              </p>
              
              { /* Upgrade options */ }
              <div className="space-y-3">
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
              onClick={() => {}}
              className="text-white/70 hover:text-white p-1"
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