'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, Phone, ArrowRight, Loader2, LogOut, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AccountSelectionScreen() {
  const { 
    getRememberedAccount, 
    quickRestoreAccount, 
    clearRememberedAccount,
    signInAnonymously 
  } = useAuth();
  
  const rememberedAccount = getRememberedAccount();
  const [isRestoring, setIsRestoring] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  if (!rememberedAccount) {
    return null;
  }

  const displayName = rememberedAccount.displayName || 'Usuario';
  const phoneDisplay = rememberedAccount.phoneNumber 
    ? rememberedAccount.phoneNumber.replace(/(\+\d{2})(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4')
    : 'Teléfono vinculado';

  const handleQuickRestore = async () => {
    setIsRestoring(true);
    try {
      await quickRestoreAccount();
    } catch (error) {
      console.error('Quick restore failed:', error);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleNewAccount = async () => {
    setIsCreatingNew(true);
    try {
      clearRememberedAccount();
      await signInAnonymously();
    } catch (error) {
      console.error('Create new account failed:', error);
    } finally {
      setIsCreatingNew(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#050505]">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-4">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter text-white mb-2">
            Bienvenido de vuelta
          </h1>
          <p className="text-slate-400">
            Detectamos tu cuenta anterior en este dispositivo
          </p>
        </div>

        <Card className="bg-slate-900/50 border-slate-800 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                {rememberedAccount.photoURL ? (
                  <img 
                    src={rememberedAccount.photoURL} 
                    alt={displayName} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-7 h-7 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white truncate">{displayName}</h3>
                <p className="text-sm text-slate-400 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {phoneDisplay}
                </p>
                {rememberedAccount.email && (
                  <p className="text-xs text-slate-500 mt-1 truncate">{rememberedAccount.email}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button
            onClick={handleQuickRestore}
            disabled={isRestoring || isCreatingNew}
            className={cn(
              "w-full h-14 rounded-[16px] font-black text-base gap-3 justify-center",
              isRestoring && "bg-primary/50"
            )}
          >
            {isRestoring ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Restaurando sesión...
              </>
            ) : (
              <>
                <ArrowRight className="w-5 h-5" />
                Continuar como {displayName.split(' ')[0]}
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleNewAccount}
            disabled={isRestoring || isCreatingNew}
            className="w-full h-12 rounded-[16px] font-medium border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white"
          >
            {isCreatingNew ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Creando nueva cuenta...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Iniciar sesión de otra forma
              </>
            )}
          </Button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Al continuar, se enviará un código SMS al número vinculado. 
            En Android se completará automáticamente.
          </p>
        </div>
      </div>
    </div>
  );
}