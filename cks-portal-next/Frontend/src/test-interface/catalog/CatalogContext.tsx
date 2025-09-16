/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: CatalogContext.tsx
 *
 * Description:
 * Test catalog context for component testing
 *
 * Responsibilities:
 * - Provide test catalog context
 * - Enable component catalog functionality in test environment
 *
 * Role in system:
 * - Used by test interface for component catalog testing
 *
 * Notes:
 * Test implementation for component catalog context
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/

import React, { createContext, useContext, ReactNode } from 'react';

interface CatalogContextType {
  components: Record<string, React.ComponentType<any>>;
  registerComponent: (name: string, component: React.ComponentType<any>) => void;
  getComponent: (name: string) => React.ComponentType<any> | null;
}

const CatalogContext = createContext<CatalogContextType | null>(null);

interface CatalogProviderProps {
  children: ReactNode;
}

export function CatalogProvider({ children }: CatalogProviderProps) {
  const [components, setComponents] = React.useState<Record<string, React.ComponentType<any>>>({});

  const registerComponent = (name: string, component: React.ComponentType<any>) => {
    setComponents(prev => ({ ...prev, [name]: component }));
  };

  const getComponent = (name: string) => {
    return components[name] || null;
  };

  return (
    <CatalogContext.Provider value={{ components, registerComponent, getComponent }}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
}

export default CatalogContext;