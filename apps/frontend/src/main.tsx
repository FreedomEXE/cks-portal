import '@cks/ui/styles/globals.css';
import '@cks/ui/assets/ui.css';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react';
import { SWRConfig } from 'swr';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthenticatedApp, UnauthenticatedApp } from './App';
import { LoadingProvider } from './contexts/LoadingContext';
import { API_BASE } from './shared/api/client';
import GlobalLoader from './components/GlobalLoader';
import { CartProvider } from './contexts/CartContext';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { HubLoadingProvider } from './contexts/HubLoadingContext';

// Read the Clerk publishable key from Vite env. Do not hardcode or fall back to a dummy key.
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
const DEV_AUTH_ENABLED = ((import.meta as any).env?.VITE_CKS_ENABLE_DEV_AUTH ?? 'false') === 'true' && !import.meta.env.PROD;
const DEV_AUTH_EVENT = 'cks:dev-auth-changed';
if (!PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY. Define it in frontend/.env or .env.local and restart the dev server.');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element with id "root" not found');
}

const root = ReactDOM.createRoot(rootElement);

// Expose API base for shared UI package components (e.g., HistoryTab)
try { (window as any).__CKS_API_BASE = API_BASE; } catch {}

function hasDevAuthSession(): boolean {
  if (!DEV_AUTH_ENABLED || typeof window === 'undefined') {
    return false;
  }
  return Boolean(window.sessionStorage?.getItem('cks_dev_role'));
}

function AppRouterGate() {
  const [devSessionActive, setDevSessionActive] = useState(() => hasDevAuthSession());

  useEffect(() => {
    if (!DEV_AUTH_ENABLED || typeof window === 'undefined') {
      return;
    }

    const sync = () => setDevSessionActive(hasDevAuthSession());
    window.addEventListener(DEV_AUTH_EVENT, sync);
    window.addEventListener('storage', sync);
    sync();

    return () => {
      window.removeEventListener(DEV_AUTH_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  if (devSessionActive) {
    return <AuthenticatedApp />;
  }

  return (
    <>
      <SignedIn>
        <AuthenticatedApp />
      </SignedIn>
      <SignedOut>
        <UnauthenticatedApp />
      </SignedOut>
    </>
  );
}

root.render(
  <React.StrictMode>
    <ThemeProvider>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      // Keep only routing entry points; handle post-auth redirects in app/login logic
      signInUrl={(import.meta as any).env?.VITE_CLERK_SIGN_IN_URL || '/login'}
      signUpUrl={(import.meta as any).env?.VITE_CLERK_SIGN_UP_URL || '/login'}
    >
        <HubLoadingProvider>
          <SWRConfig
            value={{
              provider: () => new Map(),
              onErrorRetry: (err, _key, config, revalidate, opts) => {
                const status = (err as any)?.status;
                if (status === 401 || status === 403) return;
                if ((opts.retryCount ?? 0) >= 2) return;
                const delay = Math.min(5000, 1000 * Math.pow(2, opts.retryCount ?? 0));
                setTimeout(() => revalidate({ retryCount: (opts.retryCount ?? 0) + 1 }), delay);
              },
            }}
          >
            <LoadingProvider>
              <CartProvider>
                <BrowserRouter>
                  <AppRouterGate />
                </BrowserRouter>
                <GlobalLoader />
              </CartProvider>
            </LoadingProvider>
          </SWRConfig>
        </HubLoadingProvider>
      </ClerkProvider>
    </ThemeProvider>
  </React.StrictMode>
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('[PWA] Service worker registration failed', error);
    });
  });
}
