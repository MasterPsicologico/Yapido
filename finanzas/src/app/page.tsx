
"use client"

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransactionsFeature } from '@/features/transactions/transactions-feature';
import { CalendarFeature } from '@/features/calendar/calendar-feature';
import { BudgetFeature } from '@/features/budget/budget-feature';
import { AnalysisFeature } from '@/features/analysis/analysis-feature';
import { CalculatorOverlay } from '@/components/calculator-overlay';
import { VitalityDashboard } from '@/components/vitality-dashboard';
import { useFinanceStore } from '@/hooks/use-finance-store';
import { useUser, useAuth } from '@/firebase';
import { initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { signOut } from 'firebase/auth';
import { 
  ArrowRightLeft, 
  Calendar as CalendarIcon, 
  Target, 
  BarChart3, 
  Calculator as CalculatorIcon,
  Wallet,
  ShieldCheck,
  User as UserIcon,
  LogIn,
  LogOut,
  Sparkles,
  Lock,
  ChevronRight,
  Info,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function Home() {
  const [activeTab, setActiveTab] = useState('transacciones');
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isVitalityOpen, setIsVitalityOpen] = useState(false);
  const [infoSection, setInfoSection] = useState<string | null>(null);
  const { totals, currency, isSyncing, isInitialized } = useFinanceStore();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const sectionDescriptions: Record<string, { title: string, desc: string }> = {
    transacciones: {
      title: "Caja de Movimientos",
      desc: "Gestión centralizada de tus finanzas. Aquí registras ingresos y gastos manualmente o mediante IA (voz/foto) para mantener tu saldo al día."
    },
    calendario: {
      title: "Agenda Inteligente",
      desc: "Cronograma interactivo que organiza tus compromisos. La IA te notificará sobre pagos próximos y recordatorios de salud o trabajo."
    },
    presupuesto: {
      title: "Arquitectura de Metas",
      desc: "Control total de tus presupuestos. Define límites por categoría y configura estrategias de fondeo automático para tus ahorros."
    },
    analisis: {
      title: "Cuartel de Inteligencia",
      desc: "Análisis predictivo de tus patrones de consumo. Genera informes automáticos y proyecciones de flujo para optimizar tu capital."
    }
  };

  if (!isInitialized || isUserLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="h-8 w-8 border-4 border-primary border-t-accent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-primary/5 to-transparent -z-10" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center space-y-8 max-w-sm"
        >
          <div className="h-20 w-20 flex items-center justify-center rounded-[2rem] bg-primary shadow-2xl shadow-primary/20 relative">
            <Wallet className="h-10 w-10 text-white" />
            <div className="absolute -bottom-1 -right-1 bg-accent p-1.5 rounded-lg border-4 border-white shadow-lg">
              <Lock className="w-3 h-3 text-white" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-black text-primary leading-tight">
              Cuartel <span className="text-accent">FinanzasIA</span>
            </h1>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed">
              Tu base de datos está protegida con cifrado de grado militar. Identifícate para acceder a tu historial.
            </p>
          </div>

          <Button 
            onClick={() => initiateGoogleSignIn(auth)}
            className="w-full h-16 bg-primary text-white rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-between px-6 group"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white p-1 rounded-md">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.38-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <span className="font-black text-xs uppercase tracking-widest">Entrar con Google</span>
            </div>
            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
          </Button>

          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-accent" /> Inteligencia Multiespecialista Activa
          </p>
        </motion.div>
      </div>
    );
  }

  // CÁLCULO DE CIRCUNFERENCIA EXACTA PARA SVG (r=16 -> 2 * PI * 16 ≈ 100.53)
  const circumference = 100.53;

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      <header className="shrink-0 w-full border-b bg-white z-50">
        <div className="flex h-16 items-center justify-between px-3 w-full">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div className="hidden xs:block">
              <h1 className="font-black text-xs text-primary leading-none">
                Finanzas<span className="text-accent">IA</span>
              </h1>
              <p className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Cuartel Central</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* FARO BIOMÉTRICO - SISTEMA DE VITALIDAD CALIBRADO */}
            <div className="flex items-center gap-2 border-r pr-2 border-muted/30">
              <button 
                onClick={() => setIsVitalityOpen(true)}
                className="relative h-9 w-9 flex items-center justify-center hover:scale-110 active:scale-90 transition-all group"
              >
                <div className="absolute inset-0 bg-accent/5 rounded-full scale-0 group-hover:scale-150 transition-transform duration-500 opacity-0 group-hover:opacity-100" />
                <svg className="absolute inset-0 h-full w-full -rotate-90">
                  <circle cx="18" cy="18" r="16" fill="transparent" stroke="#e2e8f0" strokeWidth="3" />
                  <motion.circle 
                    cx="18" cy="18" r="16" fill="transparent" 
                    stroke={totals.vitalityScore > 70 ? "#00AFB9" : (totals.vitalityScore > 40 ? "#F59E0B" : "#F43F5E")} 
                    strokeWidth="3"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference - (circumference * totals.vitalityScore / 100) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="flex flex-col items-center justify-center relative z-10">
                  <Activity className={cn(
                    "w-2.5 h-2.5 mb-0.5",
                    totals.vitalityScore > 70 ? "text-accent" : (totals.vitalityScore > 40 ? "text-amber-500" : "text-destructive")
                  )} />
                  <span className="text-[8px] font-black leading-none">{Math.round(totals.vitalityScore)}</span>
                </div>
              </button>

              <div className="text-right">
                <p className="text-[7px] font-black text-muted-foreground uppercase leading-none mb-0.5">Saldo</p>
                <p className={cn("text-[11px] font-black leading-none", totals.balance >= 0 ? "text-primary" : "text-destructive")}>
                  {currency.symbol}{totals.balance.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[7px] font-black text-accent uppercase leading-none mb-0.5 flex items-center justify-end gap-0.5">
                  Libre <ShieldCheck className="w-1.5 h-1.5" />
                </p>
                <p className={cn("text-[11px] font-black leading-none", totals.libre >= 0 ? "text-accent" : "text-destructive")}>
                  {currency.symbol}{totals.libre.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setIsCalculatorOpen(true)}
                className="h-9 w-9 rounded-xl border-muted text-primary"
              >
                <CalculatorIcon className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full overflow-hidden border border-muted/30">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={user.photoURL || ''} />
                      <AvatarFallback className="bg-accent text-white font-black text-[10px]">
                        {user.displayName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-none">
                  <div className="p-3 mb-2 bg-primary/5 rounded-xl">
                    <p className="text-[10px] font-black uppercase text-primary mb-1">Nube Activa</p>
                    <p className="text-xs font-bold text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuItem onClick={() => signOut(auth)} className="rounded-xl text-destructive font-bold gap-2 p-3 cursor-pointer">
                    <LogOut className="w-4 h-4" /> Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden bg-white relative">
        {isSyncing && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent/20 z-[60]">
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="h-full w-1/3 bg-accent shadow-[0_0_10px_#00AFB9]"
            />
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="shrink-0 bg-white border-b z-40">
            <TabsList className="grid grid-cols-4 h-20 p-0 bg-white rounded-none w-full border-none items-stretch">
              <TabsTrigger 
                value="transacciones" 
                className="relative rounded-none border-b-4 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50/40 text-[9px] font-black uppercase flex flex-col items-center justify-center gap-1 group transition-all"
              >
                <div className="p-2 rounded-xl bg-blue-100/50 shadow-inner">
                  <ArrowRightLeft className="h-6 w-6 text-blue-600 drop-shadow-[2px_3px_2px_rgba(0,0,0,0.3)] transform transition-transform group-hover:scale-110" />
                </div>
                <span className="hidden xs:inline text-blue-900/70 data-[state=active]:text-blue-900">Caja</span>
                <div 
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); setInfoSection('transacciones'); }}
                  onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setInfoSection('transacciones'); } }}
                  className="absolute top-1 right-1 p-1 text-blue-500/40 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all z-10 cursor-pointer"
                >
                  <Info className="w-3 h-3" />
                </div>
              </TabsTrigger>

              <TabsTrigger 
                value="calendario" 
                className="relative rounded-none border-b-4 border-transparent data-[state=active]:border-purple-500 data-[state=active]:bg-purple-50/40 text-[9px] font-black uppercase flex flex-col items-center justify-center gap-1 group transition-all"
              >
                <div className="p-2 rounded-xl bg-purple-100/50 shadow-inner">
                  <CalendarIcon className="h-6 w-6 text-purple-600 drop-shadow-[2px_3px_2px_rgba(0,0,0,0.3)] transform transition-transform group-hover:scale-110" />
                </div>
                <span className="hidden xs:inline text-purple-900/70 data-[state=active]:text-purple-900">Agenda</span>
                <div 
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); setInfoSection('calendario'); }}
                  onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setInfoSection('calendario'); } }}
                  className="absolute top-1 right-1 p-1 text-purple-500/40 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all z-10 cursor-pointer"
                >
                  <Info className="w-3 h-3" />
                </div>
              </TabsTrigger>

              <TabsTrigger 
                value="presupuesto" 
                className="relative rounded-none border-b-4 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-emerald-50/40 text-[9px] font-black uppercase flex flex-col items-center justify-center gap-1 group transition-all"
              >
                <div className="p-2 rounded-xl bg-emerald-100/50 shadow-inner">
                  <Target className="h-6 w-6 text-emerald-600 drop-shadow-[2px_3px_2px_rgba(0,0,0,0.3)] transform transition-transform group-hover:scale-110" />
                </div>
                <span className="hidden xs:inline text-emerald-900/70 data-[state=active]:text-emerald-900">Metas</span>
                <div 
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); setInfoSection('presupuesto'); }}
                  onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setInfoSection('presupuesto'); } }}
                  className="absolute top-1 right-1 p-1 text-emerald-500/40 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all z-10 cursor-pointer"
                >
                  <Info className="w-3 h-3" />
                </div>
              </TabsTrigger>

              <TabsTrigger 
                value="analisis" 
                className="relative rounded-none border-b-4 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-amber-50/40 text-[9px] font-black uppercase flex flex-col items-center justify-center gap-1 group transition-all"
              >
                <div className="p-2 rounded-xl bg-amber-100/50 shadow-inner">
                  <BarChart3 className="h-6 w-6 text-amber-600 drop-shadow-[2px_3px_2px_rgba(0,0,0,0.3)] transform transition-transform group-hover:scale-110" />
                </div>
                <span className="hidden xs:inline text-amber-900/70 data-[state=active]:text-amber-900">Análisis</span>
                <div 
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); setInfoSection('analisis'); }}
                  onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setInfoSection('analisis'); } }}
                  className="absolute top-1 right-1 p-1 text-amber-500/40 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-all z-10 cursor-pointer"
                >
                  <Info className="w-3 h-3" />
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <TabsContent value="transacciones" className="flex-1 m-0 p-0 overflow-hidden focus-visible:outline-none data-[state=active]:flex flex-col">
              <TransactionsFeature />
            </TabsContent>
            <TabsContent value="calendario" className="flex-1 m-0 p-0 overflow-hidden focus-visible:outline-none data-[state=active]:flex flex-col">
              <CalendarFeature />
            </TabsContent>
            <TabsContent value="presupuesto" className="flex-1 m-0 p-0 overflow-hidden focus-visible:outline-none data-[state=active]:flex flex-col">
              <BudgetFeature />
            </TabsContent>
            <TabsContent value="analisis" className="flex-1 m-0 p-0 overflow-hidden focus-visible:outline-none data-[state=active]:flex flex-col">
              <AnalysisFeature />
            </TabsContent>
          </div>
        </Tabs>
      </main>

      <Dialog open={!!infoSection} onOpenChange={() => setInfoSection(null)}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-10 bg-white max-w-[90%] sm:max-w-md mx-auto">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-primary/5 rounded-[1.5rem]">
                <Info className="w-7 h-7 text-primary" />
              </div>
              <DialogTitle className="text-2xl font-black uppercase text-primary tracking-tighter leading-none">
                {infoSection ? sectionDescriptions[infoSection].title : ''}
              </DialogTitle>
            </div>
            <DialogDescription className="text-base font-medium text-muted-foreground leading-relaxed pt-2">
              {infoSection ? sectionDescriptions[infoSection].desc : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-10">
            <Button 
              onClick={() => setInfoSection(null)} 
              className="w-full h-16 rounded-[1.5rem] bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all"
            >
              Entendido, Continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CalculatorOverlay 
        isOpen={isCalculatorOpen} 
        onClose={() => setIsCalculatorOpen(false)} 
        currencySymbol={currency.symbol}
      />

      <VitalityDashboard 
        isOpen={isVitalityOpen} 
        onClose={() => setIsVitalityOpen(false)} 
      />
    </div>
  );
}
