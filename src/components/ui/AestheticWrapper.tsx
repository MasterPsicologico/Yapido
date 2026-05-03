"use client";

import { ReactNode, useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  useAnimationFrame,
  type Variants,
  AnimatePresence,
} from 'framer-motion';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════
   AESTHETIC WRAPPER — Pro Version with Framer Motion Physics
   ═══════════════════════════════════════════════════════════════ */

interface AestheticWrapperProps {
  children: ReactNode;
  className?: string;
  variant?: 'aurora' | 'mesh' | 'glass' | 'holo';
  particles?: boolean;
  delay?: number;
  noAnimation?: boolean;
  /** Enable mouse-reactive ambient lighting */
  mouseGlow?: boolean;
}

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(6px)' },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.8,
      delay,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

export function AestheticWrapper({
  children,
  className,
  variant = 'glass',
  particles = false,
  delay = 0,
  noAnimation = false,
  mouseGlow = false,
}: AestheticWrapperProps) {
  const variantClasses: Record<string, string> = {
    aurora: 'aurora',
    mesh: 'mesh-gradient-bg',
    glass: 'glass',
    holo: 'glass holo-border holo-shimmer',
  };

  const Wrapper = noAnimation ? 'div' : motion.div;
  const motionProps = noAnimation
    ? {}
    : {
        variants: containerVariants,
        initial: 'hidden',
        whileInView: 'visible',
        viewport: { once: true, margin: '-50px' },
        custom: delay,
      };

  return (
    <Wrapper
      className={cn(
        'relative overflow-hidden rounded-4xl',
        variantClasses[variant],
        className
      )}
      {...(motionProps as any)}
    >
      {particles && <MotionParticleField />}
      {mouseGlow && <MouseReactiveGlow />}
      <div className="relative z-10">{children}</div>
    </Wrapper>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FRAMER MOTION PARTICLE FIELD — Physics-Based
   Each particle has randomized physics: gravity, drift, opacity
   ═══════════════════════════════════════════════════════════════ */

interface Particle {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  color: string;
}

function MotionParticleField() {
  const particles = useMemo<Particle[]>(() => {
    const colors = [
      'rgba(139, 92, 246, 0.6)',   // violet
      'rgba(52, 211, 153, 0.5)',   // emerald
      'rgba(244, 114, 182, 0.4)',  // rose
      'rgba(251, 191, 36, 0.3)',   // amber
      'rgba(255, 255, 255, 0.5)',  // white
    ];

    return Array.from({ length: 16 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 3 + 1.5,
      duration: Math.random() * 12 + 10,
      delay: Math.random() * 8,
      drift: (Math.random() - 0.5) * 60,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]" aria-hidden="true">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            bottom: '-5%',
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }}
          animate={{
            y: [0, '-110vh'],
            x: [0, p.drift, -p.drift * 0.5, p.drift * 0.3],
            opacity: [0, 0.8, 0.5, 0.7, 0],
            scale: [0, 1, 0.8, 1.1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MOUSE-REACTIVE GLOW — Follows cursor with spring physics
   ═══════════════════════════════════════════════════════════════ */

function MouseReactiveGlow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(50);
  const mouseY = useMotionValue(50);

  const springX = useSpring(mouseX, { stiffness: 50, damping: 20, mass: 0.5 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20, mass: 0.5 });

  const handleMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const parent = (e.currentTarget as HTMLElement).parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      mouseX.set(((clientX - rect.left) / rect.width) * 100);
      mouseY.set(((clientY - rect.top) / rect.height) * 100);
    },
    [mouseX, mouseY]
  );

  return (
    <motion.div
      ref={containerRef}
      className="absolute inset-0 z-[2] pointer-events-auto"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
      style={{ cursor: 'default' }}
    >
      <motion.div
        className="absolute w-64 h-64 rounded-full pointer-events-none"
        style={{
          left: springX,
          top: springY,
          x: '-50%',
          y: '-50%',
          background:
            'radial-gradient(circle, hsl(250 85% 65% / 0.2) 0%, hsl(165 82% 51% / 0.08) 40%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REVEAL SECTION — Scroll-triggered entrance with stagger
   ═══════════════════════════════════════════════════════════════ */

export function RevealSection({
  children,
  className,
  delay = 0,
  direction = 'up',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}) {
  const offsets = {
    up: { y: 50, x: 0 },
    down: { y: -50, x: 0 },
    left: { y: 0, x: 50 },
    right: { y: 0, x: -50 },
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: offsets[direction].y,
        x: offsets[direction].x,
        filter: 'blur(8px)',
        scale: 0.97,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        x: 0,
        filter: 'blur(0px)',
        scale: 1,
      }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{
        duration: 0.9,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={cn('relative', className)}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STAGGER CONTAINER — Orchestrates children entrance
   ═══════════════════════════════════════════════════════════════ */

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(6px)', scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

export function StaggerGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerChild} className={className}>
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAGNETIC BUTTON — Pulls toward cursor on hover
   ═══════════════════════════════════════════════════════════════ */

export function MagneticElement({
  children,
  className,
  strength = 0.3,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  const handleMouse = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      x.set((e.clientX - centerX) * strength);
      y.set((e.clientY - centerY) * strength);
    },
    [x, y, strength]
  );

  const handleLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      className={cn('inline-block', className)}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TILT CARD — 3D perspective tilt on hover
   ═══════════════════════════════════════════════════════════════ */

export function TiltCard({
  children,
  className,
  maxTilt = 12,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);

  const springRotateX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const springRotateY = useSpring(rotateY, { stiffness: 200, damping: 20 });

  const handleMouse = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const xPercent = (e.clientX - rect.left) / rect.width;
      const yPercent = (e.clientY - rect.top) / rect.height;
      rotateX.set((yPercent - 0.5) * -maxTilt * 2);
      rotateY.set((xPercent - 0.5) * maxTilt * 2);
      glareX.set(xPercent * 100);
      glareY.set(yPercent * 100);
    },
    [rotateX, rotateY, glareX, glareY, maxTilt]
  );

  const handleLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

  return (
    <div style={{ perspective: 800 }} className="inline-block">
      <motion.div
        ref={ref}
        className={cn('relative', className)}
        style={{
          rotateX: springRotateX,
          rotateY: springRotateY,
          transformStyle: 'preserve-3d',
        }}
        onMouseMove={handleMouse}
        onMouseLeave={handleLeave}
        whileHover={{ scale: 1.02 }}
        transition={{ scale: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}
      >
        {children}
        {glare && (
          <motion.div
            className="absolute inset-0 rounded-inherit pointer-events-none z-20"
            style={{
              background: useTransform(
                [glareX, glareY],
                ([gx, gy]) =>
                  `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.12) 0%, transparent 60%)`
              ),
              borderRadius: 'inherit',
            }}
          />
        )}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GLOW ORB — Decorative ambient light with Framer Motion
   ═══════════════════════════════════════════════════════════════ */

export function GlowOrb({
  color = 'violet',
  size = 'md',
  className,
  animated = true,
}: {
  color?: 'violet' | 'emerald' | 'rose' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animated?: boolean;
}) {
  const colorMap = {
    violet: 'hsl(250, 85%, 65%)',
    emerald: 'hsl(165, 82%, 51%)',
    rose: 'hsl(330, 90%, 65%)',
    amber: 'hsl(38, 92%, 60%)',
  };

  const sizeMap = { sm: 128, md: 256, lg: 384 };
  const s = sizeMap[size];

  if (!animated) {
    return (
      <div
        className={cn('absolute rounded-full opacity-20 pointer-events-none', className)}
        style={{
          width: s,
          height: s,
          background: colorMap[color],
          filter: 'blur(80px)',
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    <motion.div
      className={cn('absolute rounded-full pointer-events-none', className)}
      style={{
        width: s,
        height: s,
        background: colorMap[color],
        filter: 'blur(80px)',
      }}
      animate={{
        x: [0, 30, -20, 15, 0],
        y: [0, -25, 10, -15, 0],
        scale: [1, 1.15, 0.9, 1.05, 1],
        opacity: [0.15, 0.25, 0.12, 0.2, 0.15],
      }}
      transition={{
        duration: 20 + Math.random() * 10,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      aria-hidden="true"
    />
  );
}

/* ═══════════════════════════════════════════════════════════════
   TEXT SCRAMBLE — Cyber text reveal effect
   ═══════════════════════════════════════════════════════════════ */

export function TextScramble({
  text,
  className,
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  const [displayed, setDisplayed] = useState('');
  const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`░▒▓█▀▄';

  useEffect(() => {
    let frame = 0;
    const totalFrames = text.length * 3;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        const resolved = Math.floor(progress * text.length);

        let result = '';
        for (let i = 0; i < text.length; i++) {
          if (i < resolved) {
            result += text[i];
          } else if (i === resolved) {
            result += chars[Math.floor(Math.random() * chars.length)];
          } else {
            result += text[i] === ' ' ? ' ' : chars[Math.floor(Math.random() * chars.length)];
          }
        }
        setDisplayed(result);

        if (frame >= totalFrames) {
          setDisplayed(text);
          clearInterval(interval);
        }
      }, 35);

      return () => clearInterval(interval);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [text, delay]);

  return (
    <motion.span
      className={cn('font-mono', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay }}
    >
      {displayed || text}
    </motion.span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COUNTER — Animated number counting
   ═══════════════════════════════════════════════════════════════ */

export function AnimatedCounter({
  value,
  className,
  duration = 2,
  prefix = '',
  suffix = '',
}: {
  value: number;
  className?: string;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 50,
    damping: 20,
    duration: duration * 1000,
  });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (v) => {
      setDisplay(Math.round(v));
    });
    return unsubscribe;
  }, [springValue]);

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {prefix}{display.toLocaleString()}{suffix}
    </motion.span>
  );
}
