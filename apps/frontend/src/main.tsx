import '@cks/ui/styles/globals.css';
import '@cks/ui/assets/ui.css';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react';
import { SWRConfig } from 'swr';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthenticatedApp, UnauthenticatedApp } from './App';
import { LoadingProvider } from './contexts/LoadingContext';
import { API_BASE } from './shared/api/client';
import GlobalLoader from './components/GlobalLoader';
import { CartProvider } from './contexts/CartContext';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';

// Read the Clerk publishable key from Vite env. Do not hardcode or fall back to a dummy key.
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
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

root.render(
  <React.StrictMode>
    <ThemeProvider>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      signInUrl={(import.meta as any).env?.VITE_CLERK_SIGN_IN_URL || '/login'}
      signUpUrl={(import.meta as any).env?.VITE_CLERK_SIGN_UP_URL || '/login'}
      afterSignInUrl={(import.meta as any).env?.VITE_CLERK_AFTER_SIGN_IN_URL || '/hub'}
      afterSignUpUrl={(import.meta as any).env?.VITE_CLERK_AFTER_SIGN_UP_URL || '/hub'}
    >
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
                <SignedIn>
                  <AuthenticatedApp />
                </SignedIn>
                <SignedOut>
                  <UnauthenticatedApp />
                </SignedOut>
              </BrowserRouter>
              <GlobalLoader />
            </CartProvider>
          </LoadingProvider>
        </SWRConfig>
      </ClerkProvider>
    </ThemeProvider>
  </React.StrictMode>
);
