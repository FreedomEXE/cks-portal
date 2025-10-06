import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import styles from './ModalRoot.module.css';
import PixelField from './PixelField';

export interface ModalRootProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

// Track how many modals are open to manage body class safely
let openModalCount = 0;

function addBodyOpenClass() {
  try {
    if (typeof document === 'undefined') return;
    if (openModalCount === 0) {
      document.body.classList.add('modal-open');
    }
    openModalCount += 1;
  } catch {}
}

function removeBodyOpenClass() {
  try {
    if (typeof document === 'undefined') return;
    openModalCount = Math.max(0, openModalCount - 1);
    if (openModalCount === 0) {
      document.body.classList.remove('modal-open');
    }
  } catch {}
}

export default function ModalRoot({
  isOpen,
  onClose,
  children,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: ModalRootProps) {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<'entering' | 'entered' | 'exiting'>('entering');
  const countedRef = useRef(false);
  const exitTimeoutRef = useRef<number | null>(null);

  // Portal target
  const portalElRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return;
    portalElRef.current = document.body;
  }, []);

  // Mount/unmount logic with presence for exit animation
  useEffect(() => {
    if (!isOpen) {
      // trigger exit if currently entered
      if (mounted) {
        setState('exiting');
        if (exitTimeoutRef.current) window.clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = window.setTimeout(() => {
          setMounted(false);
          if (countedRef.current) {
            countedRef.current = false;
            removeBodyOpenClass();
          }
        }, 180); // exit duration
      }
      return;
    }

    // show and enter
    setMounted(true);
    // next frame to allow CSS transition
    const id = window.requestAnimationFrame(() => {
      setState('entering');
      // count body class once per open sequence
      if (!countedRef.current) {
        countedRef.current = true;
        addBodyOpenClass();
      }
      // move to entered after duration
      if (exitTimeoutRef.current) window.clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = window.setTimeout(() => {
        setState('entered');
      }, 20); // tiny delay so entering state applies then transitions to entered
    });
    return () => window.cancelAnimationFrame(id);
  }, [isOpen, mounted]);

  // Escape key to close
  useEffect(() => {
    if (!closeOnEscape || !mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true } as any);
  }, [closeOnEscape, mounted, onClose]);

  // Cleanup on unmount (safety net)
  useEffect(() => {
    return () => {
      if (exitTimeoutRef.current) window.clearTimeout(exitTimeoutRef.current);
      if (countedRef.current) {
        countedRef.current = false;
        removeBodyOpenClass();
      }
    };
  }, []);

  if (!mounted || !portalElRef.current) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (!closeOnOverlayClick) return;
    e.stopPropagation();
    onClose();
  };

  const node = (
    <div className={styles.root} aria-hidden={!isOpen}>
      <div
        className={styles.overlay}
        data-state={state}
        onClick={handleOverlayClick}
        aria-hidden
      />
      {/* Animated pixel field (above overlay, below content) */}
      <div className={styles.grid} data-state={state} aria-hidden>
        <PixelField active={state !== 'exiting'} />
      </div>
      <div className={styles.content} data-state={state}>
        <div className={styles.box}>{children}</div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(node, portalElRef.current);
}
