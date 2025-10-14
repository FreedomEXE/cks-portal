import React, { createContext, useCallback, useContext, useState } from 'react';
import { modalRegistry, ModalKey } from './modalRegistry';

type ModalState =
  | null
  | { key: ModalKey; payload: unknown };

type ModalContextValue = {
  open: (key: ModalKey, rawData: unknown) => void;
  close: () => void;
  currentModal: ModalState;
};

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [currentModal, setCurrentModal] = useState<ModalState>(null);

  const open = useCallback((key: ModalKey, rawData: unknown) => {
    const registryEntry = modalRegistry[key];
    if (!registryEntry) {
      console.error(`[ModalProvider] No modal registered for key: ${key}`);
      return;
    }

    // Transform raw data using fromRow if provided
    const payload = registryEntry.fromRow ? registryEntry.fromRow(rawData) : rawData;
    setCurrentModal({ key, payload });
  }, []);

  const close = useCallback(() => {
    setCurrentModal(null);
  }, []);

  return (
    <ModalContext.Provider value={{ open, close, currentModal }}>
      {children}
      <ModalRoot state={currentModal} close={close} />
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return ctx;
}

// Internal component that renders the active modal
function ModalRoot({ state, close }: { state: ModalState; close: () => void }) {
  if (!state) return null;

  const registryEntry = modalRegistry[state.key];
  if (!registryEntry) return null;

  const ModalComponent = registryEntry.Component as React.FC<any>;
  const payload = state.payload as any;

  // Ensure modal components receive the required visibility prop
  // Pass isOpen after spreading payload so it cannot be overridden by accident
  return <ModalComponent {...payload} isOpen={true} onClose={close} />;
}
