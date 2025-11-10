import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

type ThemeCtx = { theme: Theme; setTheme: (t: Theme) => void };
const Ctx = createContext<ThemeCtx | null>(null);

function getSystemPrefersDark(): boolean {
  try { return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; } catch { return false; }
}

function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  const dark = theme === 'dark' || (theme === 'system' && getSystemPrefersDark());
  root.classList.toggle('dark', dark);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<Theme>(() => {
    try { return (localStorage.getItem('cks_theme') as Theme) || 'light'; } catch { return 'light'; }
  });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => { if (mounted) applyThemeClass(theme); }, [mounted, theme]);

  useEffect(() => {
    if (!mounted) return;
    try { localStorage.setItem('cks_theme', theme); } catch {}
  }, [mounted, theme]);

  // React to system changes when in system mode
  useEffect(() => {
    if (theme !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyThemeClass('system');
    try { mql.addEventListener('change', handler); } catch { mql.addListener(handler); }
    return () => { try { mql.removeEventListener('change', handler); } catch { mql.removeListener(handler); } };
  }, [theme]);

  const value = useMemo<ThemeCtx>(() => ({ theme, setTheme: (t) => setThemeState(t) }), [theme]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Fallback to prevent runtime crashes if a consumer renders before
    // ThemeProvider is mounted (e.g., during auth boundary transitions).
    return { theme: 'light', setTheme: () => undefined };
  }
  return ctx;
}
