
"use client";

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, useUser } from '@/firebase';
import { collection, query, where, doc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Radar, 
  Clock, 
  MapPin, 
  ArrowUpCircle, 
  AlertTriangle, 
  Zap, 
  CheckCircle2, 
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface WasherLiveRadarProps {
  storeId: string;
  storeName: string;
  ownerId: string;
  storeData?: any;
  storeCityId?: string;
}

export function WasherLiveRadar({ storeId, storeName, ownerId, storeData, storeCityId }: WasherLiveRadarProps) {
  const firestore = useFirestore();
  const { user } = useUser();

  // Radar: Busca pedidos pendientes que sean públicos, filtrados por ciudad
  const radarQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Si la tienda tiene ciudad, filtrar por ella; si no, mostrar todas
    if (storeCityId) {
      return query(
        collection(firestore, 'orders'),
        where('isLogisticsPublic', '==', true),
        where('status', '==', 'pending'),
        where('cityId', '==', storeCityId)
      );
    }
    return query(
      collection(firestore, 'orders'),
      where('isLogisticsPublic', '==', true),
      where('status', '==', 'pending')
    );
  }, [firestore, storeCityId]);

  const { data: rawRequests, isLoading } = useCollection(radarQuery);

  // FILTRADO INTELIGENTE (CEREBRO DEL RADAR)
  const filteredRequests = useMemo(() => {
    if (!rawRequests || !storeData) return [];

    return rawRequests.filter(req => {
      const type = req.washerType; // 'automatica' o 'semiautomatica'
      
      // REGLA DE FILTRADO TÉCNICO:
      // Solo mostramos si la tienda tiene el tipo de lavadora que el cliente pide.
      if (type === 'automatica' && storeData.hasAutomatic === false) return false;
      if (type === 'semiautomatica' && storeData.hasSemiautomatic === false) return false;
      
      // TODO: Aquí se podría filtrar por barrios de cobertura si quisiéramos ser más estrictos
      return true;
    });
  }, [rawRequests, storeData]);

  const handleAcceptOrder = (order: any) => {
    if (!firestore || !user) return;
    
    const orderRef = doc(firestore, 'orders', order.id);
    
    // ACEPTACIÓN MAESTRA
    updateDocumentNonBlocking(orderRef, {
      status: 'ready_for_pickup', 
      storeId: storeId,
      storeName: storeName,
      storeOwnerId: ownerId,
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      participants: arrayUnion(ownerId),
      isLogisticsPublic: false 
    });

    toast({ 
      title: "¡Misión Aceptada!", 
      description: "El pedido ha sido despachado a tu flota.",
      className: "bg-green-600 text-white border-none"
    });
  };

  if (isLoading) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radar className="w-5 h-5 text-primary animate-pulse" />
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">
            Radar de Solicitudes ({filteredRequests.length})
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sincronización Técnica Activa</span>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredRequests.length > 0 ? filteredRequests.map((req) => (
          <Card key={req.id} className="border-none rounded-[40px] bg-white shadow-xl overflow-hidden ring-1 ring-black/[0.03] animate-in slide-in-from-right-4 duration-500 group">
            <div className="bg-slate-900 px-8 py-2 flex items-center justify-between">
              <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em]">NUEVA RUTA COMPATIBLE</span>
              <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">#{req.id.slice(-6).toUpperCase()}</span>
            </div>
            
            <CardContent className="p-8 space-y-8">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                    {req.customerName}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-primary" /> {req.customerSector || 'Sector por definir'}
                    {req.cityName && <span className="text-slate-300 ml-1">• {req.cityName}</span>}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Oferta Base</p>
                  <span className="text-2xl font-black text-primary italic">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(req.totalPrice)}
                  </span>
                </div>
              </div>

              {/* DETALLES LOGÍSTICOS CRÍTICOS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-5 rounded-[28px] border border-slate-100">
                <div className="space-y-1">
                  <p className="text-[7px] font-black text-slate-400 uppercase">Tiempo</p>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-xs font-black italic">{req.requestHours}h</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[7px] font-black text-slate-400 uppercase">Equipo</p>
                  <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase h-5">
                    {req.washerType || 'Auto'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[7px] font-black text-slate-400 uppercase">Piso</p>
                  <div className="flex items-center gap-1.5">
                    <ArrowUpCircle className="w-3 h-3 text-primary" />
                    <span className="text-xs font-black italic">{req.floor || '1'}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[7px] font-black text-slate-400 uppercase">Escalas</p>
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className={cn("w-3 h-3", req.hasStairs ? "text-amber-500" : "text-slate-300")} />
                    <span className="text-xs font-black italic">{req.hasStairs ? req.stairCount : '0'}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleAcceptOrder(req)} className="w-full h-16 rounded-[24px] bg-slate-900 text-white font-black uppercase text-xs tracking-widest gap-3 shadow-xl hover:bg-primary transition-all">
                  <CheckCircle2 className="w-4 h-4" /> ACEPTAR ESTE TRATO
                </Button>
              </div>
            </CardContent>
          </Card>
        )) : (
          <div className="text-center py-20 bg-white rounded-[48px] border-2 border-dashed border-slate-100">
            <Radar className="w-12 h-12 mx-auto text-slate-100 mb-4 animate-spin-slow" />
            <p className="text-slate-300 font-black uppercase tracking-widest italic text-xs">Sin solicitudes compatibles para tu inventario</p>
          </div>
        )}
      </div>
    </div>
  );
}
