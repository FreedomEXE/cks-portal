import React, { useEffect, useLayoutEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
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
  const countedRef = useRef(false);

  // Portal target
  const portalElRef = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (typeof document === 'undefined') return;
    portalElRef.current = document.body;
  }, []);

  // Manage body class while open
  useEffect(() => {
    if (!isOpen) return;
    if (!countedRef.current) {
      countedRef.current = true;
      addBodyOpenClass();
    }
    return () => {
      // If closed before animation completes, ensure body class is adjusted
      if (countedRef.current) {
        countedRef.current = false;
        removeBodyOpenClass();
      }
    };
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true } as any);
  }, [closeOnEscape, isOpen, onClose]);

  if (!portalElRef.current) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (!closeOnOverlayClick) return;
    e.stopPropagation();
    onClose();
  };

  const prefersReduced = typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const node = (
    <AnimatePresence
      mode="wait"
      onExitComplete={() => {
        // Exit finished: remove body-open if we added it
        if (countedRef.current) {
          countedRef.current = false;
          removeBodyOpenClass();
        }
      }}
    >
      {isOpen && (
        <div className={styles.root} aria-hidden={!isOpen}>
          {/* Backdrop */}
          <motion.div
            className={styles.overlay}
            onClick={handleOverlayClick}
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.3 }}
          />

          {/* Optional animated grid layer */}
          <motion.div
            className={styles.grid}
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.3 }}
          >
            <PixelField active={isOpen} />
          </motion.div>

          {/* Modal content container */}
          <motion.div
            className={styles.content}
            initial={prefersReduced ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
            transition={prefersReduced ? { duration: 0 } : { type: 'spring', bounce: 0.3, duration: 0.5 }}
          >
            <div className={styles.box}>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(node, portalElRef.current);
}
