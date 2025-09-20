/*───────────────────────────────────────────────
  Property of CKS  © 2025
───────────────────────────────────────────────*/
/**
 * File: Scrollbar.tsx
 *
 * Description:
 * Lightweight scrollable container with scoped custom scrollbar styles.
 *
 * Responsibilities:
 * - Provide cross-browser scrollbar styling via injected CSS
 * - Scope styles with configurable class to avoid global leaks
 * - Offer a simple wrapper for vertical scroll areas
 *
 * Role in system:
 * - Shared UI utility used across hubs and surfaces
 *
 * Notes:
 * - Avoids global CSS; styles injected once per class
 * - Defaults to 'hub-scroll' but is configurable
 */
/*───────────────────────────────────────────────*/
//  Manifested by Freedom_EXE
/*───────────────────────────────────────────────*/
import React, { useEffect } from 'react';

export type ScrollbarProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Optional class to scope scrollbar styles; defaults to 'hub-scroll' */
  scrollbarClassName?: string;
};

export function Scrollbar({ scrollbarClassName = 'hub-scroll', className, style, ...rest }: ScrollbarProps) {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const styleId = `__scrollbar_style__${scrollbarClassName}`;
    if (document.getElementById(styleId)) return;

    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = `
      .${scrollbarClassName} { scrollbar-width: auto; scrollbar-color: #cbd5e1 transparent; }
      .${scrollbarClassName}::-webkit-scrollbar { width: 12px; height: 12px; }
      .${scrollbarClassName}::-webkit-scrollbar-track { background: transparent; }
      .${scrollbarClassName}::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 6px; }
      .${scrollbarClassName}::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    `;
    document.head.appendChild(styleEl);
  }, [scrollbarClassName]);

  const combinedClass = scrollbarClassName + (className ? ` ${className}` : '');

  return (
    <div
      className={combinedClass}
      style={{ overflowY: 'auto', overscrollBehavior: 'contain', ...style }}
      {...rest}
    />
  );
}

export default Scrollbar;
