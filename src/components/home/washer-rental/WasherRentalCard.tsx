"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  Zap, Moon, Store as StoreIcon, LayoutGrid, ChevronDown,
  Loader2, Lock, Unlock, Smartphone, Monitor, X, CheckCircle2,
  Truck, Clock, Sparkles, UserCheck
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

interface WasherRentalCardProps {
  isAdmin: boolean;
  bannerConfig: any;
  isAnyStoreOpen: boolean;
  activeStoresCount?: number;
  recentOrders?: any[];
  userRole?: string;
  isUploadingBanner: boolean;
  isLocked?: boolean;
  onToggleLock?: () => void;
  onOpenSolicitation: () => void;
  onOpenStoreCreation: () => void;
  onBannerUpload: (e: React.ChangeEvent<HTMLInputElement>, target: 'mobile' | 'pc') => void;
}

const CACHE_MOBILE = 'vitriniando_washer_banner_mobile';
const CACHE_DESKTOP = 'vitriniando_washer_banner_desktop';

/* ═══════════════════════════════════════════════════════════════
   WASHER RENTAL CARD — Ultra-Premium with Framer Motion Physics
   ═══════════════════════════════════════════════════════════════ */

export function WasherRentalCard({
  isAdmin, bannerConfig, isAnyStoreOpen, isUploadingBanner,
  isLocked = false, onToggleLock, onOpenSolicitation,
  onOpenStoreCreation, onBannerUpload,
  activeStoresCount, recentOrders, userRole
}: WasherRentalCardProps) {
  const { user } = useUser();
  const [localMobile, setLocalMobile] = useState<string | null>(null);
  const [localDesktop, setLocalDesktop] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);

  // ── Mouse Parallax System ──
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const springMX = useSpring(mouseX, { stiffness: 40, damping: 30 });
  const springMY = useSpring(mouseY, { stiffness: 40, damping: 30 });

  // Parallax layers
  const parallaxX1 = useTransform(springMX, [0, 1], [-15, 15]);
  const parallaxY1 = useTransform(springMY, [0, 1], [-10, 10]);
  const parallaxX2 = useTransform(springMX, [0, 1], [20, -20]);
  const parallaxY2 = useTransform(springMY, [0, 1], [15, -15]);
  const parallaxX3 = useTransform(springMX, [0, 1], [-30, 30]);
  const parallaxY3 = useTransform(springMY, [0, 1], [-20, 20]);

  const handleContainerMouse = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set((e.clientX - rect.left) / rect.width);
      mouseY.set((e.clientY - rect.top) / rect.height);
    },
    [mouseX, mouseY]
  );

  useEffect(() => {
    const cachedMobile = localStorage.getItem(CACHE_MOBILE);
    const cachedDesktop = localStorage.getItem(CACHE_DESKTOP);
    if (cachedMobile) setLocalMobile(cachedMobile);
    if (cachedDesktop) setLocalDesktop(cachedDesktop);
  }, []);

  useEffect(() => {
    if (bannerConfig?.backgroundImage && bannerConfig.backgroundImage !== localMobile) {
      setLocalMobile(bannerConfig.backgroundImage);
      localStorage.setItem(CACHE_MOBILE, bannerConfig.backgroundImage);
    }
    if (bannerConfig?.backgroundImageDesktop && bannerConfig.backgroundImageDesktop !== localDesktop) {
      setLocalDesktop(bannerConfig.backgroundImageDesktop);
      localStorage.setItem(CACHE_DESKTOP, bannerConfig.backgroundImageDesktop);
    }
  }, [bannerConfig, localMobile, localDesktop]);

  const hasBanner = !!(localMobile || localDesktop);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleContainerMouse}
      className={cn(
        "relative w-full overflow-hidden flex flex-col items-center justify-start transition-all duration-700",
        user ? "h-[calc(100dvh-64px)]" : "h-[100dvh]"
      )}
    >
      {/* ═══ LAYER 0: Animated Mesh Gradient Base ═══ */}
      <div className="absolute inset-0 z-0 select-none touch-none">
        <div className="absolute inset-0 mesh-gradient-bg" />

        {/* Banner images */}
        <div className="sm:hidden relative w-full h-full">
          {localMobile && <Image src={localMobile} alt="Portada Móvil" fill className="object-cover object-top" priority />}
        </div>
        <div className="hidden sm:block relative w-full h-full">
          {localDesktop ? (
            <Image src={localDesktop} alt="Portada PC" fill className="object-cover object-top" priority />
          ) : localMobile ? (
            <Image src={localMobile} alt="Portada Fallback" fill className="object-cover object-top" priority />
          ) : null}
        </div>

        {/* Cinematic vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.4)_100%)]" />
        <div className="absolute inset-0 scan-lines opacity-20" />
      </div>

      {/* ═══ LAYER 1: Parallax Glow Orbs ═══ */}
      {!hasBanner && (
        <>
          <motion.div
            className="absolute w-[300px] h-[300px] rounded-full pointer-events-none z-[1]"
            style={{
              top: '8%', left: '10%',
              x: parallaxX1, y: parallaxY1,
              background: 'radial-gradient(circle, hsl(250 85% 65% / 0.3) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
            animate={{
              scale: [1, 1.2, 0.9, 1.1, 1],
              opacity: [0.3, 0.5, 0.25, 0.4, 0.3],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute w-[400px] h-[400px] rounded-full pointer-events-none z-[1]"
            style={{
              bottom: '15%', right: '5%',
              x: parallaxX2, y: parallaxY2,
              background: 'radial-gradient(circle, hsl(165 82% 51% / 0.25) 0%, transparent 70%)',
              filter: 'blur(80px)',
            }}
            animate={{
              scale: [1, 0.85, 1.15, 0.95, 1],
              opacity: [0.2, 0.35, 0.15, 0.3, 0.2],
            }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute w-[200px] h-[200px] rounded-full pointer-events-none z-[1]"
            style={{
              top: '45%', right: '25%',
              x: parallaxX3, y: parallaxY3,
              background: 'radial-gradient(circle, hsl(330 90% 65% / 0.2) 0%, transparent 70%)',
              filter: 'blur(50px)',
            }}
            animate={{
              scale: [1, 1.3, 0.8, 1.1, 1],
              opacity: [0.15, 0.3, 0.1, 0.25, 0.15],
            }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}



      {/* ═══ LAYER 3: Mouse-following spotlight ═══ */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full pointer-events-none z-[2] hidden sm:block"
        style={{
          left: useTransform(springMX, [0, 1], ['0%', '100%']),
          top: useTransform(springMY, [0, 1], ['0%', '100%']),
          x: '-50%', y: '-50%',
          background: 'radial-gradient(circle, hsl(250 85% 70% / 0.06) 0%, transparent 60%)',
          filter: 'blur(30px)',
        }}
      />



      {/* ═══ APP DOCK CENTRAL ═══ */}
      <AppDock 
        isAdmin={isAdmin}
        isUploadingBanner={isUploadingBanner}
        userRole={userRole}
        isAnyStoreOpen={isAnyStoreOpen}
        activeStoresCount={activeStoresCount}
        onOpenSolicitation={onOpenSolicitation}
        onOpenStoreCreation={onOpenStoreCreation}
        onBannerUpload={onBannerUpload}
      />

      {/* ═══ ADMIN: Lock Button ═══ */}
      <AnimatePresence>
        {isAdmin && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onToggleLock}
            className={cn(
              "absolute top-4 right-4 z-[50] w-12 h-12 rounded-[18px] flex items-center justify-center transition-all duration-500 shadow-2xl backdrop-blur-xl border-2",
              isLocked
                ? "bg-slate-900 text-primary border-primary"
                : "bg-white/10 text-white/40 border-white/10 hover:bg-white/20"
            )}
          >
            <motion.div animate={isLocked ? { rotate: [0, -10, 10, 0] } : {}}>
              {isLocked ? <Lock className="w-5 h-5 animate-pulse" /> : <Unlock className="w-5 h-5" />}
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ═══ Social Proof (Bottom Left) ═══ */}
      <SocialProofWidget recentOrders={recentOrders} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   APP DOCK CENTRAL — Interfaz Principal Unificada
   ═══════════════════════════════════════════════════════════════ */

function AppDock({
  isAdmin, isUploadingBanner, userRole, isAnyStoreOpen, activeStoresCount, onOpenSolicitation, onOpenStoreCreation, onBannerUpload
}: {
  isAdmin?: boolean;
  isUploadingBanner?: boolean;
  userRole?: string;
  isAnyStoreOpen: boolean;
  activeStoresCount?: number;
  onOpenSolicitation: () => void;
  onOpenStoreCreation: () => void;
  onBannerUpload?: (e: React.ChangeEvent<HTMLInputElement>, target: 'mobile' | 'pc') => void;
}) {
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
      
      {/* Badge Tiendas Activas */}
      <AnimatePresence>
        {isAnyStoreOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm flex items-center gap-2 shadow-glow-emerald"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider overflow-hidden whitespace-nowrap text-ellipsis max-w-[200px]">
              {activeStoresCount === 1 ? '1 Tienda Activa Ahora' : `${activeStoresCount || 0} Tiendas Activas Ahora`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tira Principal estilo Dock macOS / iOS */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
        className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-3 rounded-[32px] bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] glass-rim-light"
      >
        {/* Izquierda: Categorías (y Admin Móvil) */}
        {isAdmin && onBannerUpload && (
          <div className="shrink-0 relative group/btn">
            <input type="file" ref={mobileInputRef} className="hidden" accept="image/*" onChange={(e) => onBannerUpload(e, 'mobile')} />
            <motion.button 
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.15)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => mobileInputRef.current?.click()} 
              disabled={isUploadingBanner} 
              className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/70 hover:text-primary transition-colors focus:outline-none"
            >
              {isUploadingBanner ? <Loader2 className="w-5 h-5 animate-spin" /> : <Smartphone className="w-5 h-5" />}
            </motion.button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900/90 text-[10px] font-bold text-white rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none border border-white/10 whitespace-nowrap">
              Móvil
            </div>
          </div>
        )}
        <Link href="/categories/category-washer" className="shrink-0">
          <motion.div
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.15)' }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            <LayoutGrid className="w-5 h-5" />
          </motion.div>
        </Link>
        
        {/* Centro: Solicitar Ahora */}
        <div className="mx-1 sm:mx-4 shrink-0 relative flex items-center justify-center">
          <HolographicCTA isOpen={isAnyStoreOpen} onClick={onOpenSolicitation} />
        </div>

        {/* Derecha: Crear Tienda / Mi Negocio */}
        <button onClick={onOpenStoreCreation} className="shrink-0">
          <motion.div
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.15)' }}
            whileTap={{ scale: 0.95 }}
            className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/70 hover:text-emerald-400 transition-colors group"
          >
            <StoreIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </motion.div>
        </button>

        {/* Derecha Extrema: Admin PC */}
        {isAdmin && onBannerUpload && (
          <div className="shrink-0 relative group/btn">
            <input type="file" ref={desktopInputRef} className="hidden" accept="image/*" onChange={(e) => onBannerUpload(e, 'pc')} />
            <motion.button 
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.15)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => desktopInputRef.current?.click()} 
              disabled={isUploadingBanner} 
              className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/70 hover:text-secondary transition-colors focus:outline-none"
            >
              {isUploadingBanner ? <Loader2 className="w-5 h-5 animate-spin" /> : <Monitor className="w-5 h-5" />}
            </motion.button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900/90 text-[10px] font-bold text-white rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none border border-white/10 whitespace-nowrap">
              PC
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HOLOGRAPHIC CTA — Botón central del Dock
   ═══════════════════════════════════════════════════════════════ */

function HolographicCTA({
  isOpen, onClick,
}: {
  isOpen: boolean; onClick: () => void;
}) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.4 }}
      onClick={() => isOpen && onClick()}
      className="relative cursor-pointer flex items-center justify-center z-50 group/cta"
    >
      {/* Ripple rings */}
      {isOpen && (
        <div className="absolute inset-0 rounded-full bg-red-500/40 animate-ping scale-[1.3] [animation-duration:2500ms] pointer-events-none" />
      )}

      {/* Button body */}
      <motion.div
        whileHover={isOpen ? { scale: 1.05 } : {}}
        whileTap={isOpen ? { scale: 0.95 } : {}}
        className={cn(
          "relative z-10 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full font-black text-[13px] sm:text-[15px] uppercase italic tracking-tighter flex items-center gap-2 sm:gap-3 shadow-[0_10px_30px_rgba(220,38,38,0.4)] transition-all duration-500",
          isOpen
            ? "bg-red-600/70 glass-rim-light hover:bg-red-600/90 backdrop-blur-xl border border-red-400/30"
            : "bg-slate-800/80 backdrop-blur-xl border border-white/10 grayscale opacity-60 shadow-none"
        )}
      >
        <span className="relative z-10 flex items-center gap-2 sm:gap-3">
          {isOpen ? (
            <>
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-white animate-pulse" />
              <span>SOLICITAR <span className="hidden sm:inline">AHORA</span></span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              <span>CERRADO</span>
            </>
          )}
        </span>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SOCIAL PROOF WIDGET — Dynamic Real Feed
   ═══════════════════════════════════════════════════════════════ */

function SocialProofWidget({ recentOrders }: { recentOrders?: any[] }) {
  const [isVisible, setIsVisible] = useState(false);
  const [data, setData] = useState({ name: 'Carlos P.', time: 'hace 2 min', type: 'Semiautomática' });

  useEffect(() => {
    // Si no hay ordenes recientes extraidas del backend, no lo enseñamos aún.
    if (!recentOrders || recentOrders.length === 0) return;

    const displayRandomOrder = () => {
      // Elegir aleatoriamente entre los primeros 15 más recientes
      const o = recentOrders[Math.floor(Math.random() * recentOrders.length)];
      
      let timeString = 'justo ahora';
      if (o.createdAt?.seconds) {
        const diffInSeconds = Math.floor(Date.now() / 1000) - o.createdAt.seconds;
        const mins = Math.floor(diffInSeconds / 60);
        if (mins > 0 && mins < 60) timeString = `hace ${mins} min`;
        else if (mins >= 60 && mins < 1440) timeString = `hace ${Math.floor(mins / 60)}h`;
        else if (mins >= 1440) timeString = `hace ${Math.floor(mins / 1440)}d`;
      }

      let firstName = 'Usuario';
      let initial = '';
      if (o.customerName) {
        const parts = o.customerName.split(' ');
        firstName = parts[0];
        if (parts.length > 1) initial = parts[1][0] + '.';
      }

      setData({
        name: `${firstName} ${initial}`,
        time: timeString,
        type: o.washerType === 'automatica' ? 'Automática' : 'Semiautomática'
      });
      setIsVisible(true);
      setTimeout(() => setIsVisible(false), 6000);
    };

    const timer1 = setTimeout(() => displayRandomOrder(), 5000);
    const interval = setInterval(() => displayRandomOrder(), 25000);

    return () => {
      clearTimeout(timer1);
      clearInterval(interval);
    }
  }, [recentOrders]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -50, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="absolute bottom-6 left-6 z-[60] flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-depth-md glass-rim-light"
        >
          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary relative overflow-hidden">
             <div className="absolute inset-0 bg-primary/10 animate-pulse" />
             <UserCheck className="w-5 h-5 relative z-10" />
          </div>
          <div className="flex flex-col">
            <span className="text-white text-xs font-semibold">Alquiler exitoso</span>
            <span className="text-white/60 text-[10px] leading-tight">{data.name} pidió una {data.type}<br/>{data.time}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}