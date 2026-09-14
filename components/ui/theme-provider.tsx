'use client';

import { createContext, useContext, useCallback, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'depth-study-theme';

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'dark',
  toggle: () => {},
});

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // storage unavailable (private mode) — theme still applies for session
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Initial Theme Resolution (Saved > System Preference > Dark Default)
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      saved = null;
    }
    const systemPrefersLight =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: light)').matches;

    const initialTheme: Theme =
      saved === 'light' || saved === 'dark' ? saved : systemPrefersLight ? 'light' : 'dark';

    setTheme(initialTheme);
    applyTheme(initialTheme);
    setMounted(true);

    // Sync across browser tabs
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const nextTheme: Theme = event.newValue === 'light' ? 'light' : 'dark';
      setTheme(nextTheme);
      applyTheme(nextTheme);
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {/* Prevent Layout Flash during SSR Hydration */}
      <div style={{ visibility: mounted ? 'visible' : 'hidden' }}>{children}</div>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);