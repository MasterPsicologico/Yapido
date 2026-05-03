"use client";

import { useState } from 'react';
import { Users, Copy, Check, ChevronRight, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

interface FleetManagementCardProps {
  store: any;
  drivers: any[];
  onOpenPanel: () => void;
}

export function FleetManagementCard({ store, drivers, onOpenPanel }: FleetManagementCardProps) {
  const [copied, setCopied] = useState(false);

  const firestore = useFirestore();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!store?.driverCode) return;
    navigator.clipboard.writeText(store.driverCode);
    setCopied(true);
    toast({ title: "¡Código copiado!", description: "Compártelo con tus repartidores." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateCode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firestore || !store?.id) return;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      await updateDocumentNonBlocking(doc(firestore, 'stores', store.id), { driverCode: code });
      toast({ title: "Código Generado", description: `Nuevo código: ${code}` });
    } catch (err) {
      toast({ title: "Error al generar", variant: "destructive" });
    }
  };

  if (!store) return null;

  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div 
        onClick={onOpenPanel}
        className="rounded-[32px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-2xl shadow-slate-900/30 cursor-pointer active:scale-[0.98] transition-all group relative overflow-hidden border border-white/5"
      >
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-primary/20 transition-colors" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -ml-16 -mb-16" />

        <div className="relative z-10 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest text-white italic leading-none">Mi Flota Privada</h4>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">{drivers.length} repartidor{drivers.length !== 1 ? 'es' : ''} vinculado{drivers.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all text-slate-500">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>

          {/* Driver Code Banner */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex-1 min-w-0">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Código de vinculación</p>
              {store.driverCode ? (
                <p className="text-2xl font-black tracking-[0.4em] text-primary font-mono leading-none">{store.driverCode}</p>
              ) : (
                <p className="text-lg font-black text-slate-500 italic">Sin código aún</p>
              )}
            </div>
            {store.driverCode ? (
              <Button
                size="icon"
                variant="ghost"
                onClick={handleCopy}
                className={cn(
                  "h-10 w-10 rounded-xl shrink-0 transition-all",
                  copied ? "bg-green-500/20 text-green-400" : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                )}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerateCode}
                className="h-10 px-4 rounded-xl bg-primary/20 text-primary border-primary/30 font-black uppercase text-[9px] tracking-widest hover:bg-primary/30"
              >
                <Zap className="w-3 h-3 mr-2" />
                Generar
              </Button>
            )}
          </div>

          {/* Driver Avatars Preview */}
          {drivers.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                {drivers.slice(0, 4).map((driver, i) => (
                  <Avatar key={driver.id || i} className="w-9 h-9 border-2 border-slate-800 shadow-lg ring-1 ring-white/5">
                    <AvatarImage src={driver.photoURL} className="object-cover" />
                    <AvatarFallback className="bg-slate-700 text-white font-black text-[10px]">
                      {driver.displayName?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {drivers.length > 4 && (
                  <div className="w-9 h-9 rounded-full bg-primary/20 border-2 border-slate-800 flex items-center justify-center text-[9px] font-black text-primary">
                    +{drivers.length - 4}
                  </div>
                )}
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                Gestionar equipo →
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
