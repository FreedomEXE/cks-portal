import React, { createContext, useContext, useMemo, useState } from 'react';

export type CatalogParams = {
  type?: 'service' | 'product';
  category?: string;
  q?: string;
};

type Ctx = {
  open: (params?: CatalogParams) => void;
  close: () => void;
  visible: boolean;
  params: CatalogParams | null;
};

const CatalogCtx = createContext<Ctx | null>(null);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [params, setParams] = useState<CatalogParams | null>(null);

  const value = useMemo<Ctx>(() => ({
    open: (p?: CatalogParams) => { setParams(p || null); setVisible(true); },
    close: () => { setVisible(false); },
    visible,
    params,
  }), [visible, params]);

  return (
    <CatalogCtx.Provider value={value}>{children}</CatalogCtx.Provider>
  );
}

export function useCatalog() {
  const ctx = useContext(CatalogCtx);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
}

