"use client"

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingDown, 
  Zap, 
  Bot, 
  Sparkles,
  ArrowDownCircle,
  Clock,
  Target,
  ChevronRight,
  ShieldX,
  Stethoscope,
  Flame
} from 'lucide-react';
import { useFinanceStore } from '@/hooks/use-finance-store';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface VitalityDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VitalityDashboard({ isOpen, onClose }: VitalityDashboardProps) {
  const { totals, currency, budgets } = useFinanceStore();

  const isSurvivalMode = totals.libre <= 0;

  const specialists = useMemo(() => {
    const score = totals.vitalityScore;
    const isCritical = score < 40 || isSurvivalMode;
    const isHealthy = score > 70 && !isSurvivalMode;

    if (isSurvivalMode) {
      return [
        {
          name: "Auditor de Crisis",
          role: "Protocolo de Emergencia",
          icon: <ShieldX className="w-5 h-5" />,
          advice: "Tu flujo libre es negativo. Estamos en MODO SUPERVIVENCIA. Debes cancelar suscripciones no vitales y reducir el gasto en ocio a CERO hasta recuperar el equilibrio.",
          metric: "Déficit Crítico",
          color: "text-red-600"
        },
        {
          name: "Estratega de Recorte",
          role: "Optimización Obligatoria",
          icon: <Flame className="w-5 h-5" />,
          advice: `Te faltan ${currency.symbol}${Math.abs(totals.libre).toLocaleString()} para cubrir tus compromisos del mes. La inversión está BLOQUEADA.`,
          metric: "Prioridad: Liquidez",
          color: "text-red-600"
        },
        {
          name: "Médico Financiero",
          role: "Diagnóstico de Rescate",
          icon: <Stethoscope className="w-5 h-5" />,
          advice: "He detectado una asfixia por metas demasiado ambiciosas. Debes reajustar tus límites de gasto inmediatamente o entrarás en insolvencia antes de fin de mes.",
          metric: "Vitalidad Comprometida",
          color: "text-red-600"
        }
      ];
    }

    return [
      {
        name: "Analista de Riesgo",
        role: "Evaluación de Cobertura",
        icon: <ShieldCheck className="w-5 h-5" />,
        advice: isCritical 
          ? "Tu liquidez actual solo cubre una fracción mínima de tus compromisos. Existe un riesgo alto de incumplimiento en tus metas de este mes."
          : isHealthy 
            ? "Excelente blindaje. Tienes capital suficiente para cubrir tus planes y mantener un margen de maniobra saludable."
            : "Situación estable pero tensa. Estás en el límite operativo; evita gastos discrecionales hasta que el saldo libre suba.",
        metric: `${Math.round(score)}% de Cobertura`,
        color: isCritical ? "text-destructive" : (isHealthy ? "text-accent" : "text-amber-500")
      },
      {
        name: "Estratega de Capital",
        role: "Optimización de Metas",
        icon: <Target className="w-5 h-5" />,
        advice: totals.libre < 0 
          ? `Tu saldo libre está en déficit (${currency.symbol}${Math.abs(totals.libre).toLocaleString()}). Tus metas están sobrepasando tu realidad de ingresos.`
          : "El flujo libre es positivo. Puedes considerar inyectar capital extra a tus metas de ahorro para acelerar el cumplimiento.",
        metric: `${currency.symbol}${totals.libre.toLocaleString()} Libres`,
        color: totals.libre < 0 ? "text-destructive" : "text-accent"
      },
      {
        name: "Auditor de Patrones",
        role: "Detección de Fugas",
        icon: <Zap className="w-5 h-5" />,
        advice: "He detectado una alta frecuencia de gastos en categorías no esenciales. La suma de micro-gastos está erosionando tu score de vitalidad más rápido que los pagos grandes.",
        metric: "Volatilidad Alta",
        color: "text-primary"
      }
    ];
  }, [totals, currency, isSurvivalMode]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="bg-white w-full max-w-lg h-[92vh] sm:h-auto sm:max-h-[85vh] rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header Superior */}
          <div className={cn(
            "shrink-0 p-8 relative overflow-hidden transition-colors duration-500",
            isSurvivalMode ? "bg-red-600 text-white" : "bg-primary text-white"
          )}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-white/10 rounded-lg">
                    {isSurvivalMode ? <ShieldX className="w-5 h-5" /> : <Activity className="w-5 h-5 text-accent" />}
                  </div>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
                    {isSurvivalMode ? 'PROTOCOLOS DE RESCATE' : 'Biometría Financiera'}
                  </h2>
                </div>
                <h3 className="text-4xl font-black tracking-tighter">
                  {isSurvivalMode ? 'ALERTA' : 'Salud'}: <span className={cn(
                    isSurvivalMode ? "text-white" : (totals.vitalityScore > 70 ? "text-accent" : (totals.vitalityScore > 40 ? "text-amber-400" : "text-red-400"))
                  )}>{isSurvivalMode ? 'ROJA' : `${Math.round(totals.vitalityScore)}%`}</span>
                </h3>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mt-8 bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-md">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Resistencia de Saldo</span>
                <span className="text-[9px] font-black text-accent">{isSurvivalMode ? 'FALLO CRÍTICO' : `NIVEL ${totals.vitalityScore > 50 ? 'ÓPTIMO' : 'ALTO RIESGO'}`}</span>
              </div>
              <Progress 
                value={totals.vitalityScore} 
                className="h-2 bg-white/10 [&>div]:bg-white" 
              />
            </div>
          </div>

          {/* Cuerpo de Análisis */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-background/30">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-[2rem] border border-muted/20 shadow-sm">
                <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Estado de Flujo</p>
                <p className={cn("text-lg font-black uppercase", isSurvivalMode ? "text-red-600" : "text-primary")}>
                  {isSurvivalMode ? 'DÉFICIT' : 'MODERADO'}
                </p>
              </div>
              <div className="bg-white p-5 rounded-[2rem] border border-muted/20 shadow-sm">
                <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Modo Sistema</p>
                <p className={cn("text-lg font-black uppercase", isSurvivalMode ? "text-red-600 animate-pulse" : "text-accent")}>
                  {isSurvivalMode ? 'SUPERVIVENCIA' : 'CRECIMIENTO'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2">
                <Bot className="w-4 h-4 text-primary" />
                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Dictamen de Especialistas</h4>
              </div>

              {specialists.map((s, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className={cn(
                    "bg-white p-6 rounded-[2rem] border border-muted/20 shadow-sm transition-all group",
                    isSurvivalMode && "border-red-200 bg-red-50/20"
                  )}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2.5 rounded-xl transition-colors",
                        isSurvivalMode ? "bg-red-600 text-white" : "bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white"
                      )}>
                        {s.icon}
                      </div>
                      <div>
                        <h5 className={cn("text-[11px] font-black uppercase leading-none", isSurvivalMode ? "text-red-600" : "text-primary")}>{s.name}</h5>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{s.role}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("text-[8px] font-black border-none uppercase bg-muted/30", s.color)}>
                      {s.metric}
                    </Badge>
                  </div>
                  <p className={cn(
                    "text-[11px] leading-relaxed italic border-l-2 pl-4",
                    isSurvivalMode ? "text-red-700 border-red-600" : "text-primary/70 border-accent/20"
                  )}>
                    "{s.advice}"
                  </p>
                </motion.div>
              ))}
            </div>

            <div className={cn(
              "p-6 rounded-[2.5rem] flex items-center justify-between group cursor-pointer active:scale-95 transition-all shadow-xl",
              isSurvivalMode ? "bg-red-600 text-white" : "bg-accent/5 border border-accent/10 text-primary"
            )}>
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-2xl shadow-lg", isSurvivalMode ? "bg-black" : "bg-accent shadow-accent/20")}>
                  {isSurvivalMode ? <Flame className="w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    {isSurvivalMode ? 'PLAN DE RESCATE INMEDIATO' : 'Plan de Crecimiento IA'}
                  </p>
                  <p className={cn("text-[8px] font-bold uppercase", isSurvivalMode ? "text-red-100" : "text-muted-foreground")}>
                    Generar hoja de ruta táctica
                  </p>
                </div>
              </div>
              <ChevronRight className={cn("w-5 h-5 opacity-40 group-hover:translate-x-1 transition-transform", isSurvivalMode ? "text-white" : "text-accent")} />
            </div>
          </div>

          {/* Footer de Cierre */}
          <div className="p-6 bg-white border-t shrink-0">
            <button 
              onClick={onClose}
              className={cn(
                "w-full h-16 text-white font-black uppercase text-xs tracking-[0.3em] rounded-2xl shadow-xl active:scale-95 transition-all",
                isSurvivalMode ? "bg-red-600" : "bg-primary"
              )}
            >
              Cerrar Diagnóstico
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}