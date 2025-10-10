import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as LoadingService from '../shared/loading';

type LoadingContextValue = {
  // Number of in-flight tracked operations
  count: number; // blocking requests only
  // Whether overlay should be visible (with debounce/min duration)
  visible: boolean;
  // Manually control loading for ad-hoc flows
  start: () => () => void;
  withLoader: <T>(p: Promise<T>) => Promise<T>;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

// UI timing to keep UX smooth
const SHOW_DELAY_MS = 300; // avoid flicker but feel responsive
const MIN_VISIBLE_MS = 300; // keep visible briefly once shown

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(() => LoadingService.getCounts().blocking);
  const [visible, setVisible] = useState(false);

  const showTimer = useRef<number | null>(null);
  const shownAt = useRef<number | null>(null);

  // Subscribe to global loading count (blocking only)
  useEffect(() => {
    return LoadingService.subscribe((counts) => setCount(counts.blocking));
  }, []);

  // Manage overlay visibility with delay and min duration
  useEffect(() => {
    // When requests start
    if (count > 0) {
      if (visible) return; // already visible
      if (showTimer.current != null) return; // already scheduled
      showTimer.current = window.setTimeout(() => {
        setVisible(true);
        shownAt.current = Date.now();
        showTimer.current = null;
      }, SHOW_DELAY_MS) as unknown as number;
      return;
    }

    // When requests end
    if (count === 0) {
      if (showTimer.current != null) {
        window.clearTimeout(showTimer.current);
        showTimer.current = null;
      }
      if (!visible) return; // nothing to hide
      const elapsed = shownAt.current ? Date.now() - shownAt.current : MIN_VISIBLE_MS;
      if (elapsed >= MIN_VISIBLE_MS) {
        setVisible(false);
        shownAt.current = null;
      } else {
        const remaining = MIN_VISIBLE_MS - elapsed;
        const t = window.setTimeout(() => {
          setVisible(false);
          shownAt.current = null;
        }, remaining) as unknown as number;
        return () => window.clearTimeout(t);
      }
    }
  }, [count, visible]);

  // Watchdog: if overlay remains visible for too long, perform a hard reload once.
  useEffect(() => {
    const env = (import.meta as any).env ?? {};
    const enable = String(env.VITE_LOADER_ENABLE_AUTO_RELOAD ?? 'true') === 'true';
    const hardMs = Number(env.VITE_LOADER_HARD_RELOAD_MS || '45000');
    if (!enable || !visible || count <= 0) return;

    const start = shownAt.current ?? Date.now();
    const t = window.setInterval(() => {
      const elapsed = Date.now() - start;
      if (elapsed >= hardMs) {
        window.clearInterval(t);
        try {
          const key = 'cks_loader_auto_reloaded';
          if (window.sessionStorage.getItem(key) === '1') return;
          window.sessionStorage.setItem(key, '1');
        } catch {}
        try { console.warn('[LoadingProvider] Hard reload after prolonged stall'); } catch {}
        window.location.reload();
      }
    }, 1000) as unknown as number;
    return () => window.clearInterval(t);
  }, [visible, count]);

  // Public API starts BLOCKING loaders so overlay appears only for explicit blockers
  const start = useCallback(() => LoadingService.startBlocking(), []);
  const withLoader = useCallback(<T,>(p: Promise<T>) => LoadingService.wrapBlocking(p), []);

  const value = useMemo<LoadingContextValue>(
    () => ({ count, visible, start, withLoader }),
    [count, visible, start, withLoader]
  );

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
}

export function useLoading(): LoadingContextValue {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useLoading must be used within LoadingProvider');
  return ctx;
}
