"use client";

import { useState } from 'react';
import { 
  X, Shield, Copy, Check, MessageCircle, Phone, 
  Users, UserCircle, ChevronRight, Loader2, Bell,
  Clock, ExternalLink, Trash2, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { DriverMetricsSheet } from './DriverMetricsSheet';
import { EvolutionaryReport } from './EvolutionaryReport';
import { ReportTimeConfig } from './ReportTimeConfig';
import { useReportScheduler } from '@/hooks/useReportScheduler';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

interface FleetPanelProps {
  isOpen: boolean;
  onClose: () => void;
  store: any;
  drivers: any[];
  orders: any[];
  onRemoveDriver?: (uid: string) => void;
}

export function FleetPanel({ isOpen, onClose, store, drivers, orders, onRemoveDriver }: FleetPanelProps) {
  const [copied, setCopied] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [showReport, setShowReport] = useState(false);
  const [showTimeConfig, setShowTimeConfig] = useState(false);
  const firestore = useFirestore();

  const { isReportAvailable, dismissReport } = useReportScheduler(store?.reportTime || '19:00');

  const handleCopy = () => {
    if (!store?.driverCode) return;
    navigator.clipboard.writeText(store.driverCode);
    setCopied(true);
    toast({ title: "¡Código copiado!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateCode = async () => {
    if (!firestore || !store?.id) return;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      await updateDocumentNonBlocking(doc(firestore, 'stores', store.id), { driverCode: code });
      toast({ title: "Código Generado", description: `Nuevo código: ${code}` });
    } catch (err) {
      toast({ title: "Error al generar", variant: "destructive" });
    }
  };

  const handleWhatsApp = (phone: string) => {
    if (!phone) {
      toast({ title: "Sin WhatsApp", description: "Este repartidor no registró su teléfono.", variant: "destructive" });
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const handleChat = (driver: any) => {
    toast({ title: "Chat interno", description: `Abriendo chat con ${driver.displayName}...` });
    // Future: Open internal chat channel
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-[#f8fafc] flex flex-col"
      >
        {/* Header */}
        <div className="shrink-0 bg-slate-900 px-6 py-5 flex items-center justify-between safe-area-top">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tighter italic text-white leading-none">Gestión de Flota</h2>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">{store?.name}</p>
            </div>
          </div>
          <Badge className="bg-primary/20 text-primary border-none rounded-full px-4 h-7 text-[9px] font-black uppercase">
            {drivers.length} activos
          </Badge>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-safe">
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

            {/* Section 1: Driver Code */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-primary" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Código de vinculación</p>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 bg-slate-50 rounded-2xl p-5 text-center">
                  {store?.driverCode ? (
                    <p className="text-3xl font-black tracking-[0.5em] text-slate-900 font-mono leading-none">{store.driverCode}</p>
                  ) : (
                    <p className="text-xl font-black text-slate-400 italic">Sin código</p>
                  )}
                </div>
                {store?.driverCode ? (
                  <Button 
                    onClick={handleCopy}
                    className={cn(
                      "h-14 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-2 transition-all shadow-lg",
                      copied ? "bg-green-500 hover:bg-green-600" : "bg-slate-900 hover:bg-slate-800"
                    )}
                  >
                    {copied ? <><Check className="w-4 h-4" /> Copiado</> : <><Copy className="w-4 h-4" /> Copiar</>}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleGenerateCode}
                    className="h-14 px-6 rounded-2xl bg-primary hover:bg-primary/90 font-black uppercase text-[10px] tracking-widest gap-2 transition-all shadow-lg"
                  >
                    <Zap className="w-4 h-4" /> Generar
                  </Button>
                )}
              </div>
              <p className="text-[9px] font-bold text-slate-400 text-center mt-3 uppercase tracking-widest">
                Comparte este código para vincular repartidores a tu flota
              </p>
            </div>

            {/* Section 2: Driver List (WhatsApp-style) */}
            <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-100">
              <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Repartidores vinculados</p>
                </div>
                <span className="text-[10px] font-black text-slate-300">{drivers.length}</span>
              </div>

              {drivers.length === 0 ? (
                <div className="p-10 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-[24px] flex items-center justify-center mx-auto">
                    <UserCircle className="w-8 h-8 text-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-400 uppercase italic tracking-tighter">Sin repartidores aún</h4>
                    <p className="text-[10px] font-bold text-slate-300 max-w-[250px] mx-auto leading-relaxed">
                      Comparte tu código de vinculación para que los repartidores se unan a tu flota privada.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {drivers.map((driver) => (
                    <div 
                      key={driver.id}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors group"
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <Avatar className="w-12 h-12 shadow-md ring-2 ring-white">
                          <AvatarImage src={driver.photoURL} className="object-cover" />
                          <AvatarFallback className="bg-slate-100 text-primary font-black text-sm">
                            {driver.displayName?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        {driver.deliveryActive && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm text-slate-900 truncate leading-none">{driver.displayName || 'Repartidor'}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          {driver.deliveryActive ? '🟢 En línea' : '⚫ Desconectado'}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); handleChat(driver); }}
                          className="h-9 w-9 rounded-xl bg-primary/5 text-primary hover:bg-primary/10"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); handleWhatsApp(driver.phoneNumber); }}
                          className="h-9 w-9 rounded-xl bg-green-50 text-green-600 hover:bg-green-100"
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); setSelectedDriver(driver); }}
                          className="h-9 w-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 3: Evolutionary Report */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between px-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Informe Evolutivo del Repartidor</p>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowTimeConfig(!showTimeConfig)}
                  className="h-7 px-3 text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-primary gap-1.5"
                >
                  <Clock className="w-3 h-3" /> Configurar hora
                </Button>
              </div>

              {showTimeConfig && (
                <ReportTimeConfig 
                  store={store} 
                  onClose={() => setShowTimeConfig(false)} 
                />
              )}

              {/* Report Alert */}
              {isReportAvailable && drivers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[28px] p-6 shadow-xl border border-white/5 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-12 -mt-12" />
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Bell className="w-4 h-4 text-primary animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase italic tracking-tighter leading-none">Nuevo Informe Disponible</h4>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Análisis de rendimiento de tu flota</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                      Se ha completado el ciclo de evaluación diario. Tu informe incluye métricas de desempeño, 
                      tiempos de entrega, y recomendaciones para optimizar tu operación.
                    </p>
                    <Button
                      onClick={() => { setShowReport(true); dismissReport(); }}
                      className="h-10 px-5 rounded-xl bg-primary/20 text-primary hover:bg-primary/30 font-black text-[9px] uppercase tracking-widest transition-all"
                    >
                      Ver informe
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Manual trigger when no alert */}
              {!isReportAvailable && drivers.length > 0 && (
                <div className="bg-white rounded-[24px] p-5 border border-slate-100 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-600">Generar informe manual</p>
                    <p className="text-[9px] font-bold text-slate-400">Análisis instantáneo de tu flota</p>
                  </div>
                  <Button
                    onClick={() => setShowReport(true)}
                    variant="outline"
                    className="h-9 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest border-slate-200"
                  >
                    Generar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Driver Metrics Sheet */}
        <AnimatePresence>
          {selectedDriver && (
            <DriverMetricsSheet 
              driver={selectedDriver} 
              orders={orders}
              store={store}
              onClose={() => setSelectedDriver(null)} 
            />
          )}
        </AnimatePresence>

        {/* Evolutionary Report */}
        <AnimatePresence>
          {showReport && (
            <EvolutionaryReport 
              drivers={drivers}
              orders={orders}
              store={store}
              onClose={() => setShowReport(false)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
