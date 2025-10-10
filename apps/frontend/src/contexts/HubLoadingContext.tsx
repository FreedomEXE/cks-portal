import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';

type HubLoadingContextType = {
  isHubLoading: boolean;
  setHubLoading: (loading: boolean) => void;
};

const HubLoadingContext = createContext<HubLoadingContextType | null>(null);

const MAX_LOAD_TIME = 15000; // 15 seconds max before auto-reload

export function HubLoadingProvider({ children }: { children: ReactNode }) {
  const [isHubLoading, setIsHubLoading] = useState(true);
  const timeoutRef = useRef<number | null>(null);
  const hasReloadedRef = useRef(false);

  const setHubLoading = useCallback((loading: boolean) => {
    console.log('[HubLoadingContext] Hub loading state changed:', loading);
    setIsHubLoading(loading);

    // Clear timeout when loading completes successfully
    if (!loading && timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Failsafe: if hub doesn't load within MAX_LOAD_TIME, reload the page
  useEffect(() => {
    if (isHubLoading && !timeoutRef.current && !hasReloadedRef.current) {
      console.log('[HubLoadingContext] Starting failsafe timer - will reload if hub doesn\'t load within', MAX_LOAD_TIME, 'ms');

      timeoutRef.current = window.setTimeout(() => {
        const reloadKey = 'cks_hub_auto_reload';
        const lastReload = sessionStorage.getItem(reloadKey);
        const now = Date.now();

        // Only reload once per session
        if (!lastReload || (now - parseInt(lastReload)) > 60000) {
          console.warn('[HubLoadingContext] Hub failed to load within time limit, reloading page...');
          sessionStorage.setItem(reloadKey, now.toString());
          hasReloadedRef.current = true;
          window.location.reload();
        } else {
          console.error('[HubLoadingContext] Hub failed to load and already reloaded recently. Please check the backend.');
          setIsHubLoading(false); // Give up and show whatever we have
        }
      }, MAX_LOAD_TIME);
    }

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isHubLoading]);

  return (
    <HubLoadingContext.Provider value={{ isHubLoading, setHubLoading }}>
      {children}
    </HubLoadingContext.Provider>
  );
}

export function useHubLoading() {
  const context = useContext(HubLoadingContext);
  if (!context) {
    throw new Error('useHubLoading must be used within HubLoadingProvider');
  }
  return context;
}
