'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/AuthService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Phone, Mail, MapPin, User, CheckCircle, Save, Shield, Save as SaveIcon, Edit, Copy, MapPin as MapPinIcon, Shield as ShieldIcon } from 'lucide-react';

export function ProfileScreen() {
  const { user, isAnonymous, isAuthenticated, updateProfile, saveLocalData, loadLocalData, getLocalData, getRecoveryCode } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Load profile data on mount
  useEffect(() => {
    if (user?.localData?.profile) {
      setName(user.localData.profile.name || '');
      setEmail(user.localData.profile.email || '');
      setPhone(user.localData.profile.phone || '');
      setAddress(user.localData.profile.address || '');
    }
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

  const copyRecoveryCode = () => {
    const code = getRecoveryCode();
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="animate-spin text-blue-600 text-xl">Cargando perfil...</div>
      </div>
    );
  }

  const recoveryCode = getRecoveryCode();

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

        {/* Recovery Code Section */}
        {recoveryCode && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Shield className="w-5 h-5" />
                Mi código de acceso (6 dígitos)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Úsalo para ingresar en cualquier dispositivo</p>
                  <code className="text-3xl font-mono font-bold text-primary tracking-widest select-all">{recoveryCode}</code>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={copyRecoveryCode}
                  className="h-10 whitespace-nowrap"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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