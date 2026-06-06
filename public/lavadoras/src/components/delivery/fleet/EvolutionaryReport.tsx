"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  X, FileText, Download, Eye, Loader2, 
  CheckCircle2, TrendingUp, BarChart3, Sparkles,
  FileDown, FileType
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { exportReportToPDF, exportReportToWord } from './ReportExporter';

interface EvolutionaryReportProps {
  drivers: any[];
  orders: any[];
  store: any;
  onClose: () => void;
}

type ReportPhase = 'generating' | 'ready';

const GENERATION_STEPS = [
  { label: "Analizando entregas del día...", icon: BarChart3, duration: 1500 },
  { label: "Calculando métricas de rendimiento...", icon: TrendingUp, duration: 1500 },
  { label: "Evaluando cumplimiento de flota...", icon: CheckCircle2, duration: 1500 },
  { label: "Generando recomendaciones inteligentes...", icon: Sparkles, duration: 1500 },
  { label: "Compilando informe final...", icon: FileText, duration: 1000 },
];

export function EvolutionaryReport({ drivers, orders, store, onClose }: EvolutionaryReportProps) {
  const [phase, setPhase] = useState<ReportPhase>('generating');
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  // Generation animation
  useEffect(() => {
    if (phase !== 'generating') return;
    let stepIndex = 0;
    let canceled = false;

    const runStep = () => {
      if (canceled || stepIndex >= GENERATION_STEPS.length) {
        if (!canceled) setPhase('ready');
        return;
      }
      setCurrentStep(stepIndex);
      setProgress(Math.round(((stepIndex + 1) / GENERATION_STEPS.length) * 100));
      stepIndex++;
      setTimeout(runStep, GENERATION_STEPS[stepIndex - 1]?.duration || 1000);
    };

    const timeout = setTimeout(runStep, 500);
    return () => { canceled = true; clearTimeout(timeout); };
  }, [phase]);

  // Build report data
  const reportData = useMemo(() => {
    const today = new Date();
    const dayStart = startOfDay(today);
    const dayEnd = endOfDay(today);

    const driverReports = drivers.map(driver => {
      const driverOrders = orders.filter(o => o.deliveryDriverId === driver.id);
      const todayCompleted = driverOrders.filter(o => {
        if (!['completed', 'delivered'].includes(o.status)) return false;
        const ts = o.completedAt || o.deliveredAt || o.createdAt;
        const date = ts?.toDate?.() || (ts?.seconds ? new Date(ts.seconds * 1000) : null);
        return date ? isWithinInterval(date, { start: dayStart, end: dayEnd }) : false;
      });

      const allCompleted = driverOrders.filter(o => ['completed', 'delivered'].includes(o.status));
      const released = driverOrders.filter(o => o.releasedBy === driver.id);
      const total = allCompleted.length + released.length;

      const deliveryTimes = todayCompleted.map(o => {
        const accepted = o.acceptedAt?.toMillis?.() || (o.acceptedAt?.seconds ? o.acceptedAt.seconds * 1000 : 0);
        const delivered = o.deliveredAt?.toMillis?.() || (o.deliveredAt?.seconds ? o.deliveredAt.seconds * 1000 : 0);
        return accepted && delivered ? (delivered - accepted) / 60000 : 0;
      }).filter(t => t > 0);

      const avgTime = deliveryTimes.length > 0 
        ? Math.round(deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length) 
        : 0;

      const todayRevenue = todayCompleted.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
      const fulfillment = total > 0 ? Math.round((allCompleted.length / total) * 100) : 100;

      let performance: 'excellent' | 'good' | 'warning' = 'good';
      if (fulfillment >= 90 && todayCompleted.length >= 2) performance = 'excellent';
      else if (fulfillment < 70 || released.length > 2) performance = 'warning';

      return {
        id: driver.id,
        name: driver.displayName || 'Repartidor',
        photo: driver.photoURL,
        todayDeliveries: todayCompleted.length,
        avgTime,
        todayRevenue,
        fulfillment,
        performance,
        totalDeliveries: allCompleted.length,
        releasedCount: released.length,
      };
    });

    const totalDeliveriesToday = driverReports.reduce((acc, d) => acc + d.todayDeliveries, 0);
    const totalRevenueToday = driverReports.reduce((acc, d) => acc + d.todayRevenue, 0);

    // Generate positive suggestion
    const suggestions = [
      "Mantener comunicación activa con tu equipo fortalece la operación. Considera un mensaje de reconocimiento diario.",
      "Los tiempos de entrega mejoran cuando los repartidores conocen las rutas. Comparte mapas de zonas frecuentes.",
      "Ofrecer incentivos por entregas completadas sin liberación aumenta la retención de tu flota.",
      "Programa rutas en bloques de horario para maximizar la eficiencia de tu equipo.",
      "Reconocer públicamente al repartidor del día motiva al equipo completo.",
    ];
    const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];

    return { driverReports, totalDeliveriesToday, totalRevenueToday, suggestion, generatedAt: today };
  }, [drivers, orders]);

  const performanceIcon = (p: string) => {
    if (p === 'excellent') return '🟢';
    if (p === 'good') return '🟡';
    return '🔴';
  };

  const handleExportPDF = () => {
    exportReportToPDF(reportData, store);
  };

  const handleExportWord = () => {
    exportReportToWord(reportData, store);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] bg-white flex flex-col"
    >
      {/* Header */}
      <div className="shrink-0 bg-slate-900 px-6 py-5 flex items-center justify-between safe-area-top">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-sm font-black uppercase tracking-tighter italic text-white leading-none">Informe Evolutivo</h2>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              {format(new Date(), "dd MMM yyyy • HH:mm", { locale: es })}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {phase === 'generating' ? (
          <div className="flex flex-col items-center justify-center min-h-full p-8 space-y-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-[32px] bg-slate-50 flex items-center justify-center shadow-xl">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg">
                <span className="text-[10px] font-black">{progress}%</span>
              </div>
            </div>

            <div className="text-center space-y-3 max-w-[300px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-center gap-2"
                >
                  {GENERATION_STEPS[currentStep] && (
                    <>
                      {(() => {
                        const StepIcon = GENERATION_STEPS[currentStep].icon;
                        return <StepIcon className="w-4 h-4 text-primary" />;
                      })()}
                      <p className="text-sm font-black text-slate-700 italic">{GENERATION_STEPS[currentStep].label}</p>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-[280px] h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-6" id="report-content">
            {/* Executive Summary */}
            <div className="bg-slate-900 rounded-[28px] p-6 text-white">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">Resumen ejecutivo</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-black text-primary tracking-tighter">{reportData.totalDeliveriesToday}</p>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Entregas hoy</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-emerald-400 tracking-tighter">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(reportData.totalRevenueToday)}
                  </p>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Ingresos hoy</p>
                </div>
              </div>
            </div>

            {/* Driver Details */}
            <div className="space-y-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Desempeño por repartidor</p>
              {reportData.driverReports.map((dr, index) => (
                <motion.div
                  key={dr.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="w-10 h-10 shadow-sm ring-2 ring-white shrink-0">
                      <AvatarImage src={dr.photo} className="object-cover" />
                      <AvatarFallback className="bg-slate-100 text-primary font-black text-sm">{dr.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm text-slate-900 truncate">{dr.name}</p>
                      <p className="text-[9px] font-bold text-slate-400">{performanceIcon(dr.performance)} Rendimiento {dr.performance === 'excellent' ? 'Excelente' : dr.performance === 'good' ? 'Bueno' : 'Necesita atención'}</p>
                    </div>
                    <Badge className={cn(
                      "border-none rounded-full px-3 h-6 text-[8px] font-black uppercase",
                      dr.performance === 'excellent' ? 'bg-green-50 text-green-600' : 
                      dr.performance === 'good' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'
                    )}>
                      {dr.fulfillment}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-lg font-black text-slate-900 leading-none">{dr.todayDeliveries}</p>
                      <p className="text-[7px] font-black text-slate-400 uppercase mt-1">Entregas</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-lg font-black text-slate-900 leading-none">{dr.avgTime > 0 ? `${dr.avgTime}m` : 'N/A'}</p>
                      <p className="text-[7px] font-black text-slate-400 uppercase mt-1">Tiempo Prom.</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-base font-black text-emerald-600 leading-none">
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(dr.todayRevenue)}
                      </p>
                      <p className="text-[7px] font-black text-slate-400 uppercase mt-1">Ingresos</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Positive Suggestion */}
            <div className="bg-primary/5 rounded-[24px] p-6 border border-primary/10">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-1">Sugerencia del día</p>
                  <p className="text-xs font-bold text-slate-600 leading-relaxed">{reportData.suggestion}</p>
                </div>
              </div>
            </div>

            {/* Export Actions */}
            <div className="grid grid-cols-3 gap-3 pb-safe pt-2">
              <Button
                variant="outline"
                className="h-14 rounded-2xl flex flex-col gap-1 border-slate-200 hover:border-primary hover:bg-primary/5"
                onClick={() => {/* Already viewing in-app */}}
              >
                <Eye className="w-4 h-4 text-primary" />
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Ver aquí</span>
              </Button>
              <Button
                variant="outline"
                className="h-14 rounded-2xl flex flex-col gap-1 border-slate-200 hover:border-red-500 hover:bg-red-50"
                onClick={handleExportPDF}
              >
                <FileDown className="w-4 h-4 text-red-500" />
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">PDF</span>
              </Button>
              <Button
                variant="outline"
                className="h-14 rounded-2xl flex flex-col gap-1 border-slate-200 hover:border-blue-500 hover:bg-blue-50"
                onClick={handleExportWord}
              >
                <FileType className="w-4 h-4 text-blue-500" />
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Word</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
