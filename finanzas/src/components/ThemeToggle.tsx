'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useMagneticHover } from '@/hooks/use-gsap';

export function ThemeToggle() {
  const { theme, toggleTheme, hasUserPreference } = useTheme();
  const ref = useMagneticHover<HTMLButtonElement>(0.25);

  return (
    <motion.button
      ref={ref}
      onClick={toggleTheme}
      whileTap={{ scale: 0.9 }}
      className="relative w-12 h-12 rounded-full glass-strong shadow-glow flex items-center justify-center group overflow-hidden"
      aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={hasUserPreference ? `Tema: ${theme === 'dark' ? 'Oscuro' : 'Claro'} (tu elección)` : `Tema: ${theme === 'dark' ? 'Oscuro' : 'Claro'} (default)`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === 'light' ? (
          <motion.div
            key="sun"
            initial={{ rotate: -180, scale: 0, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 180, scale: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'backOut' }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Sun className="w-5 h-5 text-amber-500 group-hover:text-amber-400 transition-colors" strokeWidth={2.5} />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 180, scale: 0, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: -180, scale: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'backOut' }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Moon className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300 transition-colors" strokeWidth={2.5} />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute inset-0 rounded-full ring-1 ring-foreground/10 group-hover:ring-foreground/30 transition-all" />
    </motion.button>
  );
}
