'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, doc, orderBy, where } from 'firebase/firestore';
import { Cpu, ArrowRight, Sparkles, Loader2, LogIn } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useCountUpRef } from '@/hooks/use-count-up';
import { useTilt3D, useMagneticHover } from '@/hooks/use-gsap';
import { useTheme } from '@/components/ThemeProvider';

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.08,
      duration: 0.6,
      ease: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
    },
  }),
};

const stagger = {
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      const savedMode = localStorage.getItem('yapido_click_preferred_mode');
      if (savedMode === 'delivery') {
        router.replace('/delivery/dashboard');
      }
    }
  }, [user, isUserLoading, router]);

  return (
    <div className={cn(
      "flex flex-col w-full transition-colors duration-700 relative",
      user ? "min-h-screen" : "min-h-[100dvh] overflow-hidden"
    )}>
      {user && <Header />}
      <main className="flex-1 w-full overflow-x-hidden relative">
        <HomeContent user={user} isUserLoading={isUserLoading} />
      </main>
    </div>
  );
}

function Header() {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
      className="sticky top-0 z-50 w-full glass-strong"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LogoMark />
          <div className="flex flex-col leading-none">
            <span className="font-display font-black text-lg tracking-tight">Yapido</span>
            <span className="text-[9px] font-mono text-muted-foreground tracking-widest uppercase">finanzas</span>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </motion.header>
  );
}

function LogoMark() {
  return (
    <motion.div
      whileHover={{ rotate: 360, scale: 1.1 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow"
    >
      <span className="font-display font-black text-white text-sm">F</span>
    </motion.div>
  );
}

function HomeContent({ user, isUserLoading }: { user: any, isUserLoading: boolean }) {
  const firestore = useFirestore();
  const lockRef = useMemoFirebase(() => doc(firestore, 'appConfig', 'washer_lock'), [firestore]);
  const { data: dataLock, isLoading: isLoadingLock } = useDoc(lockRef);

  const isLocked = isLoadingLock || dataLock?.active !== false;

  if (!user && !isUserLoading) {
    return <UnauthenticatedHero isLocked={isLocked} />;
  }

  if (isUserLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-10 h-10 text-primary" />
        </motion.div>
      </div>
    );
  }

  return <AuthenticatedHome firestore={firestore} user={user} isLocked={isLocked} />;
}

function UnauthenticatedHero({ isLocked }: { isLocked: boolean }) {
  const { theme } = useTheme();
  const ref = useMagneticHover<HTMLButtonElement>(0.4);

  return (
    <div className="relative min-h-[100dvh] w-full flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="absolute top-6 right-6 z-30"
      >
        <ThemeToggle />
      </motion.div>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-2xl w-full text-center space-y-8"
      >
        <motion.div variants={cardVariants} custom={0}>
          <LogoMark />
        </motion.div>

        <motion.h1
          variants={cardVariants}
          custom={1}
          className="text-5xl sm:text-7xl font-black tracking-tighter leading-[0.95]"
        >
          Tu dinero, <span className="text-shimmer">inteligente</span>
        </motion.h1>

        <motion.p
          variants={cardVariants}
          custom={2}
          className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto leading-relaxed"
        >
          Asistente financiero con IA multiespecialista. Registra gastos por chat, voz o foto, y deja que el algoritmo prediga tu próximo movimiento.
        </motion.p>

        <motion.div
          variants={cardVariants}
          custom={3}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <button
            ref={ref}
            onClick={async () => {
              const { initiateGoogleSignIn } = await import('@/firebase/non-blocking-login');
              const { getAuth } = await import('firebase/auth');
              initiateGoogleSignIn(getAuth());
            }}
            className="group relative h-16 px-10 rounded-2xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-black uppercase text-sm tracking-widest shadow-glow flex items-center gap-3 mx-auto overflow-hidden btn-magnetic"
          >
            <span className="relative z-10 flex items-center gap-3">
              <LogIn className="w-5 h-5" />
              Entrar con Google
            </span>
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-accent to-primary transition-transform duration-500" />
            <Sparkles className="w-4 h-4 animate-pulse" />
          </button>
        </motion.div>

        <motion.div
          variants={cardVariants}
          custom={4}
          className="grid grid-cols-3 gap-4 pt-8"
        >
          <StatCounter target={6} label="Categorías" />
          <StatCounter target={3} label="Agentes IA" />
          <StatCounter target={100} label="% Privado" suffix="%" />
        </motion.div>

        {!isLocked && (
          <motion.div
            variants={cardVariants}
            custom={5}
            className="pt-4"
          >
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse-glow" />
              Modo sincronización activo
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function StatCounter({ target, label, suffix = '' }: { target: number; label: string; suffix?: string }) {
  const { ref, value } = useCountUpRef(target);
  return (
    <div className="card-elevated p-6 rounded-2xl">
      <p className="text-3xl font-black tracking-tighter">
        <span ref={ref}>{value}</span>
        {suffix}
      </p>
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1">
        {label}
      </p>
    </div>
  );
}

function AuthenticatedHome({ firestore, user, isLocked }: { firestore: any, user: any, isLocked: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8"
    >
      <GreetingHeader user={user} />
      <QuickStatsGrid firestore={firestore} isLocked={isLocked} />
      <FeatureCards />
    </motion.div>
  );
}

function GreetingHeader({ user }: { user: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-2"
    >
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        Cuartel de Operaciones
      </p>
      <h1 className="text-4xl sm:text-5xl font-black tracking-tighter">
        Hola, <span className="gradient-text">{user?.displayName?.split(' ')[0] || 'agente'}</span>
      </h1>
      <p className="text-sm text-muted-foreground">
        Listo para sincronizar tu economía. ¿Qué harás hoy?
      </p>
    </motion.div>
  );
}

function QuickStatsGrid({ firestore, isLocked }: { firestore: any, isLocked: boolean }) {
  const catQ = useMemoFirebase(
    () => isLocked ? null : query(collection(firestore, 'mainCategories'), orderBy('createdAt', 'desc')),
    [firestore, isLocked]
  );
  const { data: categories, isLoading } = useCollection(catQ);
  const ref = useTilt3D<HTMLDivElement>(4);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="card-elevated p-8 rounded-3xl"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        Vitrinas activas
      </p>
      <div className="flex items-end gap-2 mt-2">
        <span className="text-5xl font-black tracking-tighter">
          {isLoading ? '...' : (categories?.length ?? 0)}
        </span>
        <span className="text-sm text-muted-foreground mb-2">categorías</span>
      </div>
    </motion.div>
  );
}

function FeatureCards() {
  const features = [
    { icon: '📊', title: 'Historial', desc: 'Caja de movimientos con IA', href: '#' },
    { icon: '📅', title: 'Calendario', desc: 'Agenda inteligente', href: '#' },
    { icon: '🎯', title: 'Presupuestos', desc: 'Arquitectura de metas', href: '#' },
    { icon: '📈', title: 'Análisis', desc: 'Cuartel de inteligencia', href: '#' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {features.map((f, i) => (
        <motion.div
          key={f.title}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + i * 0.08, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="card-elevated p-6 rounded-2xl cursor-pointer"
        >
          <div className="text-3xl mb-3">{f.icon}</div>
          <h3 className="font-display font-black text-lg tracking-tight">{f.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
        </motion.div>
      ))}
    </div>
  );
}
