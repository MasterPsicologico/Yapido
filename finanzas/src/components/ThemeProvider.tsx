'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  hasUserPreference: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'finanzas-theme';
const USER_CHOICE_KEY = 'finanzas-theme-user-chose';

/**
 * ThemeProvider
 *
 * Reglas:
 * 1. LIGHT es el default siempre. El sitio arranca en light.
 * 2. Solo si el usuario hace click explícito en el toggle, se aplica dark.
 * 3. La elección se persiste en localStorage y se respeta en futuras visitas.
 * 4. NO se respeta `prefers-color-scheme` del sistema — esto es "opt-in" como pediste.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [hasUserPreference, setHasUserPreference] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const userChose = localStorage.getItem(USER_CHOICE_KEY) === 'true';
    if (userChose && stored) {
      setThemeState(stored);
      setHasUserPreference(true);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, mounted]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    setHasUserPreference(true);
    localStorage.setItem(STORAGE_KEY, t);
    localStorage.setItem(USER_CHOICE_KEY, 'true');
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, hasUserPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
