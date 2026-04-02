
"use client";

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { WasherDriverItem } from './WasherDriverItem';

interface WasherDriversProps {
  store: any;
}

export function WasherDrivers({ store }: WasherDriversProps) {
  const copyDriverCode = () => {
    if (store?.driverCode) {
      navigator.clipboard.writeText(store.driverCode);
      toast({ 
        title: "Código Copiado", 
        description: "Envíalo a tus repartidores personales.",
        className: "bg-primary text-white border-none"
      });
    }
  };

  const handleDesvincular = (id: string) => {
    // Aquí iría la lógica de arrayRemove en Firestore
    toast({ title: "Solicitud enviada", description: "Procesando desvinculación..." });
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <Card className="border-none rounded-[40px] bg-slate-900 text-white p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="space-y-2">
            <h3 className="text-3xl font-black italic uppercase tracking-tighter">Código de Flota</h3>
            <p className="text-slate-400 font-medium text-sm">Vincula repartidores usando este código único.</p>
          </div>
          <div className="flex items-center gap-4 bg-white/5 p-6 rounded-[32px] border border-white/10">
            <span className="text-4xl font-black tracking-[0.3em] text-primary">{store?.driverCode || '---'}</span>
            <Button onClick={copyDriverCode} variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full h-12 w-12"><Copy className="w-6 h-6" /></Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4">
        <div className="flex items-center justify-between px-4">
          <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 italic">Equipo Personal ({store?.privateDrivers?.length || 0})</h4>
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Sincronización en vivo</span>
        </div>

        {store?.privateDrivers && store.privateDrivers.length > 0 ? (
          <div className="space-y-3">
            {store.privateDrivers.map((driverId: string) => (
              <WasherDriverItem 
                key={driverId}
                driverId={driverId}
                storeId={store.id}
                storeName={store.name}
                ownerId={store.ownerId}
                onUnlink={handleDesvincular}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-[48px] border-2 border-dashed border-slate-100">
            <Users className="w-16 h-16 mx-auto text-slate-100 mb-4" />
            <p className="text-slate-300 font-black uppercase tracking-widest italic">Sin personal vinculado</p>
          </div>
        )}
      </div>
    </div>
  );
}
