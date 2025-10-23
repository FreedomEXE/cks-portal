/**
 * Test Providers Wrapper - Wraps components with all required providers
 *
 * Prevents "useX must be used within XProvider" errors in tests.
 * Provides safe defaults for all context providers used in the app.
 *
 * Usage:
 *   import { ProvidersWrapper } from './tests/renderWithProviders';
 *
 *   const html = renderToString(
 *     <ProvidersWrapper route="/hub" currentUserId="TEST-ADMIN" role="admin">
 *       <App />
 *     </ProvidersWrapper>
 *   );
 */

import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { SWRConfig } from 'swr';
import { LoadingProvider } from '../contexts/LoadingContext';
import { HubLoadingProvider } from '../contexts/HubLoadingContext';
import { ModalProvider } from '../contexts/ModalProvider';

interface TestProvidersOptions {
  route?: string;
  currentUserId?: string;
  role?: 'admin' | 'manager' | 'contractor' | 'customer' | 'warehouse' | 'center' | 'crew';
}

interface AllProvidersProps {
  children: React.ReactNode;
  options?: TestProvidersOptions;
}

/**
 * All Providers Wrapper
 * Wraps children with all app providers in correct nesting order
 */
function AllProviders({ children, options = {} }: AllProvidersProps) {
  const {
    route = '/',
    currentUserId = 'TEST-ADMIN',
    role = 'admin'
  } = options;

  return (
    <SWRConfig
      value={{
        provider: () => new Map(),
        revalidateOnFocus: false,
        dedupingInterval: 0,
      }}
    >
      <LoadingProvider>
        <HubLoadingProvider>
          <ModalProvider currentUserId={currentUserId} role={role}>
            <MemoryRouter initialEntries={[route]}>
              {children}
            </MemoryRouter>
          </ModalProvider>
        </HubLoadingProvider>
      </LoadingProvider>
    </SWRConfig>
  );
}

/**
 * Provider Wrapper Component (for renderToString)
 * Use this when you need to wrap components for SSR testing with renderToString
 *
 * Example:
 *   const html = renderToString(
 *     <ProvidersWrapper route="/hub" currentUserId="TEST-001" role="admin">
 *       <App />
 *     </ProvidersWrapper>
 *   );
 */
export function ProvidersWrapper({
  children,
  route = '/',
  currentUserId = 'TEST-ADMIN',
  role = 'admin'
}: {
  children: React.ReactNode;
  route?: string;
  currentUserId?: string;
  role?: 'admin' | 'manager' | 'contractor' | 'customer' | 'warehouse' | 'center' | 'crew';
}) {
  return (
    <AllProviders options={{ route, currentUserId, role }}>
      {children}
    </AllProviders>
  );
}

/**
 * Default test exports
 */
export { AllProviders };
