"use client";

import { useState } from 'react';
import { useUser, useFirestore, useCollection, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, addDoc } from 'firebase/firestore';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Settings2, Loader2, CheckCircle2, Navigation, Clock, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function StoreInventoryPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isAdding, setIsAdding] = useState(false);
  const [newMachine, setNewMachine] = useState({ name: '', serialNumber: '' });

  // Escuchar inventario de la tienda
  const inventoryRef = user && firestore ? collection(firestore, `stores/${user.uid}/inventory`) : null;
  const inventoryQuery = inventoryRef ? query(inventoryRef, orderBy('createdAt', 'desc')) : null;
  const { data: machines, isLoading } = useCollection(inventoryQuery);

  const handleAddMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventoryRef || !newMachine.name || !newMachine.serialNumber) return;

    try {
      await addDoc(inventoryRef, {
        ...newMachine,
        status: 'available', // available, in_transit, in_use, maintenance
      });
      setNewMachine({ name: '', serialNumber: '' });
      setIsAdding(false);
      toast({ title: 'Lavadora Registrada', description: 'Inventario actualizado correctamente.' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo registrar la máquina.', variant: 'destructive' });
    }
  };

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'available': return { label: 'Disponible', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' };
      case 'in_transit': return { label: 'En Tránsito', icon: Navigation, color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'in_use': return { label: 'En Uso', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' };
      case 'maintenance': return { label: 'Mantenimiento', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' };
      default: return { label: 'Desconocido', icon: Settings2, color: 'text-slate-600', bg: 'bg-slate-100' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8fafc]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar />
      
      <main className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900">
              Inventario Físico
            </h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
              Control Estricto de Activos
            </p>
          </div>
          <Button 
            onClick={() => setIsAdding(!isAdding)}
            className="rounded-full bg-[#2E0F59] hover:bg-[#1f0a3d] text-white font-bold tracking-widest gap-2"
          >
            <Plus className="w-4 h-4" />
            NUEVA LAVADORA
          </Button>
        </div>

        {isAdding && (
          <form onSubmit={handleAddMachine} className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Nombre / Modelo</label>
                <Input 
                  placeholder="Ej: Lavadora Samsung 18kg" 
                  value={newMachine.name}
                  onChange={e => setNewMachine({...newMachine, name: e.target.value})}
                  className="rounded-xl h-12"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Número de Serie / ID Interno</label>
                <Input 
                  placeholder="Ej: SN-00123" 
                  value={newMachine.serialNumber}
                  onChange={e => setNewMachine({...newMachine, serialNumber: e.target.value})}
                  className="rounded-xl h-12"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} className="rounded-xl font-bold">Cancelar</Button>
              <Button type="submit" className="rounded-xl bg-primary hover:bg-primary/90 text-white font-bold">Guardar Máquina</Button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {machines?.length === 0 && (
            <div className="col-span-full py-12 text-center space-y-3">
              <Settings2 className="w-12 h-12 mx-auto text-slate-300" />
              <p className="text-slate-500 font-bold">No tienes lavadoras registradas en tu inventario estricto.</p>
            </div>
          )}

          {machines?.map((machine: any) => {
            const display = getStatusDisplay(machine.status);
            const Icon = display.icon;
            
            return (
              <div key={machine.id} className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className={cn("px-3 py-1.5 rounded-full flex items-center gap-1.5", display.bg)}>
                      <Icon className={cn("w-3.5 h-3.5", display.color)} />
                      <span className={cn("text-[10px] font-black uppercase tracking-widest", display.color)}>
                        {display.label}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">{machine.name}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono mt-1">
                      ID: {machine.serialNumber}
                    </p>
                  </div>
                </div>
                
                {machine.status === 'in_use' && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Orden Activa</span>
                    <Button variant="link" className="text-primary h-auto p-0 text-[10px] font-black uppercase">Ver Ruta</Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
