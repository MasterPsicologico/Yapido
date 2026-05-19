
"use client";

import { useState } from 'react';
import { Truck, MapPin, PackageCheck, AlertTriangle, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

interface MissionActionOrchestratorProps {
  status: string;
  isAtDestination: boolean;
  isInUse?: boolean;
  isExpired?: boolean;
  washerId?: string;
  missionId?: string;
  storeId?: string;
  onUpdateStatus: (status: string, metadata?: any) => void;
  onStartCamera: () => void;
  evidencePhoto: string | null;
}

/**
 * Orquestador DUAL de Acciones.
 * 
 * ═══════════════════════════════════════════════════
 * FASE 1 — ENTREGA (Llevar la lavadora al cliente)
 * ═══════════════════════════════════════════════════
 *   ready_for_pickup → [IR A LLEVAR LA LAVADORA] (confirmación + ID lavadora) → shipped
 *   shipped          → [LLEGUÉ AL DESTINO]                                    → at_destination
 *   at_destination   → [INSTALÉ LA LAVADORA] (confirmación)                   → delivered
 *   delivered        → (countdown, sin botones)
 * 
 * ═══════════════════════════════════════════════════
 * FASE 2 — RECOGIDA (Ir a buscar la lavadora)
 * ═══════════════════════════════════════════════════
 *   picking_up       → [LLEGUÉ A BUSCAR LA LAVADORA]                          → at_pickup
 *   at_pickup        → [RECOGÍ LA LAVADORA] + [NO HA PAGADO]                  → completed
 */
export function MissionActionOrchestrator({
  status,
  isAtDestination,
  isInUse,
  isExpired,
  washerId,
  missionId,
  storeId,
  onUpdateStatus,
  onStartCamera = () => {},
  evidencePhoto = null,
}: MissionActionOrchestratorProps) {
  
  const [showGoDialog, setShowGoDialog] = useState(false);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [showDebtDialog, setShowDebtDialog] = useState(false);
  const [inputWasherId, setInputWasherId] = useState(washerId || '');

  const firestore = useFirestore();
  const availableMachinesQuery = useMemoFirebase(() => {
    if (!storeId || !firestore) return null;
    return query(collection(firestore, `stores/${storeId}/inventory`), where('status', '==', 'available'));
  }, [firestore, storeId]);
  
  const { data: availableMachines } = useCollection(availableMachinesQuery);

  // ═══ DELIVERY PHASE ═══
  const isAccepted = status === 'ready_for_pickup';
  const isEnRoute = status === 'shipped' || status === 'at_store' || status === 'delivered_to_driver';
  const isAtDest = status === 'at_destination';
  const isDelivered = status === 'delivered';

  // ═══ PICKUP PHASE ═══
  const isPickingUp = status === 'picking_up';
  const isAtPickup = status === 'at_pickup';

  const handleConfirmGo = () => {
    if (availableMachines && availableMachines.length > 0 && !inputWasherId) {
      toast({ title: 'Atención', description: 'Debes seleccionar una lavadora del inventario.', variant: 'destructive' });
      return;
    }
    
    setShowGoDialog(false);
    const meta: any = {};
    if (inputWasherId.trim()) {
      meta.washerId = inputWasherId.trim();
    }
    onUpdateStatus('shipped', meta);
  };

  const handleConfirmInstall = () => {
    setShowInstallDialog(false);
    onUpdateStatus('delivered');
  };

  const handleConfirmPickup = () => {
    onUpdateStatus('completed', { isPickupDone: true });
  };

  const handleConfirmDebt = () => {
    onUpdateStatus('debt_pending');
    setShowDebtDialog(false);
  };

  return (
    <section className="space-y-4">

      {/* ═══════════════════════════════════════════════════════
          FASE ENTREGA — Paso 1: IR A LLEVAR LA LAVADORA
          (Visible cuando el repartidor acaba de aceptar)
      ═══════════════════════════════════════════════════════ */}
      {isAccepted && (
        <Button 
          onClick={() => setShowGoDialog(true)} 
          className="w-full h-16 rounded-[28px] bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase italic gap-3 shadow-[0_20px_50px_rgba(37,99,235,0.4)] active:scale-95 transition-all border-b-[6px] border-blue-800 active:border-b-0"
        >
          <Truck className="w-5 h-5 shrink-0" /> IR A LLEVAR LA LAVADORA
        </Button>
      )}

      {/* ═══════════════════════════════════════════════════════
          FASE ENTREGA — Paso 2: LLEGUÉ AL DESTINO
          (Visible cuando el repartidor va en camino)
      ═══════════════════════════════════════════════════════ */}
      {isEnRoute && (
        <Button 
          onClick={() => onUpdateStatus('at_destination')} 
          className="w-full h-16 rounded-[28px] bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase italic gap-3 shadow-[0_20px_50px_rgba(37,99,235,0.4)] active:scale-95 transition-all border-b-[6px] border-blue-800 active:border-b-0"
        >
          <MapPin className="w-5 h-5 shrink-0" /> LLEGUÉ AL DESTINO
        </Button>
      )}

      {/* ═══════════════════════════════════════════════════════
          FASE ENTREGA — Paso 3: INSTALÉ LA LAVADORA
          (Visible cuando ya llegó al destino)
      ═══════════════════════════════════════════════════════ */}
      {isAtDest && (
        <Button 
          onClick={() => setShowInstallDialog(true)} 
          className="w-full h-16 rounded-[28px] bg-green-600 hover:bg-green-500 text-white font-black text-sm uppercase italic gap-3 shadow-[0_20px_50px_rgba(34,197,94,0.4)] active:scale-95 transition-all border-b-[6px] border-green-800 active:border-b-0"
        >
          <PackageCheck className="w-5 h-5 shrink-0" /> INSTALÉ LA LAVADORA
        </Button>
      )}

      {/* ═══════════════════════════════════════════════════════
          TRANSICIÓN A RECOGIDA
      ═══════════════════════════════════════════════════════ */}
      {isDelivered && (
        <Button 
          onClick={() => onUpdateStatus('picking_up')} 
          className="w-full h-16 rounded-[28px] bg-[#2E0F59] hover:bg-[#1f0a3d] text-white font-black text-sm uppercase italic gap-3 shadow-[0_20px_50px_rgba(46,15,89,0.4)] active:scale-95 transition-all border-b-[6px] border-purple-900 active:border-b-0 mt-8"
        >
          <Truck className="w-5 h-5 shrink-0" /> INICIAR RECOGIDA DE LAVADORA
        </Button>
      )}

      {/* ═══════════════════════════════════════════════════════
          FASE RECOGIDA — Paso 1: LLEGUÉ A BUSCAR LA LAVADORA
          (Visible cuando va en camino a recoger)
      ═══════════════════════════════════════════════════════ */}
      {isPickingUp && (
        <Button 
          onClick={() => onUpdateStatus('at_pickup')} 
          className="w-full h-16 rounded-[28px] bg-orange-500 hover:bg-orange-600 text-white font-black text-sm uppercase italic gap-3 shadow-[0_20px_50px_rgba(249,115,22,0.4)] active:scale-95 transition-all border-b-[6px] border-orange-700 active:border-b-0"
        >
          <Navigation className="w-5 h-5 shrink-0" /> LLEGUÉ A BUSCAR LA LAVADORA
        </Button>
      )}

      {/* ═══════════════════════════════════════════════════════
          FASE RECOGIDA — Paso 2: RECOGÍ LA LAVADORA + NO HA PAGADO
          (Visible cuando ya está en el punto de recogida)
      ═══════════════════════════════════════════════════════ */}
      {isAtPickup && (
        <div className="space-y-3">
          {!evidencePhoto ? (
            <Button 
              onClick={onStartCamera} 
              className="w-full h-16 rounded-[28px] bg-slate-900 text-white font-black text-sm uppercase italic gap-3 shadow-[0_15px_40px_rgba(0,0,0,0.4)] active:scale-95 transition-all border-b-[6px] border-black active:border-b-0"
            >
              <PackageCheck className="w-5 h-5 shrink-0" /> TOMAR FOTO DE ESTADO
            </Button>
          ) : (
            <Button 
              onClick={handleConfirmPickup} 
              className="w-full h-16 rounded-[28px] bg-green-600 text-white font-black text-sm uppercase italic gap-3 shadow-[0_15px_40px_rgba(34,197,94,0.4)] active:scale-95 transition-all border-b-[6px] border-green-800 active:border-b-0"
            >
              <PackageCheck className="w-5 h-5 animate-bounce shrink-0" /> RECOGÍ LA LAVADORA
            </Button>
          )}
          
          <Button 
            onClick={() => setShowDebtDialog(true)} 
            className="w-full h-12 rounded-[20px] bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase italic gap-2 shadow-lg active:scale-95 transition-all border-b-[4px] border-amber-700 active:border-b-0"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" /> NO HA PAGADO
          </Button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          DIÁLOGO: ¿Vas a llevar la lavadora? + ID lavadora
      ═══════════════════════════════════════════════════════ */}
      <Dialog open={showGoDialog} onOpenChange={setShowGoDialog}>
        <DialogContent className="w-[calc(100vw-32px)] max-w-[380px] rounded-[32px] border-none shadow-2xl p-6 bg-white z-[600] [&>button:last-child]:hidden">
          <DialogHeader className="text-center space-y-3">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
              <Truck className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-xl font-black italic uppercase tracking-tighter">
              ¿Vas a llevar la lavadora?
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              El cliente será notificado que vas en camino
            </DialogDescription>
          </DialogHeader>

          {/* ID de lavadora — compacto, una sola vez */}
          {!washerId && (
            <div className="py-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider text-center mb-2">
                Asignar Lavadora Físicamente
              </p>
              
              {availableMachines && availableMachines.length > 0 ? (
                <select
                  value={inputWasherId}
                  onChange={(e) => setInputWasherId(e.target.value)}
                  className="w-full h-12 px-4 rounded-2xl border-2 border-slate-200 text-sm font-bold focus:border-primary focus:outline-none transition-colors bg-white appearance-none text-slate-700"
                >
                  <option value="" disabled>Selecciona del Inventario</option>
                  {availableMachines.map((machine: any) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.name} (SN: {machine.serialNumber})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={inputWasherId}
                  onChange={(e) => setInputWasherId(e.target.value)}
                  placeholder="ID / # de Serie"
                  className="w-full h-12 px-4 rounded-2xl border-2 border-slate-200 text-center text-xl font-black focus:border-primary focus:outline-none transition-colors"
                />
              )}
            </div>
          )}

          <DialogFooter className="flex flex-col gap-3 pt-2">
            <Button 
              onClick={handleConfirmGo}
              className="w-full h-14 rounded-[20px] bg-primary text-white font-black uppercase italic text-sm tracking-wider gap-2 shadow-lg"
            >
              <Truck className="w-5 h-5" /> SÍ, VOY EN CAMINO
            </Button>
            <Button 
              variant="ghost"
              onClick={() => setShowGoDialog(false)}
              className="text-slate-400 font-bold text-xs uppercase"
            >
              CANCELAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════
          DIÁLOGO: Confirmación de INSTALACIÓN
      ═══════════════════════════════════════════════════════ */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="w-[calc(100vw-32px)] max-w-[380px] rounded-[32px] border-none shadow-2xl p-6 bg-white z-[600] [&>button:last-child]:hidden">
          <DialogHeader className="text-center space-y-3">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <PackageCheck className="w-8 h-8 text-green-500" />
            </div>
            <DialogTitle className="text-xl font-black italic uppercase tracking-tighter">
              ¿Instalaste la lavadora?
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              El contador de uso comenzará ahora
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-3 pt-4">
            <Button 
              onClick={handleConfirmInstall}
              className="w-full h-14 rounded-[20px] bg-green-500 text-white font-black uppercase italic text-sm"
            >
              SÍ, INSTALADA
            </Button>
            <Button 
              variant="ghost"
              onClick={() => setShowInstallDialog(false)}
              className="text-slate-400 font-bold text-xs uppercase"
            >
              NO, CANCELAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════
          DIÁLOGO: Confirmar Deuda
      ═══════════════════════════════════════════════════════ */}
      <Dialog open={showDebtDialog} onOpenChange={setShowDebtDialog}>
        <DialogContent className="w-[calc(100vw-32px)] max-w-[380px] rounded-[32px] border-none shadow-2xl p-6 bg-white z-[600] [&>button:last-child]:hidden">
          <DialogHeader className="text-center space-y-3">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <DialogTitle className="text-xl font-black italic uppercase tracking-tighter text-amber-600">
              ¿No ha pagado?
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Se registrará la deuda en el historial
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-3 pt-4">
            <Button 
              onClick={handleConfirmDebt}
              className="w-full h-14 rounded-[20px] bg-amber-500 text-white font-black uppercase italic text-sm"
            >
              CONFIRMAR DEUDA
            </Button>
            <Button 
              variant="ghost"
              onClick={() => setShowDebtDialog(false)}
              className="text-slate-400 font-bold text-xs uppercase"
            >
              VOLVER
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
