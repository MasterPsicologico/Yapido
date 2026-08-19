'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Phone, Mail, MapPin, User, CheckCircle, Save, Shield, Save as SaveIcon, Edit, Copy, Key, Phone as PhoneIcon, Mail as MailIcon, MapPin as MapPinIcon, Shield as ShieldIcon } from 'lucide-react';

export function ProfileScreen() {
  const { user, isAnonymous, isAuthenticated, updateProfile, saveLocalData, loadLocalData, getLocalData, sendWhatsAppCode, sendEmailLink, upgradeWithPhone, upgradeWithEmail, getRecoveryCode } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPhoneVerify, setShowPhoneVerify] = useState(false);
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneVerifying, setPhoneVerifying] = useState(false);
  const [showEmailLink, setShowEmailLink] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');

  // Load profile data on mount
  useEffect(() => {
    if (user?.localData?.profile) {
      setName(user.localData.profile.name || '');
      setEmail(user.localData.profile.email || '');
      setPhone(user.localData.profile.phone || '');
      setAddress(user.localData.profile.address || '');
    }
    
    // Load recovery code
    const code = localStorage.getItem('lavadoras_recovery_code');
    if (code) setRecoveryCode(code);
  }, [user]);

  // Auto-save on field change (debounced)
  const saveProfile = useCallback(async () => {
    if (!user) return;
    
    setSaving(true);
    setError(null);
    try {
      await updateProfile({
        name: name || undefined,
        email: email || undefined,
        phone: phone || undefined,
        address: address || undefined,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando perfil');
    } finally {
      setSaving(false);
    }
  }, [user, name, email, phone, address]);

  // Auto-save on field blur
  const handleBlur = () => {
    if (editing) {
      saveProfile();
    }
  };

  // Phone verification flow
  const handleSendPhoneCode = async () => {
    if (!phone || phone.length < 10) {
      alert('Ingresa un número válido');
      return;
    }
    // This would call phoneAuth.sendCode(phone)
    // For now, we'll simulate
    alert('Código enviado al WhatsApp (simulado). Ingresa el código de 6 dígitos.');
    setShowPhoneVerify(true);
  };

  const handleVerifyPhone = async () => {
    if (!phone || phoneCode.length !== 6) {
      alert('Ingresa el código de 6 dígitos');
      return;
    }
    // This would call phoneAuth.verifyCode(phoneCode)
    alert('Teléfono verificado correctamente');
    setShowPhoneVerify(false);
  };

  const handleEmailLink = async () => {
    if (!email || !email.includes('@')) {
      alert('Ingresa un correo válido');
      return;
    }
    // This would call sendEmailLink(email)
    alert('Enlace mágico enviado a tu correo. Revisa tu bandeja de entrada.');
    setShowEmailLink(false);
  };

  const handleCopyRecoveryCode = () => {
    navigator.clipboard.writeText(recoveryCode);
    alert('Código copiado al portapapeles');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="animate-spin text-blue-600 text-xl">Cargando perfil...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Mi Perfil</h1>
          <p className="text-muted-foreground text-sm">
            Gestiona tu información personal y preferencias
          </p>
        </div>

        {/* Status Banner */}
        <div className={`mb-6 p-4 rounded-xl ${isAnonymous ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
          <div className="flex items-center gap-3">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center ${isAnonymous ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
              {isAnonymous ? (
                <Shield className="w-5 h-5" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
            </span>
            <div>
              <p className="font-medium text-sm">
                {isAnonymous ? 'Modo Invitado' : 'Cuenta Permanente'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isAnonymous 
                  ? 'Vincula tu teléfono para recuperar tu cuenta en cualquier dispositivo' 
                  : 'Tu cuenta está vinculada y sincronizada en la nube'}
              </p>
            </div>
          </div>
        </div>

        {/* Recovery Code */}
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-600" />
                Código de Recuperación (6 dígitos)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 p-4 bg-white rounded-lg border border-amber-200 font-mono text-2xl tracking-widest text-center text-foreground select-all">
                {recoveryCode || 'Generando...'}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCopyRecoveryCode}
                className="whitespace-nowrap"
              >
                Copiar
              </Button>
            </div>
            <p className="text-xs text-amber-700 mt-2 text-center">
              Guarda este código. Con él podrás recuperar tu cuenta en cualquier dispositivo.
            </p>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Nombre completo
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="Tu nombre completo"
                  disabled={!editing}
                  className={editing ? '' : 'bg-muted/50'}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="tu@email.com"
                  disabled={!editing}
                  className={editing ? '' : 'bg-muted/50'}
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-1">
                  Teléfono (WhatsApp)
                </label>
                <div className="flex gap-2">
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={handleBlur}
                    placeholder="+57 300 123 4567"
                    disabled={!editing}
                    className={editing ? 'flex-1' : 'bg-muted/50 flex-1'}
                  />
                  {!phone && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditing(true)}
                      className="whitespace-nowrap"
                    >
                      Agregar
                    </Button>
                  )}
                </div>
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium mb-1">
                  Dirección
                </label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="Tu dirección para entregas"
                  disabled={!editing}
                  className={editing ? '' : 'bg-muted/50'}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-4 border-t">
              {editing ? (
                <>
                  <Button 
                    onClick={saveProfile}
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar cambios
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => setEditing(false)}
                    className="whitespace-nowrap"
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button onClick={() => setEditing(true)} className="flex-1">
                  <Edit className="mr-2 h-4 w-4" />
                  Editar perfil
                </Button>
              )}
            </div>

            {/* Upgrade Section - Only for anonymous users */}
            {isAnonymous && (
              <div className="mt-6 pt-6 border-t space-y-3">
                <div className="text-center text-sm text-muted-foreground">
                  ¿Quieres recuperar tu cuenta en cualquier dispositivo?
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => alert('Función WhatsApp: se enviaría código SMS al teléfono ingresado')}
                >
                  <PhoneIcon className="mr-2 h-4 w-4" />
                  Vincular WhatsApp (SMS)
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => alert('Función Email: se enviaría enlace mágico al correo ingresado')}
                >
                  <MailIcon className="mr-2 h-4 w-4" />
                  Vincular Email (Enlace Mágico)
                </Button>
              </div>
            )}

            {/* Recovery Code */}
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-medium flex items-center gap-2 text-amber-800">
                <Key className="w-4 h-4" />
                Tu código de recuperación
              </h4>
              <p className="text-sm text-amber-700 mt-1">
                Este código de 6 dígitos te permite recuperar tu cuenta en cualquier dispositivo.
                Guárdalo en un lugar seguro.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Saved confirmation */}
        {saved && (
          <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
            <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Perfil guardado correctamente</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}